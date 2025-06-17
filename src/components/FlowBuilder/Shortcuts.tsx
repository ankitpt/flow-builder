import React from "react";
import { SHORTCUTS } from "@/nodes/constants";

const Shortcuts: React.FC = () => {
  return (
    <div className="rounded-lg p-2 z-50 min-w-[200px]">
      <div className="font-bold text-gray-700 text-sm mb-2">Shortcuts</div>
      <div className="flex flex-col gap-2">
        {SHORTCUTS.map((s) => (
          <div
            key={s.action}
            className="flex items-center gap-2 text-gray-800 justify-between"
          >
            <div className="flex items-center gap-1">
              {s.keys.map((key: string, i: number) => (
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
