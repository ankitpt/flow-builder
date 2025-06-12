import type { NodeTypes } from "@xyflow/react";

import { PositionLoggerNode } from "./PositionLoggerNode";
import { AppNode } from "./types";
import ToolbarNode from "./ToolbarNode";
import { Position } from "@xyflow/react";

export const initialNodes: AppNode[] = [
  {
    id: "1",
    type: "toolbar",
    position: { x: 0, y: 0 },
    data: {
      label: "Initial Node",
      forceToolbarVisible: true,
      toolbarPosition: Position.Top,
      schema: { index: 1, motivation: "", conditions: [] },
    },
  },
];

export const nodeTypes = {
  "position-logger": PositionLoggerNode,
  toolbar: ToolbarNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
