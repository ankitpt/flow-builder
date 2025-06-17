import { useCallback } from "react";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { useNavigate } from "react-router-dom";
import { useHistoryContext } from "../contexts/HistoryContext";
import { useNotification } from "../contexts/NotificationContext";
import { getLayoutedElements } from "../utils/layout";
import { AppNode, HistoryAction } from "../nodes/types";
import { validateGraph } from "../utils/validate";

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

export function useFlowOperations() {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { resetHistory, addToHistory } = useHistoryContext();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const resetFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    resetHistory();
    showNotification("Flow has been reset");
  }, [setNodes, setEdges, resetHistory, showNotification]);

  const exportFlow = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();

    // Validate flow before exporting
    if (!validateAndShowErrors(nodes, edges, showNotification)) {
      showNotification("Cannot export flow with validation issues", "error");
      // return; // Prevent export if validation fails
    }

    const flowData = {
      nodes,
      edges,
    };
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
  }, [getNodes, getEdges, showNotification]);

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
              const flowData = JSON.parse(event.target?.result as string);
              if (flowData.nodes && flowData.edges) {
                // Check if any node has position data
                const hasPositionData = flowData.nodes.some(
                  (node: Node) =>
                    node.position?.x !== undefined &&
                    node.position?.y !== undefined,
                );

                if (hasPositionData) {
                  // If nodes have position data, use them as is
                  setNodes(flowData.nodes);
                  setEdges(flowData.edges);
                } else {
                  // If no position data, apply layout
                  layoutFlow(
                    flowData.nodes,
                    flowData.edges,
                    options?.direction ?? "LR",
                  );
                }
              }
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
    [layoutFlow, setNodes, setEdges, showNotification],
  );

  const saveFlow = useCallback(async () => {
    try {
      const nodes = getNodes();
      const edges = getEdges();
      const flowData: { nodes: Node[]; edges: Edge[] } = { nodes, edges };

      // Validate flow before saving
      validateAndShowErrors(nodes, edges, showNotification);

      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Please log in to save flows", "error");
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
          showNotification(
            "Your session has expired. Please log in again.",
            "error",
          );
        } else if (response.status === 404) {
          showNotification(
            "Flow not found. It may have been deleted.",
            "error",
          );
        } else {
          throw new Error("Failed to save flow");
        }
        return;
      }

      const savedFlow = await response.json();
      showNotification("Flow saved successfully!", "success");

      if (!isExistingFlow) {
        navigate(`/builder/${savedFlow.id}`);
      }
    } catch (error) {
      console.error("Error saving flow:", error);
      showNotification("Failed to save flow. Please try again.", "error");
    }
  }, [getNodes, getEdges, navigate, showNotification]);

  return {
    resetFlow,
    saveFlow,
    exportFlow,
    importFlow,
    layoutFlow,
  };
}
