import { FaRegEdit } from "react-icons/fa";

const NodeIcon = ({ type, label }: { type: string; label: string }) => {
  return (
    <button
      className="p-2 text-gray-500 hover:text-gray-600 transition-colors flex flex-row items-center gap-4"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/node-type", type);
      }}
    >
      <FaRegEdit className="text-lg text-blue-500" />
      <p>{label}</p>
    </button>
  );
};

export default NodeIcon;
