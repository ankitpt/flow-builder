import { create } from "zustand";
import { AppNode } from "../nodes/types";
import { Edge } from "@xyflow/react";

interface HistoryState {
  nodes: AppNode[];
  edges: Edge[];
  timestamp: number;
}

interface FlowStore {
  history: HistoryState[];
  currentHistoryIndex: number;
  saveToHistory: (nodes: AppNode[], edges: Edge[]) => void;
  undo: () => HistoryState | null;
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  history: [],
  currentHistoryIndex: -1,
  saveToHistory: (nodes: AppNode[], edges: Edge[]) => {
    const currentState = {
      nodes,
      edges,
      timestamp: Date.now(),
    };

    const { history, currentHistoryIndex } = get();

    // If history is empty or we're at the start, initialize with this state
    if (history.length === 0 || currentHistoryIndex === -1) {
      const newHistory = [currentState];
      set({
        history: newHistory,
        currentHistoryIndex: 0,
      });
      localStorage.setItem("reactflow-history", JSON.stringify(newHistory));
      return;
    }

    // If we're not at the end of the history, remove all future states
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push(currentState);

    // Keep only the last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
    });

    localStorage.setItem("reactflow-history", JSON.stringify(newHistory));
  },

  undo: () => {
    const { history, currentHistoryIndex } = get();

    // If we're at the start of history, can't undo
    if (currentHistoryIndex <= 0) {
      return null;
    }

    // Move back one step in history
    const newIndex = currentHistoryIndex - 1;
    const previousState = history[newIndex];

    // Only update the index, don't modify the history array
    set({
      currentHistoryIndex: newIndex,
    });

    return previousState;
  },
}));
