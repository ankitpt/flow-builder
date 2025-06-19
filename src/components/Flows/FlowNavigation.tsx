import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiTrash2, FiUpload, FiShare2 } from "react-icons/fi";
import FlowPreview from "./FlowPreview";
import { Flow } from "../../nodes/types";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { Node, ReactFlowProvider } from "@xyflow/react";
import { getLayoutedElements } from "@/utils/layout";
import FlowName from "../Shared/FlowName";
import ShareModal from "../Shared/ShareModal";
import Dropdown from "../Shared/Dropdown";
import { useFlow } from "@/hooks/useFlow";

const FlowNavigation = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [shareModalFlow, setShareModalFlow] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>("");
  const { handleEditName } = useFlow();

  const fetchFlows = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view your flows");
        return;
      }

      const response = await fetch("/api/flows", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please log in again.");
          return;
        }
        throw new Error("Failed to fetch flows");
      }
      const data = await response.json();
      setFlows(data);
      console.log("Fetched flows:", data);
    } catch (error) {
      console.error("Error fetching flows:", error);
      setError("Failed to load flows");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm("Are you sure you want to delete this flow?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to delete flows");
        return;
      }

      const response = await fetch(`/api/flow/${flowId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete flow");
      }

      // Remove the deleted flow from the state
      setFlows(flows.filter((flow) => flow.id !== flowId));
    } catch (error) {
      console.error("Error deleting flow:", error);
      setError("Failed to delete flow");
    }
  };

  const handleNameChange = async (flowId: string, newName: string) => {
    await handleEditName(flowId, newName);
    // Update the flow name in the state
    setFlows(
      flows.map((flow) =>
        flow.id === flowId ? { ...flow, name: newName } : flow,
      ),
    );
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const flowData = JSON.parse(event.target?.result as string);
            if (flowData.nodes && flowData.edges) {
              // Assign positions if missing
              const needsLayout = flowData.nodes.some(
                (node: Node) =>
                  !node.position ||
                  node.position.x === undefined ||
                  node.position.y === undefined,
              );
              let nodes = flowData.nodes;
              let edges = flowData.edges;
              if (needsLayout) {
                const layouted = getLayoutedElements(nodes, edges, "LR");
                nodes = layouted.nodes;
                edges = layouted.edges;
              }
              const token = localStorage.getItem("token");
              if (!token) {
                setError("Please log in to import flows");
                return;
              }

              const response = await fetch("/api/flow", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: `Imported Flow ${new Date().toLocaleString()}`,
                  flow: { nodes, edges },
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to save imported flow");
              }

              // Just fetch the latest data
              console.log("Fetching latest data");
              await fetchFlows();
            }
          } catch (error) {
            console.error("Error importing flow:", error);
            setError("Failed to import flow");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    console.log("Fetching flows on mount");
    fetchFlows();
  }, []);

  // Create dropdown options for owner filter
  const ownerOptions = useMemo(() => {
    const options = [
      { value: "", label: "All Flows" },
      { value: "owned", label: "Owned by Me" },
      { value: "shared", label: "Shared with Me" },
    ];
    return options;
  }, []);

  // Filter flows based on selected owner filter
  const filteredFlows = useMemo(() => {
    if (!selectedOwnerFilter) {
      return flows;
    }

    // Get current user ID from the stored profile
    const userProfile = localStorage.getItem("user_profile");
    const currentUserId = userProfile ? JSON.parse(userProfile).id : null;

    if (selectedOwnerFilter === "owned") {
      return flows.filter((flow) => flow.user?.id === currentUserId);
    } else if (selectedOwnerFilter === "shared") {
      return flows.filter((flow) => flow.user?.id !== currentUserId);
    }

    return flows;
  }, [flows, selectedOwnerFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Flows</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleImport}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <FiUpload />
            Import
          </button>
          <Link
            to="/builder"
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
          >
            New Flow
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Dropdown
              options={ownerOptions}
              value={selectedOwnerFilter}
              onChange={setSelectedOwnerFilter}
              placeholder="All Flows"
            />
          </div>
          {selectedOwnerFilter && (
            <span className="text-sm text-gray-500">
              Showing {filteredFlows.length} of {flows.length} flows
            </span>
          )}
        </div>
      </div>

      {filteredFlows.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {selectedOwnerFilter === "owned"
            ? "No flows owned by you."
            : selectedOwnerFilter === "shared"
              ? "No flows shared with you."
              : "No flows yet. Create your first flow!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlows.map((flow) => {
            console.log("Rendering flow:", flow);
            return (
              <div
                key={flow.id}
                className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
              >
                <Link to={`/builder/${flow.id}`} className="block">
                  <ReactFlowProvider>
                    <HistoryProvider>
                      <FlowPreview
                        nodes={flow.flow?.nodes || []}
                        edges={flow.flow?.edges || []}
                      />
                    </HistoryProvider>
                  </ReactFlowProvider>
                </Link>
                <div className="p-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <FlowName
                        flowId={flow.id}
                        name={flow.name}
                        onNameChange={handleNameChange}
                        onEditingChange={(isEditing) =>
                          setEditingFlowId(isEditing ? flow.id : null)
                        }
                      />
                      {/* Show owner information */}
                    </div>

                    {editingFlowId !== flow.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShareModalFlow({ id: flow.id, name: flow.name });
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Share"
                        >
                          <FiShare2 />
                        </button>
                        {/* Only show delete button for owned flows */}
                        {(() => {
                          const userProfile =
                            localStorage.getItem("user_profile");
                          const currentUserId = userProfile
                            ? JSON.parse(userProfile).id
                            : null;
                          return flow.user?.id === currentUserId;
                        })() && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteFlow(flow.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {flow.user && (
                    <div className="text-xs text-gray-500 mt-1">
                      Owner: {flow.user.name || flow.user.email}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Last updated:{" "}
                    {new Date(flow.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shareModalFlow && (
        <ShareModal
          isOpen={!!shareModalFlow}
          onClose={() => setShareModalFlow(null)}
          flowId={shareModalFlow.id}
          flowName={shareModalFlow.name}
        />
      )}
    </div>
  );
};

export default FlowNavigation;
