import { useState, useEffect, useCallback } from "react";
import { FiX, FiUserPlus, FiUsers, FiTrash2 } from "react-icons/fi";
import { CollaboratorRole } from "@/nodes/types";

interface Collaborator {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  role: CollaboratorRole;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowId: string;
  flowName: string;
}

const ShareModal = ({ isOpen, onClose, flowId, flowName }: ShareModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>(CollaboratorRole.EDITOR);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [currentUserRole, setCurrentUserRole] =
    useState<CollaboratorRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/flow/${flowId}/collaborators`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
        setCurrentUserRole(data.currentUserRole);
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    }
  }, [flowId]);

  const handleShare = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to share flows");
        return;
      }

      const response = await fetch(`/api/flow/${flowId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (response.ok) {
        setSuccess(`Added ${email} as collaborator`);
        setEmail("");
        await fetchCollaborators();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add collaborator");
      }
    } catch (error) {
      console.error("Error sharing flow:", error);
      setError("Failed to add collaborator");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `/api/flow/${flowId}/collaborator/${collaboratorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        await fetchCollaborators();
        setSuccess("Collaborator removed successfully");
      }
    } catch (error) {
      console.error("Error removing collaborator:", error);
      setError("Failed to remove collaborator");
    }
  };

  const handleUpdateRole = async (
    collaboratorId: string,
    newRole: CollaboratorRole,
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `/api/flow/${flowId}/collaborator/${collaboratorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (response.ok) {
        await fetchCollaborators();
        setSuccess("Role updated successfully");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setError("Failed to update role");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, fetchCollaborators]);

  if (!isOpen) return null;

  const isOwner = currentUserRole === CollaboratorRole.OWNER;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Flow</h2>
            <p className="text-sm text-gray-600 mt-1">{flowName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Share Form - Only show for owners */}
          {isOwner ? (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Collaborator
              </h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === "Enter" && handleShare()}
                  />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={CollaboratorRole.EDITOR}>Can edit</option>
                </select>
                <button
                  onClick={handleShare}
                  disabled={isLoading || !email.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <FiUserPlus />
                  {isLoading ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                Only the flow owner can add collaborators.
              </p>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              {success}
            </div>
          )}

          {/* Collaborators */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FiUsers />
              Collaborators ({collaborators.length})
            </h3>
            {collaborators.length === 0 ? (
              <p className="text-gray-500 text-sm">No collaborators yet</p>
            ) : (
              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      {collaborator.user.picture ? (
                        <img
                          src={collaborator.user.picture}
                          alt={collaborator.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm text-gray-600">
                            {collaborator.user.name?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {collaborator.user.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {collaborator.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {collaborator.role !== CollaboratorRole.OWNER &&
                        isOwner && (
                          <>
                            <select
                              value={collaborator.role}
                              onChange={(e) =>
                                handleUpdateRole(
                                  collaborator.id,
                                  e.target.value as CollaboratorRole,
                                )
                              }
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value={CollaboratorRole.EDITOR}>
                                Editor
                              </option>
                            </select>
                            <button
                              onClick={() =>
                                handleRemoveCollaborator(collaborator.id)
                              }
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove collaborator"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </>
                        )}
                      {collaborator.role === CollaboratorRole.OWNER && (
                        <span className="text-sm text-gray-500 px-2 py-1 bg-gray-200 rounded">
                          Owner
                        </span>
                      )}
                      {collaborator.role !== CollaboratorRole.OWNER &&
                        !isOwner && (
                          <span className="text-sm text-gray-500 px-2 py-1 bg-gray-200 rounded">
                            {collaborator.role === CollaboratorRole.EDITOR
                              ? "Editor"
                              : "Viewer"}
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
