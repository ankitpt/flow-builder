import { create } from "zustand";

interface SchemaStore {
  idCounter: number;
  setIdCounter: (id: number) => void;
}

export const useSchemaStore = create<SchemaStore>((set) => ({
  idCounter: 1,

  setIdCounter: (id: number) => {
    set({ idCounter: id });
  },
}));
