import { create } from "zustand";
import type { ControlPoint, Action, NodeSchema } from "../nodes/types";

interface SchemaStore {
  nodeSchemas: Record<string, NodeSchema>;
  setNodeSchema: (nodeId: string, schema: NodeSchema) => void;
  getNodeSchema: (nodeId: string) => NodeSchema | null;
  removeNodeSchema: (nodeId: string) => void;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  nodeSchemas: {},

  setNodeSchema: (nodeId: string, schema: NodeSchema) => {
    set((state) => ({
      nodeSchemas: {
        ...state.nodeSchemas,
        [nodeId]: schema,
      },
    }));
  },

  getNodeSchema: (nodeId: string) => {
    return get().nodeSchemas[nodeId] || null;
  },

  removeNodeSchema: (nodeId: string) => {
    set((state) => {
      const { [nodeId]: removed, ...remaining } = state.nodeSchemas;
      return { nodeSchemas: remaining };
    });
  },
}));
