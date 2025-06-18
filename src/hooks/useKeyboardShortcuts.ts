import { useCallback, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useNodeOperations } from "./useNodeOperations";
import { AppNode } from "@/nodes/types";
import { useHistoryContext } from "@/contexts/HistoryContext";
import { useFlowOperations } from "./useFlowOperations";
import { useFlow } from "./useFlow";

type ModifierKeys = {
  ctrl: boolean;
  shift: boolean;
};

export function useKeyboardShortcuts() {
  const { getNodes, getEdges } = useReactFlow();
  const { copyNode, pasteNode, deleteNode, deleteEdge } = useNodeOperations();
  const { undo, redo } = useHistoryContext();
  const { metadata, setMetadata } = useFlow();
  const { saveFlow } = useFlowOperations(metadata, setMetadata);
  const modifiers = useRef<ModifierKeys>({ ctrl: false, shift: false });

  const handleDelete = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    const selectedEdges = getEdges().filter((edge) => edge.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      console.log("Delete triggered by keyboard shortcut", {
        selectedNodes: selectedNodes.length,
        selectedEdges: selectedEdges.length,
      });
      selectedNodes.forEach((node) => deleteNode(node.id));
      selectedEdges.forEach((edge) => deleteEdge(edge.id));
    }
  }, [getNodes, getEdges, deleteNode, deleteEdge]);

  const handleCopy = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    if (selectedNodes.length > 0) {
      console.log("Copy triggered by keyboard shortcut", {
        nodeId: selectedNodes[0].id,
      });
      copyNode(selectedNodes[0] as AppNode);
    }
  }, [getNodes, copyNode]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if typing in input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Update modifier keys
      if (event.key === "Control" || event.key === "Meta") {
        modifiers.current.ctrl = true;
        return;
      }
      if (event.key === "Shift") {
        modifiers.current.shift = true;
        return;
      }

      // Handle shortcuts based on key and modifiers
      switch (event.key.toLowerCase()) {
        case "z":
          if (modifiers.current.ctrl) {
            if (modifiers.current.shift) {
              console.log("Redo triggered by keyboard shortcut");
              redo();
            } else {
              console.log("Undo triggered by keyboard shortcut");
              undo();
            }
          }
          break;

        case "y":
          if (modifiers.current.ctrl) {
            console.log("Redo triggered by keyboard shortcut (Ctrl+Y)");
            redo();
          }
          break;

        case "delete":
          handleDelete();
          break;

        case "c":
          if (modifiers.current.ctrl) {
            handleCopy();
          }
          break;

        case "v":
          if (modifiers.current.ctrl) {
            console.log("Paste triggered by keyboard shortcut");
            pasteNode();
          }
          break;

        case "s":
          if (modifiers.current.ctrl) {
            event.preventDefault();
            saveFlow();
          }
          break;
      }
    },
    [handleDelete, handleCopy, undo, redo, pasteNode, saveFlow],
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === "Control" || event.key === "Meta") {
      modifiers.current.ctrl = false;
    }
    if (event.key === "Shift") {
      modifiers.current.shift = false;
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
