import { ReactFlow, Background, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";

interface FlowPreviewProps {
  nodes: Node[];
  edges: Edge[];
}

const FlowPreview: React.FC<FlowPreviewProps> = ({ nodes, edges }) => {
  console.log("FlowPreview received:", { nodes, edges });

  return (
    <div className="h-32 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-gray-50"
        minZoom={0.5}
        maxZoom={0.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={true}
      >
        <Background />
      </ReactFlow>
    </div>
  );
};

export default FlowPreview;
