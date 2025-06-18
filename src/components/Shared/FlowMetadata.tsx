import { useState, useContext } from "react";
import { FlowContext } from "@/contexts/FlowContext";

interface FlowMetadataProps {
  onClick?: (nodeType: string) => void;
  mode: "setup" | "compact";
}

const FlowMetadata = ({ onClick, mode }: FlowMetadataProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const flowContext = useContext(FlowContext);

  if (!flowContext) {
    throw new Error("FlowMetadata must be used within a FlowProvider");
  }

  const { metadata, updateMetadata } = flowContext;

  if (mode === "setup") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white transition-colors duration-500 p-8 border-2 border-blue-200 rounded-xl cursor-pointer max-w-2xl w-full mx-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
              Set Up Your Flow
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Title
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => updateMetadata({ title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter slide title..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Index
                </label>
                <input
                  type="number"
                  value={metadata.slide_idx}
                  onChange={(e) =>
                    updateMetadata({ slide_idx: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter slide index..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutor Opening Phrase
                </label>
                <textarea
                  value={metadata.tutor_opening_phrase}
                  onChange={(e) =>
                    updateMetadata({ tutor_opening_phrase: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter the tutor's opening phrase..."
                  rows={3}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => onClick?.("control-point")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors duration-200"
            >
              Start Building Your Flow
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compact mode
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => updateMetadata({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter flow title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slide Index
            </label>
            <input
              type="number"
              value={metadata.slide_idx}
              onChange={(e) =>
                updateMetadata({ slide_idx: parseInt(e.target.value) })
              }
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter slide index..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tutor Opening Phrase
            </label>
            <textarea
              value={metadata.tutor_opening_phrase || ""}
              onChange={(e) =>
                updateMetadata({ tutor_opening_phrase: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter the tutor's opening phrase..."
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-800 text-sm">
              {metadata.title || "Untitled Flow"}
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:text-blue-600 text-xs"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowMetadata;
