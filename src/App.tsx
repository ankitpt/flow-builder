import { useCallback, useRef } from 'react';
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
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';


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

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      if (!connectionState.isValid) {
        const id = getId();
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        const newNode = {
          id,
          type: 'toolbar' as const,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: { label: `Node ${id}`, forceToolbarVisible: true, toolbarPosition: Position.Top },
          origin: [0.5, 0.0] as [number, number],
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) =>
          eds.concat({ id, source: connectionState.fromNode!.id, target: id }),
        );
      }
    },
    [screenToFlowPosition, getId]
  );

  return (
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
        defaultEdgeOptions={{ type: 'toolbar' }}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
