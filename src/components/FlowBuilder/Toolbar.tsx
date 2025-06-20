import { FiMenu } from "react-icons/fi";
import { useState, useEffect } from "react";
import NodeIcon from "./NodeIcon";
import { useHistoryContext } from "@/contexts/HistoryContext";
import { LuUndo2, LuRedo2 } from "react-icons/lu";
import { useFlowOperations } from "@/hooks/useFlowOperations";
import { useReactFlow } from "@xyflow/react";
import Shortcuts from "./Shortcuts";
import FlowName from "../Shared/FlowName";
import { useParams } from "react-router-dom";
import { useFlow } from "@/hooks/useFlow";

const Toolbar = () => {
  const { undo, redo } = useHistoryContext();
  const { metadata, setMetadata } = useFlow();
  const { layoutFlow } = useFlowOperations(metadata, setMetadata);
  const { getNodes, getEdges } = useReactFlow();
  const [menuVisible, setMenuVisible] = useState(false);
  const { flowId } = useParams();
  const [flowName, setFlowName] = useState("");
  const { handleEditName } = useFlow();
  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleNameChange = async (flowId: string, newName: string) => {
    await handleEditName(flowId, newName);
    setFlowName(newName);
  };

  useEffect(() => {
    const fetchFlowName = async () => {
      if (!flowId) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const response = await fetch(`/api/flow/${flowId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch flow");
        }

        const flowData = await response.json();
        setFlowName(flowData.name);
      } catch (error) {
        console.error("Error fetching flow name:", error);
      }
    };

    fetchFlowName();
  }, [flowId]);

  return (
    <div className="w-fit h-full bg-white border border-gray-200 p-2 z-20 toolbar">
      <div className="flex flex-col items-center justify-center">
        {menuVisible ? (
          <div className="">
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
            <div className="flex flex-row items-center justify-center p-2 w-full max-w-full">
              <FlowName
                flowId={flowId || ""}
                name={flowName}
                onNameChange={handleNameChange}
              />
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
                className="p-2 flex items-center gap-4 hover:text-gray-800 transition-colors"
                onClick={undo}
                title="Undo"
              >
                <LuUndo2 className="text-lg text-gray-800 hover:text-gray-800 transition-colors" />
                <span className="text-sm text-gray-800 hover:text-gray-800 transition-colors">
                  Undo
                </span>
              </button>
              <button
                className="p-2 flex items-center gap-4 hover:text-gray-800 transition-colors"
                onClick={redo}
                title="Redo"
              >
                <span className="text-sm text-gray-800 hover:text-gray-800 transition-colors">
                  Redo
                </span>
                <LuRedo2 className="text-lg text-gray-800 hover:text-gray-800 transition-colors" />
              </button>
            </div>
            <hr className="my-2" />
            <div className="p-2 text-sm text-gray-700 font-bold">Layout</div>
            <div className="flex flex-row text-sm gap-2 p-2 w-full">
              <button
                className="flex items-center bg-gray-100 justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors p-2 hover:bg-gray-200 rounded-xl w-full"
                onClick={() => layoutFlow(getNodes(), getEdges(), "TB")}
              >
                Vertical
              </button>
              <button
                className="flex items-center bg-gray-100 justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors p-2 hover:bg-gray-200 rounded-xl w-full"
                onClick={() => layoutFlow(getNodes(), getEdges(), "LR")}
              >
                Horizontal
              </button>
            </div>
            <hr className="my-2" />
            <Shortcuts />
            <hr className="my-2" />
            <p className="text-sm text-gray-800 p-2">
              Tip: drag from the connection points on a node and drop to create
              a new node!
            </p>
          </div>
        ) : (
          <>
            <button
              className="p-2 pb-4 hover:text-gray-800 transition-colors"
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
                label="Condition"
                collapsed={true}
                title="Conditional"
              />
              <button
                className="flex items-center gap-4 hover:text-gray-800 transition-colors"
                onClick={undo}
                title="Undo"
              >
                <LuUndo2 className="text-lg text-gray-800 hover:text-gray-800 transition-colors" />
              </button>
              <button
                className="flex items-center gap-4 hover:text-gray-800 transition-colors"
                onClick={redo}
                title="Redo"
              >
                <LuRedo2 className="text-lg text-gray-800 hover:text-gray-800 transition-colors" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
