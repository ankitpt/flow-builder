import { useCallback, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCopyPaste } from "./useCopyPaste";
import { AppNode } from "@/nodes/types";

export function useKeyboardShortcuts() {
  const { getNodes, getEdges, deleteElements } = useReactFlow();
  const { copyNode, pasteNode } = useCopyPaste();

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
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        const selectedNodes = getNodes().filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          // Only copy the first selected node
          copyNode(selectedNodes[0] as AppNode);
        }
      }

      // Paste copied nodes
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        pasteNode();
      }
    },
    [getNodes, getEdges, deleteElements, copyNode, pasteNode],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
