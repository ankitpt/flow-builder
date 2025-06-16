import { ReactFlow, Background, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useMemo } from "react";
import { ToolbarEdge } from "@/edges/ToolbarEdge";
import ToolbarNode from "@/nodes/ToolbarNode";

interface FlowPreviewProps {
  nodes: Node[];
  edges: Edge[];
}

const FlowPreview: React.FC<FlowPreviewProps> = ({ nodes, edges }) => {
  console.log("FlowPreview nodes:", nodes);
  console.log("FlowPreview edges:", edges);

  const nodeTypes = useMemo(
    () => ({
      toolbar: ToolbarNode,
    }),
    [],
  );

  const edgeTypes = useMemo(
    () => ({
      toolbar: ToolbarEdge,
    }),
    [],
  );

  return (
    <div className="h-32 w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-gray-50"
        minZoom={0.5}
        maxZoom={0.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={true}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
};

export default FlowPreview;
