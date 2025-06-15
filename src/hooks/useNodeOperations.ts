import { useCallback } from "react";
import {
  useReactFlow,
  Position,
  type OnConnect,
  type OnConnectEnd,
} from "@xyflow/react";
import { AppNode, NodeSchema } from "../nodes/types";
import { useHistoryContext } from "../contexts/HistoryContext";

export function useNodeOperations() {
  const { setNodes, setEdges, screenToFlowPosition, getNodes, getEdges } =
    useReactFlow();
  const { removeNode, removeEdge } = useHistoryContext();

  const createNewNode = useCallback(
    (x: number, y: number, nodeType: string) => {
      const position = screenToFlowPosition({ x, y });

      let schema: NodeSchema | null = null;

      if (nodeType === "control-point") {
        schema = {
          type: "control-point",
          label: "Control Point",
          index: undefined,
          motivation: "",
        };
      } else if (nodeType === "action") {
        schema = {
          type: "action",
          label: "Action",
          index: undefined,
          description: "",
        };
      } else if (nodeType === "condition") {
        schema = {
          type: "conditional",
          label: "Condition",
          index: undefined,
          condition: "",
          target_index: undefined,
        };
      }

      const newNode = {
        id: `${nodeType}-${Date.now()}`,
        type: "toolbar" as const,
        position,
        data: {
          label: `Node ${schema?.index ?? ""}`,
          forceToolbarVisible: true,
          toolbarPosition: Position.Top,
          schema,
        },
        origin: [0.5, 0.0] as [number, number],
      };
      setNodes((nds) => nds.concat(newNode as AppNode));
      return newNode;
    },
    [screenToFlowPosition, setNodes],
  );

  const updateNodeSchema = useCallback(
    (nodeId: string, updates: Partial<NodeSchema>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId || node.type !== "toolbar") return node;

          const currentSchema = node.data.schema as NodeSchema;
          const newSchema = { ...currentSchema, ...updates } as NodeSchema;

          if (JSON.stringify(currentSchema) === JSON.stringify(newSchema)) {
            return node;
          }

          return {
            ...node,
            data: {
              ...node.data,
              schema: newSchema,
            },
          } as AppNode;
        }),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const node = getNodes().find((n) => n.id === nodeId);
      if (node) {
        removeNode(node);
      }
    },
    [removeNode, getNodes],
  );

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
        localStorage.removeItem("copiedNode");
        return true;
      } catch (error) {
        console.error("Error pasting node:", error);
        return false;
      }
    }
    return false;
  }, [setNodes]);

  const createEdge = useCallback(
    (
      source: string,
      target: string,
      sourceHandle: string,
      targetHandle: string,
    ) => {
      const newEdge = {
        id: `${source}-${target}-${sourceHandle}`,
        source,
        sourceHandle,
        target,
        targetHandle,
        type: "toolbar",
      };
      setEdges((eds) => eds.concat(newEdge));
      return newEdge;
    },
    [setEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;
      createEdge(
        connection.source,
        connection.target,
        connection.sourceHandle || "",
        connection.targetHandle || "",
      );
    },
    [createEdge],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const dropPosition = screenToFlowPosition({ x: clientX, y: clientY });
        const newNode = createNewNode(clientX, clientY, "");
        const handleId =
          typeof connectionState.fromHandle === "string"
            ? connectionState.fromHandle
            : connectionState.fromHandle?.id || "";
        const closestHandle = getClosestHandle(
          newNode.position,
          dropPosition,
          handleId,
        );

        createEdge(
          connectionState.fromNode!.id,
          newNode.id,
          handleId,
          closestHandle,
        );
      }
    },
    [createNewNode, screenToFlowPosition, createEdge],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      const edge = getEdges().find((e) => e.id === edgeId);
      if (edge) {
        removeEdge(edge);
      }
    },
    [removeEdge, getEdges],
  );

  return {
    createNewNode,
    updateNodeSchema,
    deleteNode,
    copyNode,
    pasteNode,
    onConnect,
    onConnectEnd,
    deleteEdge,
    createEdge,
  };
}

// Helper function moved from FlowBuilder
function getClosestHandle(
  nodePosition: { x: number; y: number },
  dropPosition: { x: number; y: number },
  sourceHandle?: string,
) {
  if (sourceHandle) {
    switch (sourceHandle) {
      case "left":
        return "right";
      case "right":
        return "left";
      case "top":
        return "bottom";
      case "bottom":
        return "top";
      default:
        break;
    }
  }

  const dx = dropPosition.x - nodePosition.x;
  const dy = dropPosition.y - nodePosition.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "bottom" : "top";
  }
}
