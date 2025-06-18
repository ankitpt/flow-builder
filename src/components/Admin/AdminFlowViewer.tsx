import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, Background, Controls, Node, Edge } from "@xyflow/react";
import { FiArrowLeft, FiLogOut } from "react-icons/fi";
import { useNotification } from "@/contexts/NotificationContext";
import ToolbarNode from "@/nodes/ToolbarNode";
import { ToolbarEdge } from "@/edges/ToolbarEdge";

interface AdminFlow {
  id: string;
  name: string;
  flow: {
    nodes: Node[];
    edges: Edge[];
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
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
          <div className="text-sm text-gray-500 bg-yellow-100 px-2 py-1 rounded">
            Read-Only Mode
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 flex items-center gap-1"
          >
            <FiLogOut />
            Logout
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
