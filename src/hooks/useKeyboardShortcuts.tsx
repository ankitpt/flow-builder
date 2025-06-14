import { useCallback, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useNodeOperations } from "./useNodeOperations";
import { AppNode } from "@/nodes/types";
import useHistory from "./useHistory";

export function useKeyboardShortcuts() {
  const { getNodes, getEdges, deleteElements } = useReactFlow();
  const { copyNode, pasteNode } = useNodeOperations();
  const { undo, redo } = useHistory();
  const isCtrlPressed = useRef(false);
  const isShiftPressed = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Track modifier keys
      if (event.key === "Control" || event.key === "Meta") {
        isCtrlPressed.current = true;
        return;
      }
      if (event.key === "Shift") {
        isShiftPressed.current = true;
        return;
      }

      // Undo: Ctrl+Z or Ctrl+Shift+Z
      if (isCtrlPressed.current && event.key === "z") {
        if (isShiftPressed.current) {
          console.log("Redo");
          redo();
        } else {
          console.log("Undo");
          undo();
        }
        return;
      }

      // Redo: Ctrl+Y
      if (isCtrlPressed.current && event.key === "y") {
        redo();
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
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        const selectedNodes = getNodes().filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          copyNode(selectedNodes[0] as AppNode);
        }
      }

      // Paste copied nodes
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        pasteNode();
      }
    },
    [getNodes, getEdges, deleteElements, copyNode, pasteNode, undo, redo],
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === "Control" || event.key === "Meta") {
      isCtrlPressed.current = false;
    }
    if (event.key === "Shift") {
      isShiftPressed.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
