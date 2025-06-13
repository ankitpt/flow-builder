import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { initialNodes } from "../../nodes";
import { initialEdges } from "../../edges";
import { useSchemaStore } from "../../store/schemaStore";
import { TbFileImport } from "react-icons/tb";
import { RiResetLeftFill } from "react-icons/ri";
import { RiSave3Fill } from "react-icons/ri";
import { MdSaveAlt } from "react-icons/md";
import Auth from "../Auth";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

const Header = () => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { setIdCounter } = useSchemaStore();
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [tooltipType, setTooltipType] = useState<"success" | "error">(
    "success",
  );

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setTooltipMessage(message);
    setTooltipType(type);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  const handleExport = () => {
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
  };

  const handleImport = () => {
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
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Invalid flow data file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleNew = () => {
    setIdCounter(1);
    setNodes([...initialNodes]);
    setEdges([...initialEdges]);
    // Navigate to the builder without a flowId
    navigate("/builder");
  };

  const handleSave = async () => {
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
          handleLogout();
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
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_profile");
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-end p-4 fixed top-0 left-0 w-full z-10">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleNew}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="New Flow"
        >
          <RiResetLeftFill />
        </button>
        <button
          onClick={handleImport}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="Import Flow"
        >
          <TbFileImport />
        </button>
        <button
          onClick={handleExport}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="Export Flow"
        >
          <MdSaveAlt />
        </button>
        <div className="relative">
          <button
            onClick={handleSave}
            className="text-2xl hover:text-blue-600 transition-colors"
            title="Save Flow"
          >
            <RiSave3Fill />
          </button>
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              tooltipType === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            } ${showTooltip ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
          >
            {tooltipMessage}
          </div>
        </div>
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <Auth />
      </div>
    </div>
  );
};

export default Header;
