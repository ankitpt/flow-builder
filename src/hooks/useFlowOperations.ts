import { useCallback } from "react";
import {
  useReactFlow,
  type Node,
  type Edge,
  type Viewport,
} from "@xyflow/react";
import { useNavigate } from "react-router-dom";
import { useHistoryContext } from "../contexts/HistoryContext";
import { useNotification } from "../contexts/NotificationContext";
import { getLayoutedElements } from "../utils/layout";
import { AppNode, HistoryAction } from "../nodes/types";
import { validateGraph } from "../utils/validate";
import { FlowMetadata } from "../contexts/FlowContext";
import { initialNodes } from "../nodes";
import { initialEdges } from "../edges";
import ToolbarNode from "../nodes/ToolbarNode";
import { useFlow } from "./useFlow";

// Extended flow data type with metadata
export type ExtendedFlowData = {
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
  metadata?: FlowMetadata;
};

const validateAndShowErrors = (
  nodes: Node[],
  edges: Edge[],
  showNotification: (
    message: string,
    type?: "success" | "error" | "warning",
  ) => void,
): boolean => {
  const validation = validateGraph(nodes as AppNode[], edges as Edge[]);
  if (!validation.isValid) {
    validation.errorMessages.forEach((errorMessage) => {
      showNotification(errorMessage, "warning");
    });
  }
  return validation.isValid;
};

