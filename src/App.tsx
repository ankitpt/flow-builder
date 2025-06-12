import { useCallback, useRef } from "react";
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

function Flow() {
  const reactFlowWrapper = useRef(null);
  const idCounter = useRef(1);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const nodeOrigin: [number, number] = [0.5, 0];

  const getId = useCallback(() => {
    return `${idCounter.current++}`;
  }, []);

  const createNewNode = useCallback(
    (x: number, y: number) => {
      const id = getId();
      const newNode = {
        id,
        type: "toolbar" as const,
        position: screenToFlowPosition({
          x,
          y,
        }),
        data: {
          label: `Node ${id}`,
          forceToolbarVisible: true,
          toolbarPosition: Position.Top,
        },
        origin: [0.5, 0.0] as [number, number],
      };

      setNodes((nds) => nds.concat(newNode as AppNode));
      return newNode;
    },
    [screenToFlowPosition, getId],
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

  return (
    <>
      <Header />
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
