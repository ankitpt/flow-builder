import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import Header from "./components/FlowBuilder/Header";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  SelectionMode,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams } from "react-router-dom";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNodeOperations } from "./hooks/useNodeOperations";
import { useFlow } from "./hooks/useFlow";
import { useFlowOperations } from "./hooks/useFlowOperations";
import { useAutoSave } from "./hooks/useAutoSave";

import Toolbar from "./components/FlowBuilder/Toolbar";
import { AppNode } from "./nodes/types";
import ToolbarNode from "./nodes/ToolbarNode";
import { ToolbarEdge } from "./edges/ToolbarEdge";
import NotificationStack from "./components/FlowBuilder/Notifications/NotificationStack";
import LoadingSpinner from "./components/Shared/LoadingSpinner";
import FlowMetadata from "./components/Shared/FlowMetadata";

function FlowBuilder() {
  const { flowId } = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { getNodes, getEdges } = useReactFlow();
  const { isTextFocused, setMetadata } = useFlow();
  const { loadFlow } = useFlowOperations(undefined, setMetadata);
  const nodeOrigin: [number, number] = [0.5, 0.5];
  const [isLoading, setIsLoading] = useState(true);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const { createNewNode, pasteNode, onConnect, onConnectEnd } =
    useNodeOperations();

  const nodeTypes = useMemo(
    () => ({
      toolbar: ToolbarNode,
    }),
    [],
  );

  const [selectionMode] = useState<SelectionMode>(SelectionMode.Full);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/node-type");
      if (!nodeType) return;
      const reactFlowWrapperRect =
        reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowWrapperRect) return;
      const toolbar = document.querySelector(".toolbar");
      const toolbarWidth = toolbar?.getBoundingClientRect().width || 0;
      const dropX = event.clientX - reactFlowWrapperRect.left + toolbarWidth;
      const dropY = event.clientY - reactFlowWrapperRect.top;
      const newNode = createNewNode(dropX, dropY, nodeType);
      if (!newNode) return;
    },
    [createNewNode],
  );

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const hasCopiedNode = localStorage.getItem("copiedNode");
    console.log("hasCopiedNode", hasCopiedNode);
    if (hasCopiedNode) {
      setContextMenu({ x: event.clientX, y: event.clientY });
    }
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const loadFlowData = async () => {
      setIsLoading(true);
      await loadFlow(flowId);
      setIsLoading(false);
    };

    loadFlowData();
  }, [flowId, loadFlow]);

  useKeyboardShortcuts();

  const edgeTypes = useMemo(
    () => ({
      toolbar: ToolbarEdge,
    }),
    [],
  );

  const handleEmptyStateClick = useCallback(
    (nodeType?: string) => {
      if (!reactFlowWrapper.current) return;

      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const toolbar = document.querySelector(".toolbar");
      const toolbarWidth = toolbar?.getBoundingClientRect().width || 0;

      // Calculate center position
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      createNewNode(centerX + toolbarWidth, centerY, nodeType || "");
    },
    [createNewNode],
  );

  // Add Ctrl+A handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        const currentNodes = getNodes() as AppNode[];
        const currentEdges = getEdges();

        // Select all nodes and edges
        setNodes(
          currentNodes.map((node) => ({
            ...node,
            selected: true,
          })),
        );
        setEdges(
          currentEdges.map((edge) => ({
            ...edge,
            selected: true,
          })),
        );
      }
    },
    [getNodes, getEdges, setNodes, setEdges],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Add auto-save functionality
  useAutoSave();

  return (
    <>
      <Header />
      <NotificationStack />
      <div className="flex flex-row h-full">
        <Toolbar />
        <div
          className="w-screen h-screen relative"
          ref={reactFlowWrapper}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onContextMenu={handleContextMenu}
        >
          {isLoading ? (
            <LoadingSpinner message="Loading flow..." fullScreen />
          ) : (
            <>
              <ReactFlow
                nodes={nodes}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                edges={edges}
                edgeTypes={edgeTypes}
                onEdgesChange={onEdgesChange}
                onConnectEnd={onConnectEnd}
                onConnect={onConnect}
                fitView
                nodeOrigin={nodeOrigin}
                defaultEdgeOptions={{ type: "toolbar" }}
                panOnDrag={!isTextFocused}
                panOnScroll={!isTextFocused}
                selectionMode={selectionMode}
                selectionOnDrag
                selectionKeyCode="Shift"
              >
                <Background />
                <MiniMap />
                <Controls />
              </ReactFlow>

              {nodes.length === 0 ? (
                <FlowMetadata onClick={handleEmptyStateClick} mode="setup" />
              ) : (
                <FlowMetadata mode="compact" />
              )}
            </>
          )}

          {contextMenu && (
            <div
              className="fixed bg-white rounded-md shadow-lg py-1 z-50"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
            >
              <button
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                onClick={() => {
                  pasteNode();
                  setContextMenu(null);
                }}
              >
                Paste
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default FlowBuilder;
