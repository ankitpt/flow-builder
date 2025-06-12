import { create } from "zustand";
import type { NodeSchema } from "../nodes/types";

interface SchemaStore {
  idCounter: number;
  setIdCounter: (id: number) => void;
  nodeSchemas: Record<string, NodeSchema>;
  setNodeSchema: (nodeId: string, schema: NodeSchema) => void;
  getNodeSchema: (nodeId: string) => NodeSchema | null;
  removeNodeSchema: (nodeId: string) => void;
  resetSchemas: () => void;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  idCounter: 1,
  nodeSchemas: {},

  setIdCounter: (id: number) => {
    set({ idCounter: id });
  },

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

  resetSchemas: () => set({ nodeSchemas: {} }),
}));
