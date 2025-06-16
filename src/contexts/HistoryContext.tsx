import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
} from "react";
import { HistoryAction } from "../nodes/types";
import { Edge, Node, useReactFlow } from "@xyflow/react";

type HistoryItem = {
  action: HistoryAction;
  data:
    | Node
    | Edge
    | {
        previousState: { nodes: Node[]; edges: Edge[] };
        newState: { nodes: Node[]; edges: Edge[] };
        direction: "TB" | "LR";
      }
    | undefined;
};

type HistoryContextType = {
  undo: () => void;
  redo: () => void;
  addNode: (node: Node | undefined, shouldAddToHistory?: boolean) => void;
  removeNode: (node: Node | undefined, shouldAddToHistory?: boolean) => void;
  addEdge: (edge: Edge | undefined, shouldAddToHistory?: boolean) => void;
  removeEdge: (edge: Edge | undefined, shouldAddToHistory?: boolean) => void;
  resetHistory: () => void;
  addToHistory: (item: HistoryItem) => void;
};

export const HistoryContext = createContext<HistoryContextType | null>(null);

export function useHistoryContext() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistoryContext must be used within a HistoryProvider");
  }
  return context;
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const currentIndex = useRef(-1);
  const { setNodes, setEdges } = useReactFlow();

  const addToHistory = useCallback((newState: HistoryItem) => {
    console.log("Adding to history:", {
      action: newState.action,
      data: newState.data,
    });
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, currentIndex.current + 1);
      newHistory.push(newState);
      currentIndex.current = newHistory.length - 1;
      console.log("History updated:", {
        newHistoryLength: newHistory.length,
        currentIndex: currentIndex.current,
        lastAction: newState.action,
      });
      return newHistory;
    });
  }, []);

  const addNode = useCallback(
    (node: Node | undefined, shouldAddToHistory = true) => {
      if (node) {
        console.log("Adding node:", { nodeId: node.id, shouldAddToHistory });
        setNodes((prevNodes) => prevNodes.concat(node));
        if (shouldAddToHistory) {
          addToHistory({
            action: HistoryAction.AddNode,
            data: node,
          });
        }
      }
    },
    [addToHistory, setNodes],
  );

  const addEdge = useCallback(
    (edge: Edge | undefined, shouldAddToHistory = true) => {
      if (edge) {
        console.log("Adding edge:", { edgeId: edge.id, shouldAddToHistory });
        setEdges((prevEdges) => prevEdges.concat(edge));
        if (shouldAddToHistory) {
          addToHistory({
            action: HistoryAction.AddEdge,
            data: edge,
          });
        }
      }
    },
    [addToHistory, setEdges],
  );

  const removeNode = useCallback(
    (node: Node | undefined, shouldAddToHistory = true) => {
      if (node) {
        console.log("Removing node:", { nodeId: node.id, shouldAddToHistory });
        setNodes((prevNodes) =>
          prevNodes.filter((prevNode) => prevNode.id !== node.id),
        );
        if (shouldAddToHistory) {
          addToHistory({
            action: HistoryAction.RemoveNode,
            data: node,
          });
        }
      }
    },
    [addToHistory, setNodes],
  );

  const removeEdge = useCallback(
    (edge: Edge | undefined, shouldAddToHistory = true) => {
      if (edge) {
        console.log("Removing edge:", { edgeId: edge.id, shouldAddToHistory });
        setEdges((prevEdges) =>
          prevEdges.filter((prevEdge) => prevEdge.id !== edge.id),
        );
        if (shouldAddToHistory) {
          addToHistory({
            action: HistoryAction.RemoveEdge,
            data: edge,
          });
        }
      }
    },
    [addToHistory, setEdges],
  );

  const undo = useCallback(() => {
    console.log("Undo called:", {
      currentIndex: currentIndex.current,
      historyLength: history.length,
      history: history,
    });

    if (currentIndex.current >= 0) {
      const { action, data } = history[currentIndex.current];
      console.log("Undoing action:", { action, data });
      currentIndex.current -= 1;

      switch (action) {
        case HistoryAction.AddNode: {
          console.log("Undoing AddNode:", { nodeId: (data as Node).id });
          setNodes((prevNodes) =>
            prevNodes.filter((node) => node.id !== (data as Node).id),
          );
          break;
        }
        case HistoryAction.AddEdge: {
          console.log("Undoing AddEdge:", { edgeId: (data as Edge).id });
          setEdges((prevEdges) =>
            prevEdges.filter((edge) => edge.id !== (data as Edge).id),
          );
          break;
        }
        case HistoryAction.RemoveNode: {
          console.log("Undoing RemoveNode:", { nodeId: (data as Node).id });
          setNodes((prevNodes) => [...prevNodes, data as Node]);
          break;
        }
        case HistoryAction.RemoveEdge: {
          console.log("Undoing RemoveEdge:", { edgeId: (data as Edge).id });
          setEdges((prevEdges) => [...prevEdges, data as Edge]);
          break;
        }
        case HistoryAction.LayoutFlow: {
          if (data && "previousState" in data) {
            const { previousState } = data;
            setNodes(previousState.nodes);
            setEdges(previousState.edges);
          }
          break;
        }
      }
    } else {
      console.log("Nothing to undo");
    }
  }, [history, setNodes, setEdges]);

  const redo = useCallback(() => {
    console.log("Redo called:", {
      currentIndex: currentIndex.current,
      historyLength: history.length,
      history: history,
    });

    if (currentIndex.current < history.length - 1) {
      currentIndex.current += 1;
      const { action, data } = history[currentIndex.current];
      console.log("Redoing action:", { action, data });

      switch (action) {
        case HistoryAction.AddNode: {
          console.log("Redoing AddNode:", { nodeId: (data as Node).id });
          setNodes((prevNodes) => [...prevNodes, data as Node]);
          break;
        }
        case HistoryAction.AddEdge: {
          console.log("Redoing AddEdge:", { edgeId: (data as Edge).id });
          setEdges((prevEdges) => [...prevEdges, data as Edge]);
          break;
        }
        case HistoryAction.RemoveNode: {
          console.log("Redoing RemoveNode:", { nodeId: (data as Node).id });
          setNodes((prevNodes) =>
            prevNodes.filter((node) => node.id !== (data as Node).id),
          );
          break;
        }
        case HistoryAction.RemoveEdge: {
          console.log("Redoing RemoveEdge:", { edgeId: (data as Edge).id });
          setEdges((prevEdges) =>
            prevEdges.filter((edge) => edge.id !== (data as Edge).id),
          );
          break;
        }
        case HistoryAction.LayoutFlow: {
          if (data && "newState" in data) {
            const { newState } = data;
            setNodes(newState.nodes);
            setEdges(newState.edges);
          }
          break;
        }
      }
    } else {
      console.log("Nothing to redo");
    }
  }, [history, setNodes, setEdges]);

  const resetHistory = useCallback(() => {
    console.log("Resetting history");
    setHistory([]);
    currentIndex.current = -1;
  }, []);

  return (
    <HistoryContext.Provider
      value={{
        undo,
        redo,
        addNode,
        removeNode,
        addEdge,
        removeEdge,
        resetHistory,
        addToHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}
