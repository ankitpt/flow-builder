import { useCallback, useRef, useEffect } from "react";
import Header from "./components/Header";
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
  ReactFlowProvider,
  type OnConnectEnd,
  Position,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";
import Toolbar from "./components/Toolbar";
import { AppNode } from "./nodes/types";
import { useSchemaStore } from "./store/schemaStore";

function Flow() {
  const reactFlowWrapper = useRef(null);
  const { idCounter, setIdCounter } = useSchemaStore();
  const STORAGE_KEY = "react-flow-diagram";
  const { nodeSchemas, setNodeSchema } = useSchemaStore();

  const getInitialNodes = () => {
    const flowData = localStorage.getItem(STORAGE_KEY);
    if (flowData) {
      const { nodes } = JSON.parse(flowData);
      return nodes;
    }
    return initialNodes;
  };

  const getInitialEdges = () => {
    const flowData = localStorage.getItem(STORAGE_KEY);
    if (flowData) {
      const { edges } = JSON.parse(flowData);
      return edges;
    }
    return initialEdges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
  const { screenToFlowPosition } = useReactFlow();
  const nodeOrigin: [number, number] = [0.5, 0];

  const createNewNode = useCallback(
    (x: number, y: number) => {
      const newNode = {
        id: idCounter.toString(),
        type: "toolbar" as const,
        position: screenToFlowPosition({
          x,
          y,
        }),
        data: {
          label: `Node ${idCounter.toString()}`,
          forceToolbarVisible: true,
          toolbarPosition: Position.Top,
          schema: null,
        },
        origin: [0.5, 0.0] as [number, number],
      };

      setNodes((nds) => nds.concat(newNode as AppNode));
      setIdCounter(idCounter + 1);
      return newNode;
    },
    [screenToFlowPosition, idCounter, setNodes, setIdCounter],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;

        const newNode = createNewNode(clientX, clientY);
        setEdges((eds) =>
          eds.concat({
            id: newNode.id,
            source: connectionState.fromNode!.id,
            target: newNode.id,
          }),
        );
      }
    },
    [createNewNode],
  );

  // Auto-load from localStorage on mount
  useEffect(() => {
    const flowData = localStorage.getItem(STORAGE_KEY);
    if (flowData) {
      const { nodes: loadedNodes, edges: loadedEdges } = JSON.parse(flowData);
      // Restore schema store from node data
      loadedNodes.forEach((node: any) => {
        if (node.type === "toolbar" && node.data?.schema) {
          setNodeSchema(node.id, node.data.schema);
        }
      });
      setNodes(loadedNodes);
      setEdges(loadedEdges);
    }
  }, [setNodes, setEdges, setNodeSchema]);

  // Auto-save to localStorage whenever nodes or edges or nodeSchemas change
  useEffect(() => {
    // Inject schema from store into each toolbar node before saving
    console.log("saving to localStorage");
    const processedNodes = nodes.map((node) => {
      if (node.type === "toolbar") {
        const schema = nodeSchemas[node.id];
        return {
          ...node,
          data: {
            ...node.data,
            schema: schema || null,
          },
        };
      }
      return node;
    });
    const flowData = {
      nodes: processedNodes,
      edges,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flowData));
  }, [nodes, edges, nodeSchemas]);

  useEffect(() => {
    // Restore schema store from node data
    nodes.forEach((node: any) => {
      if (node.type === "toolbar" && node.data?.schema) {
        setNodeSchema(node.id, node.data.schema);
      }
    });

    // Ensure idCounter is always higher than any node id
    if (nodes.length > 0) {
      const maxId = Math.max(
        ...nodes.map((node: any) => parseInt(node.id, 10)).filter((id) => !isNaN(id))
      );
      if (idCounter <= maxId) {
        setIdCounter(maxId + 1);
      }
    }
  }, [nodes, setNodeSchema, setIdCounter, idCounter]);

  return (
    <>
      <Header />
      <div className="flex flex-row h-full">
        <Toolbar />
      <div className="w-screen h-screen" ref={reactFlowWrapper}>
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

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
