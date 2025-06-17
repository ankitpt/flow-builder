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
};

export const SHORTCUTS = [
  { keys: ["Ctrl", "C"], action: "Copy Node" },
  { keys: ["Ctrl", "V"], action: "Paste Node" },
  { keys: ["Delete"], action: "Delete Node" },
  { keys: ["Ctrl", "S"], action: "Save Flow" },
  { keys: ["Ctrl", "Z"], action: "Undo" },
  { keys: ["Ctrl", "Y"], action: "Redo" },
  { keys: ["Enter"], action: "Add Fragment" },
];
