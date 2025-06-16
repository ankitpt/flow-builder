import { FiMenu } from "react-icons/fi";
import { useState } from "react";
import NodeIcon from "./NodeIcon";
import { useHistoryContext } from "@/contexts/HistoryContext";
import { LuUndo2, LuRedo2 } from "react-icons/lu";
import { useFlowOperations } from "@/hooks/useFlowOperations";
import { useReactFlow } from "@xyflow/react";

const Toolbar = () => {
  const { undo, redo } = useHistoryContext();
  const { layoutFlow } = useFlowOperations();
  const { getNodes, getEdges } = useReactFlow();
  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <div className="w-fit h-full max-w-[250px] bg-white border border-gray-200 p-2 z-20 toolbar">
      <div className="flex flex-col items-center justify-center">
        {menuVisible ? (
          <div className="min-w-[250px]">
            <div className="justify-between flex flex-row items-center px-2">
              <a
                href="/"
                className="font-bold hover:text-blue-600 transition-colors"
              >
                Flow Builder
              </a>
              <button
                className="p-2 hover:text-blue-600 transition-colors"
                onClick={toggleMenu}
              >
                <FiMenu className="text-lg text-gray-800" />
              </button>
            </div>
            <hr className="my-2" />
            <div className="p-2 text-sm">Drag and drop to add nodes</div>
            <div className="flex flex-col text-sm text-center w-full gap-2 p-2">
              <NodeIcon
                type="control-point"
                label="Control Point"
                collapsed={false}
                title="Control Point"
              />
              <NodeIcon
                type="action"
                label="Action"
                collapsed={false}
                title="Action"
              />
              <NodeIcon
                type="conditional"
                label="Conditional"
                collapsed={false}
                title="Conditional"
              />
            </div>
            <hr className="my-2" />
            <div className="p-2 flex flex-row justify-between">
              <button
                className="p-2 flex items-center gap-4 hover:text-gray-600 transition-colors"
                onClick={undo}
                title="Undo"
              >
                <LuUndo2 className="text-lg text-gray-800 hover:text-gray-600 transition-colors" />
                <span className="text-sm text-gray-800 hover:text-gray-600 transition-colors">
                  Undo
                </span>
              </button>
              <button
                className="p-2 flex items-center gap-4 hover:text-gray-600 transition-colors"
                onClick={redo}
                title="Redo"
              >
                <span className="text-sm text-gray-800 hover:text-gray-600 transition-colors">
                  Redo
                </span>
                <LuRedo2 className="text-lg text-gray-800 hover:text-gray-600 transition-colors" />
              </button>
            </div>
            <hr className="my-2" />
            <div className="p-2 text-sm text-black">Layout</div>
            <div className="flex flex-col text-sm gap-2 p-2">
              <button
                className="flex items-center justify-center gap-2 text-gray-800 hover:text-gray-600 transition-colors p-2 bg-gray-50 rounded"
                onClick={() => layoutFlow(getNodes(), getEdges(), "TB")}
              >
                Vertical Layout
              </button>
              <button
                className="flex items-center justify-center gap-2 text-gray-800 hover:text-gray-600 transition-colors p-2 bg-gray-50 rounded"
                onClick={() => layoutFlow(getNodes(), getEdges(), "LR")}
              >
                Horizontal Layout
              </button>
            </div>
            <hr className="my-2" />
            <div className="p-2 text-sm text-black">Shortcuts</div>
            <div className="flex flex-col text-sm gap-2 p-2">
              <div className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    Ctrl
                  </span>
                  <span className="text-black">+</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    C
                  </span>
                </div>
                <p className="text-black">Copy Node</p>
              </div>
              <div className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    Ctrl
                  </span>
                  <span className="text-black">+</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    V
                  </span>
                </div>
                <p className="text-black">Paste Node</p>
              </div>
              <div className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    Delete
                  </span>
                </div>
                <p className="text-black">Delete Node</p>
              </div>
            </div>
            <hr className="my-2" />
            <p className="text-sm text-gray-600 p-2">
              Tip: drag from the connection points on a node and drop to create
              a new node!
            </p>
          </div>
        ) : (
          <>
            <button
              className="p-2 pb-4 hover:text-gray-600 transition-colors"
              onClick={toggleMenu}
            >
              <FiMenu className="text-lg text-gray-800" />
            </button>
            <div className="flex flex-col items-center justify-center gap-4">
              <NodeIcon
                type="control-point"
                label="Control Point"
                collapsed={true}
                title="Control Point"
              />
              <NodeIcon
                type="action"
                label="Action"
                collapsed={true}
                title="Action"
              />
              <NodeIcon
                type="conditional"
                label="Conditional"
                collapsed={true}
                title="Conditional"
              />
              <button
                className="flex items-center gap-4 hover:text-gray-600 transition-colors"
                onClick={undo}
                title="Undo"
              >
                <LuUndo2 className="text-lg text-gray-800 hover:text-gray-600 transition-colors" />
              </button>
              <button
                className="flex items-center gap-4 hover:text-gray-600 transition-colors"
                onClick={redo}
                title="Redo"
              >
                <LuRedo2 className="text-lg text-gray-800 hover:text-gray-600 transition-colors" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
