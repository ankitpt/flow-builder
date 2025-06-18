import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import FlowPreview from "../Flows/FlowPreview";
import Dropdown from "../Shared/Dropdown";
import { Flow } from "../../nodes/types";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { ReactFlowProvider } from "@xyflow/react";

interface AdminFlow extends Flow {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const AdminFlows: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flows, setFlows] = useState<AdminFlow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const navigate = useNavigate();

  const fetchAdminFlows = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        setError("Admin access required");
        navigate("/admin");
        return;
      }

      const response = await fetch("/api/admin/flows", {
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
        throw new Error("Failed to fetch flows");
      }

      const data = await response.json();
      setFlows(data);
      console.log("Fetched admin flows:", data);
    } catch (error) {
      console.error("Error fetching admin flows:", error);
      setError("Failed to load flows");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  useEffect(() => {
    console.log("Fetching admin flows on mount");
    fetchAdminFlows();
  }, []);

  // Get unique users from flows
  const users = useMemo(() => {
    const userMap = new Map<
      string,
      { id: string; name: string; email: string }
    >();

    flows.forEach((flow) => {
      if (!userMap.has(flow.user.id)) {
        userMap.set(flow.user.id, {
          id: flow.user.id,
          name: flow.user.name || flow.user.email,
          email: flow.user.email,
        });
      }
    });

    return Array.from(userMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [flows]);

  // Create dropdown options
  const userOptions = useMemo(() => {
    const options = [
      { value: "", label: "All Users" },
      ...users.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    ];
    return options;
  }, [users]);

  // Filter flows based on selected user
  const filteredFlows = useMemo(() => {
    if (!selectedUserId) {
      return flows;
    }
    return flows.filter((flow) => flow.user.id === selectedUserId);
  }, [flows, selectedUserId]);

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
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Admin Dashboard - All Flows (Read-Only)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Viewing all flows in the system. No modifications allowed.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Dropdown
              options={userOptions}
              value={selectedUserId}
              onChange={setSelectedUserId}
              placeholder="All Users"
            />
          </div>
          {selectedUserId && (
            <span className="text-sm text-gray-500">
              Showing {filteredFlows.length} of {flows.length} flows
            </span>
          )}
        </div>
      </div>

      {filteredFlows.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {selectedUserId
            ? "No flows found for the selected user."
            : "No flows found in the system."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlows.map((flow) => (
            <div
              key={flow.id}
              className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
            >
              <Link to={`/admin/view/${flow.id}`} className="block">
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
                    <h3 className="font-medium text-gray-900 truncate">
                      {flow.name}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                      Owner: {flow.user.name || flow.user.email}
                    </div>
                  </div>
                  <div className="flex items-center text-blue-600 text-sm">
                    <FiEye className="mr-1" />
                    View
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(flow.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFlows;
