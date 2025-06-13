import { useCallback, useRef, useEffect, useMemo } from "react";
import Header from "./components/FlowBuilder/Header";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  useReactFlow,
  type OnConnectEnd,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams } from 'react-router-dom';

import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";
import Toolbar from "./components/FlowBuilder/Toolbar";
import { AppNode, NodeSchema } from "./nodes/types";
import { useSchemaStore } from "./store/schemaStore";
import ToolbarNode from "./nodes/ToolbarNode";
import React from "react";

function getClosestHandle(nodePosition: { x: any; y: any; }, dropPosition: { x: any; y: any; }) {
  const dx = dropPosition.x - nodePosition.x;
  const dy = dropPosition.y - nodePosition.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "bottom" : "top";
  }
}

function FlowBuilder() {
  const { flowId } = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { idCounter, setIdCounter } = useSchemaStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const nodeOrigin: [number, number] = [0.5, 0.5];

  const createNewNode = useCallback(
    (x: number, y: number, nodeType: string) => {
      const position = screenToFlowPosition({ x, y });
      const schema: NodeSchema | null =
        nodeType === "control-point"
          ? {
              type: "control-point",
              label: "Control Point",
              index: parseInt(idCounter.toString()),
              motivation: "",
            }
          : nodeType === "action"
          ? {
              type: "action",
              label: "Action",
              index: parseInt(idCounter.toString()),
              description: "",
            }
          : null;
      const newNode = {
        id: idCounter.toString(),
        type: "toolbar" as const,
        position,
        data: {
          label: `Node ${idCounter.toString()}`,
          forceToolbarVisible: true,
          toolbarPosition: Position.Top,
          schema,
        },
        origin: [0.5, 0.0] as [number, number],
      };
      setNodes((nds) => nds.concat(newNode as AppNode));
      setIdCounter(idCounter + 1);
      return newNode;
    },
    [screenToFlowPosition, idCounter, setNodes, setIdCounter],
  );

  const updateNodeSchema = useCallback((nodeId: string, updates: Partial<NodeSchema>) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id !== nodeId || node.type !== "toolbar") return node;
      
      const currentSchema = node.data.schema as NodeSchema;
      const newSchema = { ...currentSchema, ...updates } as NodeSchema;
      
      if (JSON.stringify(currentSchema) === JSON.stringify(newSchema)) {
        return node;
      }
      
      return {
        ...node,
        data: {
          ...node.data,
          schema: newSchema
        }
      } as AppNode;
    }));
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  }, [setNodes]);

  const nodeTypes = useMemo(() => ({
    toolbar: (nodeProps: any) => (
      <ToolbarNode
        {...nodeProps}
        updateNodeSchema={updateNodeSchema}
        handleDelete={handleDeleteNode}
      />
    ),
  }), [updateNodeSchema, handleDeleteNode]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const dropPosition = screenToFlowPosition({ x: clientX, y: clientY });
        const newNode = createNewNode(clientX, clientY, "");
        const closestHandle = getClosestHandle(newNode.position, dropPosition);
        const handleId = typeof connectionState.fromHandle === "string"
          ? connectionState.fromHandle
          : connectionState.fromHandle?.id || "";
        const newEdge = {
          id: `${connectionState.fromNode!.id}-${newNode.id}-${handleId}`,
          source: connectionState.fromNode!.id,
          sourceHandle: handleId,
          target: newNode.id,
          targetHandle: closestHandle,
        };
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [createNewNode, screenToFlowPosition],
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

  useEffect(() => {
    const loadFlow = async () => {
      if (!flowId) {
        setNodes(initialNodes);
        setEdges(initialEdges);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch(`/api/flow/${flowId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('Authentication failed');
            return;
          }
          throw new Error('Failed to fetch flow');
        }

        const flowData = await response.json();
        if (flowData.flow) {
          const { nodes: flowNodes, edges: flowEdges } = flowData.flow;
          // Ensure nodes are properly typed as AppNodes
          const typedNodes = flowNodes.map((node: any) => ({
            ...node,
            type: node.type || 'toolbar',
            data: {
              ...node.data,
              schema: node.data.schema as NodeSchema
            }
          })) as AppNode[];
          
          setNodes(typedNodes);
          setEdges(flowEdges);
        }
      } catch (error) {
        console.error('Error loading flow:', error);
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    };

    loadFlow();
  }, [flowId, setNodes, setEdges]);

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
        </div>
      </div>
    </>
  );
}

export default FlowBuilder;
