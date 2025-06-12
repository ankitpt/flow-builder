import type { Node, BuiltInNode, Position } from "@xyflow/react";

export type PositionLoggerNode = Node<{ label: string }, "position-logger">;
export type ToolbarNode = Node<
  {
    label: string;
    forceToolbarVisible?: boolean;
    toolbarPosition?: Position;
    schema: NodeSchema;
  },
  "toolbar"
>;
export type AppNode = BuiltInNode | PositionLoggerNode | ToolbarNode;

export type Conditional = {
  label: "Conditional";
  type: "conditional";
  index: number | undefined;
  condition: string; // if condition is true, go to index
};

export type ControlPoint = {
  label: "Control Point";
  type: "control-point";
  index: number | undefined;
  motivation: string;
};

export type Action = {
  label: "Action";
  type: "action";
  index: number | undefined;
  description: string;
};

export type NodeSchema = ControlPoint | Action | Conditional | null;
