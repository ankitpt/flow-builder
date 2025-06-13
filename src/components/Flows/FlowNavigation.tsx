import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit2, FiTrash2, FiCheck, FiX, FiUpload } from "react-icons/fi";
import FlowPreview from "./FlowPreview";
import { Flow } from "../../nodes/types";

const FlowNavigation = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [flows, setFlows] = useState<Flow[]>([]);

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

  const handleEditName = async (flowId: string, newName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to edit flows");
        return;
      }

      const response = await fetch(`/api/flow/${flowId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          flow: flows.find((f) => f.id === flowId)?.flow, // Preserve existing flow data
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update flow name");
      }

      // Update the flow name in the state
      setFlows(
        flows.map((flow) =>
          flow.id === flowId ? { ...flow, name: newName } : flow,
        ),
      );
      setEditingFlowId(null);
    } catch (error) {
      console.error("Error updating flow name:", error);
      setError("Failed to update flow name");
    }
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
                  flow: flowData,
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

      {flows.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No flows yet. Create your first flow!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow) => {
            console.log("Rendering flow:", flow);
            return (
              <div
                key={flow.id}
                className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
              >
                <Link to={`/builder/${flow.id}`} className="block">
                  <FlowPreview
                    nodes={flow.flow?.nodes || []}
                    edges={flow.flow?.edges || []}
                  />
                </Link>
                <div className="p-3 border-t">
                  <div className="flex items-center justify-between">
                    {editingFlowId === flow.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-gray-700"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditName(flow.id, editName);
                            } else if (e.key === "Escape") {
                              setEditingFlowId(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleEditName(flow.id, editName)}
                          className="p-1.5 text-green-500 hover:text-green-600 transition-colors"
                          title="Save"
                        >
                          <FiCheck />
                        </button>
                        <button
                          onClick={() => setEditingFlowId(null)}
                          className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                          title="Cancel"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Link
                          to={`/builder/${flow.id}`}
                          className="flex-1 truncate text-gray-700 hover:text-blue-600 font-medium"
                        >
                          {flow.name}
                        </Link>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingFlowId(flow.id);
                              setEditName(flow.name);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Edit Name"
                          >
                            <FiEdit2 />
                          </button>
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
                        </div>
                      </>
                    )}
                  </div>
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
    </div>
  );
};

export default FlowNavigation;
