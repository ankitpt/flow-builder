import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { AppNode } from "../nodes/types";

export function useCopyPaste() {
  const { setNodes } = useReactFlow();

  const copyNode = useCallback((node: AppNode) => {
    const nodeToCopy = {
      ...node,
      selected: false,
      position: node.position,
    };
    localStorage.setItem("copiedNode", JSON.stringify(nodeToCopy));
  }, []);

  const pasteNode = useCallback(() => {
    const copiedNode = localStorage.getItem("copiedNode");
    if (copiedNode) {
      try {
        const nodeToPaste = JSON.parse(copiedNode) as AppNode;
        if (!nodeToPaste.position) {
          console.error("No position data in copied node");
          return;
        }
        const newNode = {
          ...nodeToPaste,
          id: `${nodeToPaste.id}-copy-${Date.now()}`,
          position: {
            x: nodeToPaste.position.x + 100,
            y: nodeToPaste.position.y,
          },
        };
        setNodes((nds) => [...nds, newNode]);
        return true;
      } catch (error) {
        console.error("Error pasting node:", error);
        return false;
      }
    }
    return false;
  }, [setNodes]);

  return { copyNode, pasteNode };
}
