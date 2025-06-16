import React, { useState } from "react";
import { FaRegKeyboard } from "react-icons/fa6";

const shortcuts = [
  { keys: ["Ctrl", "C"], action: "Copy Node" },
  { keys: ["Ctrl", "V"], action: "Paste Node" },
  { keys: ["Delete"], action: "Delete Node" },
  { keys: ["Ctrl", "S"], action: "Save Flow" },
  { keys: ["Ctrl", "Z"], action: "Undo" },
  { keys: ["Ctrl", "Y"], action: "Redo" },
];

const Shortcuts: React.FC = () => {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        className="absolute top-4 left-4 z-50 bg-white rounded-xl shadow p-2 border border-gray-200 hover:bg-gray-100 transition"
        onClick={() => setOpen(true)}
        title="Show Shortcuts"
      >
        <FaRegKeyboard className="text-gray-800 text-lg" />
      </button>
    );
  }

  return (
    <div className="absolute top-4 left-4 bg-white bg-opacity-95 rounded-lg shadow p-3 z-50 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-gray-700 text-sm">Shortcuts</div>
        <button
          className="ml-2 text-gray-400 hover:text-gray-700 text-lg font-bold px-2"
          onClick={() => setOpen(false)}
          title="Close"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {shortcuts.map((s) => (
          <div
            key={s.action}
            className="flex items-center gap-2 text-gray-800 justify-between"
          >
            <div className="flex items-center gap-1">
              {s.keys.map((key, i) => (
                <React.Fragment key={key}>
                  <span className="key">{key}</span>
                  {i < s.keys.length - 1 && (
                    <span className="text-black text-xs">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <span className="text-black text-xs">{s.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shortcuts;
