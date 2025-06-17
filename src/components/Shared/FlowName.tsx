import { useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";

interface FlowNameProps {
  flowId: string;
  name: string;
  onNameChange: (flowId: string, newName: string) => Promise<void>;
  onEditingChange?: (isEditing: boolean) => void;
}

const FlowName = ({
  flowId,
  name,
  onNameChange,
  onEditingChange,
}: FlowNameProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleEditName = async () => {
    await onNameChange(flowId, editName);
    setIsEditing(false);
    onEditingChange?.(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1 border rounded text-gray-700 truncate"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleEditName();
            } else if (e.key === "Escape") {
              setIsEditing(false);
              onEditingChange?.(false);
            }
          }}
        />
        <button
          onClick={handleEditName}
          className="flex-shrink-0 p-1.5 text-green-500 hover:text-green-600 transition-colors"
          title="Save"
        >
          <FiCheck />
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            onEditingChange?.(false);
          }}
          className="flex-shrink-0 p-1.5 text-gray-500 hover:text-red-600 transition-colors"
          title="Cancel"
        >
          <FiX />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <Link
        to={`/builder/${flowId}`}
        className="block truncate text-gray-700 hover:text-blue-600 font-medium"
      >
        {name}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsEditing(true);
          onEditingChange?.(true);
          setEditName(name);
        }}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
        title="Edit Name"
      >
        <FiEdit2 />
      </button>
    </div>
  );
};

export default FlowName;
