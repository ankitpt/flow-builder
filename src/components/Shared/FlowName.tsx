import { useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";

interface FlowNameProps {
  flowId: string;
  name: string;
  onNameChange: (flowId: string, newName: string) => Promise<void>;
}

const FlowName = ({ flowId, name, onNameChange }: FlowNameProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleEditName = async () => {
    await onNameChange(flowId, editName);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex-1 flex items-center gap-2 w-full">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 px-2 py-1 border rounded text-gray-700"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleEditName();
            } else if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
        />
        <button
          onClick={handleEditName}
          className="p-1.5 text-green-500 hover:text-green-600 transition-colors"
          title="Save"
        >
          <FiCheck />
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
          title="Cancel"
        >
          <FiX />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <span className="block truncate text-gray-700 hover:text-blue-600 font-medium">
        {name}
      </span>
      <button
        onClick={() => {
          setIsEditing(true);
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
