import dagre from "@dagrejs/dagre";
import { Node, Edge, Position } from "@xyflow/react";

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
) => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  // Clear the graph
  dagreGraph.nodes().forEach((node) => dagreGraph.removeNode(node));
  dagreGraph.edges().forEach((edge) => dagreGraph.removeEdge(edge.v, edge.w));

  // Add nodes to the graph with their measured sizes
  nodes.forEach((node) => {
    const width = node.measured?.width || 250;
    const height = node.measured?.height || 200;
    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Apply the layout
  dagre.layout(dagreGraph);

  // Get the layouted nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.measured?.width || 250;
    const height = node.measured?.height || 200;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  // Set edge handle IDs to match layout direction
  const layoutedEdges = edges.map((edge) => ({
    ...edge,
    sourceHandle: isHorizontal ? "right-source" : "bottom-source",
    targetHandle: isHorizontal ? "left-target" : "top-target",
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
};
