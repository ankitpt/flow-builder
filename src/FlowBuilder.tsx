import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import Header from "./components/FlowBuilder/Header";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams } from "react-router-dom";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNodeOperations } from "./hooks/useNodeOperations";

import { initialNodes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";
import Toolbar from "./components/FlowBuilder/Toolbar";
import { AppNode } from "./nodes/types";
import ToolbarNode from "./nodes/ToolbarNode";

function FlowBuilder() {
  const { flowId } = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeOrigin: [number, number] = [0.5, 0.5];

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const {
    createNewNode,
    updateNodeSchema,
    deleteNode,
    onConnect,
    onConnectEnd,
    pasteNode,
  } = useNodeOperations();

  const nodeTypes = useMemo(
    () => ({
      toolbar: (props: NodeProps<ToolbarNode>) => (
        <ToolbarNode
          {...props}
          updateNodeSchema={updateNodeSchema}
          handleDelete={deleteNode}
        />
      ),
    }),
    [updateNodeSchema, deleteNode],
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
      if (!flowId) {
        setNodes(initialNodes);
        setEdges(initialEdges);
        return;
      }

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
          if (response.status === 401) {
            console.error("Authentication failed");
            return;
          }
          throw new Error("Failed to fetch flow");
        }

        const flowData = await response.json();
        if (flowData.flow) {
          const { nodes: flowNodes, edges: flowEdges } = flowData.flow;
          // Ensure nodes are properly typed as AppNodes
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
      }
    };

    loadFlow();
  }, [flowId, setNodes, setEdges]);

  useKeyboardShortcuts();

  return (
    <>
      <Header />
      <div className="flex flex-row h-full">
        <Toolbar />
        <div
          className="w-screen h-screen"
          ref={reactFlowWrapper}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onContextMenu={handleContextMenu}
        >
          <ReactFlow
            nodes={nodes}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            edges={edges}
            edgeTypes={edgeTypes}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectEnd={onConnectEnd}
            fitView
            nodeOrigin={nodeOrigin}
            defaultEdgeOptions={{ type: "toolbar" }}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>

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
