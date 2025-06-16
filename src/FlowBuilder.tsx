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
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams } from "react-router-dom";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNodeOperations } from "./hooks/useNodeOperations";
import { useHistoryContext } from "./contexts/HistoryContext";

import { initialNodes } from "./nodes";
import { initialEdges } from "./edges";
import Toolbar from "./components/FlowBuilder/Toolbar";
import { AppNode, NodeSchema } from "./nodes/types";
import ToolbarNode from "./nodes/ToolbarNode";
import { ToolbarEdge } from "./edges/ToolbarEdge";
import NotificationStack from "./components/FlowBuilder/Notifications/NotificationStack";
import LoadingSpinner from "./components/LoadingSpinner";
import Shortcuts from "./components/FlowBuilder/Shortcuts";
import { generateNodeId } from "./utils/nodeId";

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
  const { addNode, addEdge } = useHistoryContext();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const nodeOrigin: [number, number] = [0.5, 0.5];
  const [isLoading, setIsLoading] = useState(true);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const createNewNode = useCallback(
    (x: number, y: number, nodeType: string) => {
      const position = screenToFlowPosition({ x, y });

      let schema: NodeSchema | null = null;

      if (nodeType === "control-point") {
        schema = {
          type: "control-point",
          label: "Control Point",
          index: undefined,
          motivation: "",
        };
      } else if (nodeType === "action") {
        schema = {
          type: "action",
          label: "Action",
          index: undefined,
          description: "",
        };
      } else if (nodeType === "condition") {
        schema = {
          type: "conditional",
          label: "Condition",
          index: undefined,
          condition: "",
          target_index: undefined,
        };
      }

      const newNode = {
        id: generateNodeId("toolbar", schema),
        type: "toolbar" as const,
        position,
        data: {
          label: `Node ${schema?.index ?? ""}`,
          forceToolbarVisible: true,
          toolbarPosition: Position.Top,
          schema,
        },
        origin: [0.5, 0.0] as [number, number],
      };
      addNode(newNode as AppNode);
      return newNode;
    },
    [screenToFlowPosition, addNode],
  );

  const nodeTypes = useMemo(
    () => ({
      toolbar: ToolbarNode,
    }),
    [],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const dropPosition = screenToFlowPosition({ x: clientX, y: clientY });
        const newNode = createNewNode(clientX, clientY, "");
        const handleId =
          typeof connectionState.fromHandle === "string"
            ? connectionState.fromHandle
            : connectionState.fromHandle?.id || "";
        const closestHandle = getClosestHandle(
          newNode.position,
          dropPosition,
          handleId,
        );

        const newEdge = {
          id: `${connectionState.fromNode!.id}-${newNode.id}-${handleId}`,
          source: connectionState.fromNode!.id,
          sourceHandle: handleId,
          target: newNode.id,
          targetHandle: closestHandle,
          type: "toolbar",
        };
        addEdge(newEdge);
      } else if (connectionState.fromNode && connectionState.toNode) {
        // Handle valid connections between existing nodes
        const handleId =
          typeof connectionState.fromHandle === "string"
            ? connectionState.fromHandle
            : connectionState.fromHandle?.id || "";
        const targetHandleId =
          typeof connectionState.toHandle === "string"
            ? connectionState.toHandle
            : connectionState.toHandle?.id || "";

        const newEdge = {
          id: `${connectionState.fromNode.id}-${connectionState.toNode.id}-${handleId}`,
          source: connectionState.fromNode.id,
          sourceHandle: handleId,
          target: connectionState.toNode.id,
          targetHandle: targetHandleId,
          type: "toolbar",
        };
        addEdge(newEdge);
      }
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
      createNewNode(dropX, dropY, nodeType);
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

  const { pasteNode } = useNodeOperations();

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

    // Create a new node without a type
    const newNode = {
      id: generateNodeId("toolbar", null),
      type: "toolbar" as const,
      position: screenToFlowPosition({
        x: centerX + toolbarWidth,
        y: centerY,
      }),
      data: {
        label: "New Node",
        forceToolbarVisible: true,
        toolbarPosition: Position.Top,
        schema: null,
      },
      origin: [0.5, 0.0] as [number, number],
    };
    addNode(newNode as AppNode);
  }, [screenToFlowPosition, addNode]);

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
          <Shortcuts />
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
                fitView
                nodeOrigin={nodeOrigin}
                defaultEdgeOptions={{ type: "toolbar" }}
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
