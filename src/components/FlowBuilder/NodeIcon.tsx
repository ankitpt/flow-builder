import { MdOutlineAddCircle } from "react-icons/md";

const NodeIcon = ({ type, label }: { type: string; label: string }) => {
  return (
    <button
      className="p-2 text-gray-500 hover:text-gray-600 transition-colors flex flex-row items-center gap-4"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/node-type", type);
      }}
    >
      {type === "control-point" ? (
        <MdOutlineAddCircle className="text-lg text-blue-500" />
      ) : (
        <MdOutlineAddCircle className="text-lg text-green-500" />
      )}
      <p>{label}</p>
    </button>
  );
};

export default NodeIcon;
