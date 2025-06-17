import type {
  Node,
  BuiltInNode,
  Position,
  Edge,
  NodeProps,
} from "@xyflow/react";

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

export type ToolbarNodeProps = NodeProps<ToolbarNode> & {
  updateNodeSchema: (id: string, updates: Partial<NodeSchema>) => void;
  handleDelete: (id: string) => void;
  position?: Position;
};

export type AppNode = BuiltInNode | PositionLoggerNode | ToolbarNode;

export type Conditional = {
  label: "Conditional";
  type: "conditional";
  target_index: number | undefined;
  index: number | undefined;
  condition: string; // if condition is true, go to 'target_index'
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
  fragments: number[];
  delay: number | undefined;
  description: string;
};

export type NodeSchema = ControlPoint | Action | Conditional | null;

export interface Flow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  flow: {
    nodes: Node[];
    edges: Edge[];
  };
}

export enum HistoryAction {
  AddNode = "addNode",
  RemoveNode = "removeNode",
  AddEdge = "addEdge",
  RemoveEdge = "removeEdge",
  UpdateNodePosition = "updateNodePosition",
  UpdateNodeSchema = "updateNodeSchema",
  LayoutFlow = "layoutFlow",
}
