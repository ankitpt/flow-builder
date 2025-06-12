import type { Edge, NodeTypes } from "@xyflow/react";

import { PositionLoggerNode } from "./PositionLoggerNode";
import { AppNode } from "./types";
import ToolbarNode from "./ToolbarNode";
import { Position } from "@xyflow/react";

export const initialNodes: AppNode[] = [
  {
    id: "0",
    type: "toolbar",
    position: { x: 0, y: 0 },
    data: {
      label: "Initial Node",
      forceToolbarVisible: true,
      toolbarPosition: Position.Top,
      schema: null,
    },
  },
];

export const initialEdges: Edge[] = [];

export const nodeTypes = {
  "position-logger": PositionLoggerNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
