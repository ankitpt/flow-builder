import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";

interface NotificationProps {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: (id: string) => void;
  count?: number;
}

const Notification = ({
  id,
  message,
  type,
  onClose,
  count,
}: NotificationProps) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <FiInfo className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`
        min-w-[300px] max-w-md p-4 rounded-lg
        ${
          type === "success"
            ? "bg-green-50 border border-green-200"
            : type === "error"
              ? "bg-red-50 border border-red-200"
              : type === "warning"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-blue-50 border border-blue-200"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <p
            className={`
            text-sm font-medium
            ${
              type === "success"
                ? "text-green-800"
                : type === "error"
                  ? "text-red-800"
                  : type === "warning"
                    ? "text-yellow-800"
                    : "text-blue-800"
            }
          `}
          >
            {message}{" "}
            {count && count > 1 ? (
              <span className="ml-1 text-xs text-gray-500">(x{count})</span>
            ) : null}
          </p>
        </div>
        <button
          onClick={() => onClose(id)}
          className={`
            flex-shrink-0 p-1 rounded-full hover:bg-opacity-10
            transition-colors duration-200
            ${
              type === "success"
                ? "hover:bg-green-200 text-green-600"
                : type === "error"
                  ? "hover:bg-red-200 text-red-600"
                  : type === "warning"
                    ? "hover:bg-yellow-200 text-yellow-600"
                    : "hover:bg-blue-200 text-blue-600"
            }
          `}
          aria-label="Close notification"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default Notification;
