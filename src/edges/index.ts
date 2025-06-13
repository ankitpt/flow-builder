import type { Edge, EdgeTypes } from "@xyflow/react";
import { ToolbarEdge } from "./ToolbarEdge";

export const initialEdges: Edge[] = [];

export const edgeTypes = {
  toolbar: ToolbarEdge,
} satisfies EdgeTypes;
