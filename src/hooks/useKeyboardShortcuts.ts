import { useCallback, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useNodeOperations } from "./useNodeOperations";
import { useFlowOperations } from "./useFlowOperations";
import { AppNode } from "@/nodes/types";

export function useKeyboardShortcuts() {
  const { getNodes, getEdges, deleteElements } = useReactFlow();
  const { copyNode, pasteNode } = useNodeOperations();
  const { saveFlow } = useFlowOperations();
  const isCtrlPressed = useRef(false);
  const zPressCount = useRef(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Guard clause for input elements
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isModifierKey = event.ctrlKey || event.metaKey;

      switch (event.key) {
        case "Control":
        case "Meta":
          isCtrlPressed.current = true;
          break;

        case "Delete": {
          const selectedNodes = getNodes().filter((node) => node.selected);
          const selectedEdges = getEdges().filter((edge) => edge.selected);

          if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            deleteElements({
              nodes: selectedNodes,
              edges: selectedEdges,
            });
          }
          break;
        }

        case "c":
          if (isModifierKey) {
            const selectedNodes = getNodes().filter((node) => node.selected);
            if (selectedNodes.length > 0) {
              copyNode(selectedNodes[0] as AppNode);
            }
          }
          break;

        case "v":
          if (isModifierKey) {
            pasteNode();
          }
          break;

        case "s":
          if (isModifierKey) {
            saveFlow();
          }
          break;
      }
    },
    [getNodes, getEdges, deleteElements, copyNode, pasteNode],
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === "Control" || event.key === "Meta") {
      isCtrlPressed.current = false;
      zPressCount.current = 0;
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
