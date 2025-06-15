// import { MdOutlineAddCircle } from "react-icons/md";
import { FaPlus } from "react-icons/fa6";

const NodeIcon = ({
  type,
  label,
  collapsed,
  title,
}: {
  type: string;
  label: string;
  collapsed: boolean;
  title?: string;
}) => {
  return (
    <button
      className={`rounded-xl p-2 hover:text-gray-600 transition-colors flex flex-row items-center gap-4 node-icon ${type} w-full text-center`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/node-type", type);
      }}
      title={title}
    >
      {/* {type === "control-point" ? (
        <MdOutlineAddCircle className="text-lg text-blue-500" />
      ) : type === "action" ? (
        <MdOutlineAddCircle className="text-lg text-green-500" />
      ) : type === "conditional" ? (
        <MdOutlineAddCircle className="text-lg text-purple-500" />
      ) : (
        <MdOutlineAddCircle className="text-lg text-gray-500" />
      )} */}
      {collapsed ? (
        <p className="text-center w-full">
          <FaPlus className="text-gray-500" />
        </p>
      ) : (
        <p className="text-center w-full">{label}</p>
      )}
    </button>
  );
};

export default NodeIcon;
