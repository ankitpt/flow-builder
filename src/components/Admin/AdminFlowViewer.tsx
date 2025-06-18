import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import { FiArrowLeft } from "react-icons/fi";
import { TbFileImport } from "react-icons/tb";
import { useNotification } from "@/contexts/NotificationContext";
import ToolbarNode from "@/nodes/ToolbarNode";
import { ToolbarEdge } from "@/edges/ToolbarEdge";
import { Flow } from "@/nodes/types";

// Extended Flow type for admin view with user information
interface AdminFlow extends Flow {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const AdminFlowViewer: React.FC = () => {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [flow, setFlow] = useState<AdminFlow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nodeTypes = useMemo(
    () => ({
      toolbar: ToolbarNode,
    }),
    [],
  );

  const edgeTypes = useMemo(
    () => ({
      toolbar: ToolbarEdge,
    }),
    [],
  );

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken) {
          setError("Admin access required");
          navigate("/admin");
          return;
        }

        const response = await fetch(`/api/admin/flow/${flowId}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Admin session expired");
            localStorage.removeItem("adminToken");
            navigate("/admin");
            return;
          }
          throw new Error("Failed to fetch flow");
        }

        const data = await response.json();
        setFlow(data);
      } catch (error) {
        console.error("Error fetching flow:", error);
        setError("Failed to load flow");
        showNotification("Failed to load flow", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (flowId) {
      fetchFlow();
    }
  }, [flowId, navigate, showNotification]);

  const handleExport = async () => {
    if (!flowId) return;

    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        showNotification("Admin access required", "error");
        return;
      }

      const response = await fetch(`/api/admin/flow/${flowId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          showNotification("Admin session expired", "error");
          return;
        }
        throw new Error("Failed to fetch flow data");
      }

      const flowData = await response.json();

      // The flow data from the database now includes the complete structure
      // with metadata, viewport, and transformed nodes/edges
      const exportData = {
        nodes: flowData.flow.nodes,
        edges: flowData.flow.edges,
        viewport: flowData.flow.viewport,
        metadata: flowData.flow.metadata,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${flowData.name}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification("Flow exported successfully");
    } catch (error) {
      console.error("Error exporting flow:", error);
      showNotification("Failed to export flow", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !flow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Flow not found"}</p>
          <button
            onClick={() => navigate("/admin/flows")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Flows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin/flows")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft />
            <span>Back to Flows</span>
          </button>
          <div className="border-l border-gray-300 h-6"></div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{flow.name}</h1>
            <p className="text-sm text-gray-500">
              Owner: {flow.user.name || flow.user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="text-2xl hover:text-blue-600 transition-colors"
            title="Export Flow"
          >
            <TbFileImport />
          </button>
        </div>
      </div>

      {/* Flow Viewer */}
      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={flow.flow.nodes}
          nodeTypes={nodeTypes}
          onNodesChange={() => {}}
          edges={flow.flow.edges}
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          preventScrolling={false}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default AdminFlowViewer;
