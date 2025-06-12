import type { Node, BuiltInNode, Position } from "@xyflow/react";

export type PositionLoggerNode = Node<{ label: string }, "position-logger">;
export type ToolbarNode = Node<
  {
    label: string;
    forceToolbarVisible?: boolean;
    toolbarPosition?: Position;
    schema: ControlPoint | Action | null;
  },
  "toolbar"
>;
export type AppNode = BuiltInNode | PositionLoggerNode | ToolbarNode;

export type Condition = {
  index: number | undefined;
  condition: string; // if condition is true, go to index
};

export type ControlPoint = {
  label: "Control Point";
  index: number | undefined;
  motivation: string;
  conditions: Condition[];
};

export type Action = {
  label: "Action";
  index: number | undefined;
  description: string;
};

export type NodeSchema = ControlPoint | Action;
