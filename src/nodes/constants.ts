import { NodeType } from "./types";

export const NODE_CONNECTION_RULES = {
  conditional: {
    canConnectTo: [] as NodeType[],
    errorMessage: "Conditional nodes cannot connect to other nodes.",
  },
  "control-point": {
    canConnectTo: ["control-point", "action", "conditional"] as NodeType[],
    errorMessage:
      "Control Point nodes can only connect to Control Points, Actions, or Conditionals.",
  },
  action: {
    canConnectTo: ["action", "conditional"] as NodeType[],
    errorMessage: "Action nodes can only connect to Actions or Conditionals.",
  },
} as const;
