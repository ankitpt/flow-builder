import { useCallback, useState, useEffect } from "react";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { useNavigate } from "react-router-dom";
import { idManager } from "@/utils/idManager";
import { useHistoryContext } from "@/contexts/HistoryContext";

export function useFlowOperations() {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { resetHistory } = useHistoryContext();
  const navigate = useNavigate();

  // Notification state
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [tooltipType, setTooltipType] = useState<"success" | "error">(
    "success",
  );

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const showNotification = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setTooltipMessage(message);
      setTooltipType(type);
      setShowTooltip(true);
    },
    [],
  );

  const resetFlow = useCallback(() => {
    idManager.resetAll();
    setNodes([]);
    setEdges([]);
    resetHistory();
  }, [setNodes, setEdges, resetHistory]);

  const exportFlow = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();
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
  }, [getNodes, getEdges]);

  const importFlow = useCallback(() => {
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
              setNodes(flowData.nodes);
              setEdges(flowData.edges);
              showNotification("Flow imported successfully!");
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
  }, [setNodes, setEdges, showNotification]);

  const saveFlow = useCallback(async () => {
    try {
      const nodes = getNodes();
      const edges = getEdges();
      const flowData: { nodes: Node[]; edges: Edge[] } = { nodes, edges };

      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Please log in to save flows", "error");
        return;
      }

      // Get flowId from URL if it exists
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
            name: `Flow ${new Date().toLocaleString()}`,
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
        } else {
          throw new Error("Failed to save flow");
        }
        return;
      }

      const savedFlow = await response.json();
      showNotification("Flow saved successfully!");

      // If this was a new flow, redirect to the flow's URL
      if (!isExistingFlow) {
        navigate(`/builder/${savedFlow.id}`);
      }
    } catch (error) {
      console.error("Error saving flow:", error);
      showNotification("Failed to save flow", "error");
    }
  }, [getNodes, getEdges, navigate, showNotification]);

  return {
    resetFlow,
    saveFlow,
    exportFlow,
    importFlow,
    notification: {
      showTooltip,
      tooltipMessage,
      tooltipType,
    },
  };
}
