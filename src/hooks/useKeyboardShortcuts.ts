import { useCallback, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { AppNode } from "../nodes/types";

export function useKeyboardShortcuts() {
  const { getNodes, setNodes, getEdges, deleteElements } = useReactFlow();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Delete selected nodes and edges
      if (event.key === "Delete") {
        const selectedNodes = getNodes().filter((node) => node.selected);
        const selectedEdges = getEdges().filter((edge) => edge.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          deleteElements({
            nodes: selectedNodes,
            edges: selectedEdges,
          });
        }
      }

      // Copy selected nodes
      if (event.ctrlKey && event.key === "c") {
        const selectedNodes = getNodes().filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          const nodesToCopy = selectedNodes.map((node) => ({
            ...node,
            selected: false,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50,
            },
          }));
          localStorage.setItem("copiedNodes", JSON.stringify(nodesToCopy));
        }
      }

      // Paste copied nodes
      if (event.ctrlKey && event.key === "v") {
        const copiedNodes = localStorage.getItem("copiedNodes");
        if (copiedNodes) {
          try {
            const nodesToPaste = JSON.parse(copiedNodes) as AppNode[];
            const newNodes = nodesToPaste.map((node) => ({
              ...node,
              id: `${node.id}-copy-${Date.now()}`,
            }));
            setNodes((nds) => [...nds, ...newNodes]);
          } catch (error) {
            console.error("Error pasting nodes:", error);
          }
        }
      }
    },
    [getNodes, getEdges, setNodes, deleteElements],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