export function useFlowOperations(
  flowMetadata?: FlowMetadata,
  setMetadata?: (metadata: FlowMetadata) => void,
) {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { resetHistory, addToHistory } = useHistoryContext();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { setLastUpdated } = useFlow();

  // Helper function to prepare flow data with transformed nodes/edges and metadata
  const prepareFlowData = useCallback((): ExtendedFlowData => {
    return {
      nodes: getNodes(),
      edges: getEdges(),
      metadata: flowMetadata || undefined,
    };
  }, [getNodes, getEdges, flowMetadata]);

  const loadFlow = useCallback(
    async (flowId?: string) => {
      if (!flowId) {
        setNodes(initialNodes);
        setEdges(initialEdges);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          setNodes(initialNodes);
          setEdges(initialEdges);
          return;
        }

        const response = await fetch(`/api/flow/${flowId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error("Authentication failed");
            setNodes(initialNodes);
            setEdges(initialEdges);
            return;
          }
          throw new Error("Failed to fetch flow");
        }

        const flowData = await response.json();
        if (flowData.flow) {
          const {
            nodes: flowNodes,
            edges: flowEdges,
            metadata: flowMetadata,
          } = flowData.flow;
          const typedNodes = flowNodes.map((node: AppNode) => ({
            ...node,
            type: node.type || "toolbar",
            data: {
              ...node.data,
              schema:
                node.type === "toolbar"
                  ? (node.data as ToolbarNode["data"]).schema
                  : null,
            },
          })) as AppNode[];

          setNodes(typedNodes);
          setEdges(flowEdges);

          // Set metadata if it exists in the flow data
          if (flowMetadata && setMetadata) {
            setMetadata(flowMetadata);
          }
        }
      } catch (error) {
        console.error("Error loading flow:", error);
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    },
    [setNodes, setEdges, setMetadata],
  );

  const resetFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    resetHistory();
    // Clear metadata to initial state
    if (setMetadata) {
      setMetadata({
        title: "",
        slide_idx: 0,
        tutor_opening_phrase: "",
      });
    }
    showNotification("Flow has been reset");
  }, [setNodes, setEdges, resetHistory, setMetadata, showNotification]);

  const exportFlow = useCallback(() => {
    const flowData = prepareFlowData();

    // Validate flow before exporting
    if (
      !validateAndShowErrors(flowData.nodes, flowData.edges, showNotification)
    ) {
      showNotification("Cannot export flow with validation issues", "error");
      // return;
    }

    const jsonString = JSON.stringify(flowData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flow_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Flow exported successfully");
  }, [prepareFlowData, showNotification]);

  const layoutFlow = useCallback(
    (nodes: Node[], edges: Edge[], direction: "TB" | "LR" = "TB") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);

      // Store the previous state for undo/redo
      const previousState = {
        nodes: nodes,
        edges: edges,
      };

      // Add to history before applying the layout
      addToHistory({
        action: HistoryAction.LayoutFlow,
        data: {
          previousState,
          newState: {
            nodes: layoutedNodes,
            edges: layoutedEdges,
          },
          direction,
        },
      });

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [setNodes, setEdges, showNotification, addToHistory],
  );

  // Helper function to apply imported flow data
  const applyImportedFlowData = useCallback(
    (flowData: ExtendedFlowData, options?: { direction?: "TB" | "LR" }) => {
      if (flowData.nodes && flowData.edges) {
        // Check if any node has position data
        const hasPositionData = flowData.nodes.some(
          (node: Node) =>
            node.position?.x !== undefined && node.position?.y !== undefined,
        );

        if (hasPositionData) {
          // If nodes have position data, use them as is
          setNodes(flowData.nodes);
          setEdges(flowData.edges);

          // Set viewport if available
          if (flowData.viewport) {
            // Note: You might need to implement viewport setting logic
            // depending on your React Flow version
            console.log("Viewport data available:", flowData.viewport);
          }
        } else {
          // If no position data, apply layout
          layoutFlow(
            flowData.nodes,
            flowData.edges,
            options?.direction ?? "LR",
          );
        }

        // Set metadata if available
        if (flowData.metadata && setMetadata) {
          setMetadata(flowData.metadata);
          console.log("Flow metadata imported:", flowData.metadata);
          showNotification(`Imported: ${flowData.metadata.title}`, "success");
        }
      }
    },
    [setNodes, setEdges, setMetadata, showNotification],
  );

  const importFlow = useCallback(
    (options?: { direction?: "TB" | "LR" }) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const flowData: ExtendedFlowData = JSON.parse(
                event.target?.result as string,
              );
              applyImportedFlowData(flowData, options);
            } catch (error) {
              console.error("Error parsing JSON:", error);
              showNotification("Invalid flow data file", "error");
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    },
    [applyImportedFlowData, showNotification],
  );

  // Shared helper function for the actual save logic
  const performSave = useCallback(
    async (showNotifications: boolean) => {
      try {
        const flowData = prepareFlowData();

        // Validate flow before saving
        if (showNotifications) {
          validateAndShowErrors(
            flowData.nodes,
            flowData.edges,
            showNotification,
          );
        } else {
          // For auto-save, just log validation issues without showing notifications
          const validation = validateGraph(
            flowData.nodes as AppNode[],
            flowData.edges as Edge[],
          );
          if (!validation.isValid) {
            console.warn(
              "Auto-save: Flow has validation issues:",
              validation.errorMessages,
            );
          }
        }

        const token = localStorage.getItem("token");
        if (!token) {
          if (showNotifications) {
            showNotification("Please log in to save flows", "error");
          } else {
            console.error("Auto-save: No authentication token found");
          }
          return;
        }

        const flowId = window.location.pathname.split("/").pop();
        const isExistingFlow = flowId && flowId !== "builder";

        const response = await fetch(
          `/api/flow${isExistingFlow ? `/${flowId}` : ""}`,
          {
            method: isExistingFlow ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: isExistingFlow
                ? undefined
                : `New Flow ${new Date().toLocaleString()}`,
              flow: flowData,
            }),
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            if (showNotifications) {
              showNotification(
                "Your session has expired. Please log in again.",
                "error",
              );
            } else {
              console.error("Auto-save: Authentication failed");
            }
          } else if (response.status === 404) {
            if (showNotifications) {
              showNotification(
                "Flow not found. It may have been deleted.",
                "error",
              );
            } else {
              console.error("Auto-save: Flow not found");
            }
          } else {
            throw new Error("Failed to save flow");
          }
          return;
        }

        const savedFlow = await response.json();

        // Only show notification if requested
        if (showNotifications) {
          showNotification("Flow saved successfully!", "success");
        }

        // Update last updated timestamp
        setLastUpdated(new Date());

        if (!isExistingFlow) {
          navigate(`/builder/${savedFlow.id}`);
        }
      } catch (error) {
        console.error("Error saving flow:", error);
        if (showNotifications) {
          showNotification("Failed to save flow. Please try again.", "error");
        }
      }
    },
    [prepareFlowData, navigate, showNotification, setLastUpdated],
  );

  // Manual save with notifications
  const saveFlow = useCallback(async () => {
    await performSave(true);
  }, [performSave]);

  // Auto-save without notifications
  const autoSaveFlow = useCallback(async () => {
    await performSave(false);
  }, [performSave]);

  return {
    resetFlow,
    saveFlow,
    autoSaveFlow,
    exportFlow,
    importFlow,
    layoutFlow,
    loadFlow,
  };
}
