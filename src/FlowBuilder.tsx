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
  type OnConnectEnd,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams } from "react-router-dom";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNodeOperations } from "./hooks/useNodeOperations";
import { useHistoryContext } from "./contexts/HistoryContext";
import { useFlow } from "./hooks/useFlow";

import { initialNodes } from "./nodes";
import { initialEdges } from "./edges";
import Toolbar from "./components/FlowBuilder/Toolbar";
import { AppNode, NodeType } from "./nodes/types";
import ToolbarNode from "./nodes/ToolbarNode";
import { ToolbarEdge } from "./edges/ToolbarEdge";
import NotificationStack from "./components/FlowBuilder/Notifications/NotificationStack";
import LoadingSpinner from "./components/Shared/LoadingSpinner";

function getClosestHandle(
  nodePosition: { x: number; y: number },
  dropPosition: { x: number; y: number },
  sourceHandle?: string,
) {
  if (sourceHandle) {
    switch (sourceHandle) {
      case "left":
        return "right";
      case "right":
        return "left";
      case "top":
        return "bottom";
      case "bottom":
        return "top";
      default:
        break;
    }
  }

  const dx = dropPosition.x - nodePosition.x;
  const dy = dropPosition.y - nodePosition.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "bottom" : "top";
  }
}

const EmptyStateMessage = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <button
        onClick={onClick}
        className="bg-white hover:bg-blue-100 transition-colors duration-500 p-6 rounded-lg cursor-pointer"
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Create Your First Node
        </h2>
        <p className="text-gray-500">Click here to start building your flow</p>
      </button>
    </div>
  );
};

function FlowBuilder() {
  const { flowId } = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { addEdge } = useHistoryContext();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();
  const { isTextFocused } = useFlow();
  const nodeOrigin: [number, number] = [0.5, 0.5];
  const [isLoading, setIsLoading] = useState(true);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const { createNewNode, pasteNode, onConnect } = useNodeOperations();

  const nodeTypes = useMemo(
    () => ({
      toolbar: ToolbarNode,
    }),
    [],
  );

  const [selectionMode] = useState<SelectionMode>(SelectionMode.Full);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      // Only handle the case where the user dropped on empty space (no toNode)
      if (!connectionState.isValid && !connectionState.toNode) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const dropPosition = screenToFlowPosition({ x: clientX, y: clientY });

        // Get the source node type from the schema
        const sourceNode = connectionState.fromNode;
        if (!sourceNode || sourceNode.type !== "toolbar") return;
        const sourceNodeType = (
          sourceNode.data as { schema?: { type: NodeType } }
        )?.schema?.type;
        const newNode = createNewNode(clientX, clientY, "", sourceNodeType);

        if (!newNode) return;

        const handleId =
          typeof connectionState.fromHandle === "string"
            ? connectionState.fromHandle
            : connectionState.fromHandle?.id || "";
        const closestHandle = getClosestHandle(
          newNode.position,
          dropPosition,
          handleId,
        );

        let edgeSource = connectionState.fromNode!.id;
        let edgeSourceHandle = handleId;
        let edgeTarget = newNode.id;
        let edgeTargetHandle = closestHandle;

        // If dragging from an input handle, flip source/target
        if (handleId === "left" || handleId === "top") {
          edgeSource = newNode.id;
          edgeSourceHandle = closestHandle;
          edgeTarget = connectionState.fromNode!.id;
          edgeTargetHandle = handleId;
        }

        const newEdge = {
          id: `${edgeSource}-${edgeTarget}-${edgeSourceHandle}`,
          source: edgeSource,
          sourceHandle: edgeSourceHandle,
          target: edgeTarget,
          targetHandle: edgeTargetHandle,
          type: "toolbar",
        };
        addEdge(newEdge);
      }
      // Otherwise, do nothing (onConnect will handle valid connections)
    },
    [createNewNode, screenToFlowPosition, addEdge],
  );

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
    const loadFlow = async () => {
      setIsLoading(true);
      if (!flowId) {
        setNodes(initialNodes);
        setEdges(initialEdges);
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/flow/${flowId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error("Authentication failed");
            setIsLoading(false);
            return;
          }
          throw new Error("Failed to fetch flow");
        }

        const flowData = await response.json();
        if (flowData.flow) {
          const { nodes: flowNodes, edges: flowEdges } = flowData.flow;
          const typedNodes = flowNodes.map((node: AppNode) => ({
            ...node,
            type: node.type || "toolbar",
            data: {
              ...node.data,
              schema:
                node.type === "toolbar"
                  ? (node.data as ToolbarNode["data"]).schema
                  : null,
            },
          })) as AppNode[];

          setNodes(typedNodes);
          setEdges(flowEdges);
        }
      } catch (error) {
        console.error("Error loading flow:", error);
        setNodes(initialNodes);
        setEdges(initialEdges);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlow();
  }, [flowId, setNodes, setEdges]);

  useKeyboardShortcuts();

  const edgeTypes = useMemo(
    () => ({
      toolbar: ToolbarEdge,
    }),
    [],
  );

  const handleEmptyStateClick = useCallback(() => {
    if (!reactFlowWrapper.current) return;

    const rect = reactFlowWrapper.current.getBoundingClientRect();
    const toolbar = document.querySelector(".toolbar");
    const toolbarWidth = toolbar?.getBoundingClientRect().width || 0;

    // Calculate center position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    createNewNode(centerX + toolbarWidth, centerY, "");
  }, [createNewNode]);

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

              {nodes.length === 0 && (
                <EmptyStateMessage onClick={handleEmptyStateClick} />
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
