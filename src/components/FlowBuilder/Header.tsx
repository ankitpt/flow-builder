import { TbFileImport } from "react-icons/tb";
import { RiResetLeftFill } from "react-icons/ri";
import { RiSave3Fill } from "react-icons/ri";
import { MdSaveAlt } from "react-icons/md";
import { FiShare2 } from "react-icons/fi";
import Auth from "../Auth";
import { useFlowOperations } from "@/hooks/useFlowOperations";
import { useFlow } from "@/hooks/useFlow";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useState } from "react";
import ShareModal from "../Shared/ShareModal";
import { useParams } from "react-router-dom";

const Header = () => {
  const { metadata, setMetadata } = useFlow();
  const { lastUpdated } = useAutoSave();
  const { resetFlow, exportFlow, importFlow, saveFlow } = useFlowOperations(
    metadata,
    setMetadata,
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { flowId } = useParams<{ flowId: string }>();

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return null;

    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) {
      // Show actual timestamp for very recent saves
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      return `${displayHours}:${displayMinutes} ${ampm}`;
    }
    if (diffInMinutes === 1) return "1 minute ago";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="flex items-center justify-end p-4 fixed top-0 left-0 w-full z-10">
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500 mr-4">
              Last saved: {formatLastUpdated(lastUpdated)}
            </div>
          )}
          <button
            onClick={resetFlow}
            className="text-2xl hover:text-blue-600 transition-colors"
            title="Reset Flow"
          >
            <RiResetLeftFill />
          </button>
          <button
            onClick={() => importFlow()}
            className="text-2xl hover:text-blue-600 transition-colors"
            title="Import Flow"
          >
            <MdSaveAlt />
          </button>
          <button
            onClick={exportFlow}
            className="text-2xl hover:text-blue-600 transition-colors"
            title="Export Flow"
          >
            <TbFileImport />
          </button>
          <div className="relative">
            <button
              onClick={saveFlow}
              className="text-2xl hover:text-blue-600 transition-colors"
              title="Save Flow"
            >
              <RiSave3Fill />
            </button>
          </div>
          {flowId && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-2xl hover:text-blue-600 transition-colors"
              title="Share Flow"
            >
              <FiShare2 />
            </button>
          )}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <Auth />
        </div>
      </div>

      {flowId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          flowId={flowId}
          flowName={metadata.title || "Untitled Flow"}
        />
      )}
    </>
  );
};

export default Header;
