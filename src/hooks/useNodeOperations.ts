import { useCallback } from "react";
import {
  useReactFlow,
  Position,
  type OnConnect,
  type OnConnectEnd,
} from "@xyflow/react";
import { AppNode, NodeSchema, NodeType } from "../nodes/types";
import { useHistoryContext } from "../contexts/HistoryContext";
import { generateNodeId } from "../utils/nodeId";
import { validateNewNode, validateNewEdge } from "../utils/validate";
import { useNotification } from "../contexts/NotificationContext";
import { HANDLE_ID_MAP } from "../nodes/constants";

export function useNodeOperations() {
  const { setNodes, screenToFlowPosition, getNodes, getEdges } = useReactFlow();
  const { removeNode, removeEdge, addNode, addEdge } = useHistoryContext();
  const { showNotification } = useNotification();

  const createNewNode = useCallback(
    (x: number, y: number, nodeType: string, sourceNodeType?: NodeType) => {
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
          delay: 0.5,
          fragments: [],
        };
      } else if (nodeType === "conditional") {
        schema = {
          type: "conditional",
          label: "Conditional",
          index: undefined,
          condition: "",
          target_index: undefined,
        };
      }

      const newNode = {
        id: generateNodeId("toolbar", schema),
        type: "toolbar" as const,
        position,
        data: {
          label: `Node ${schema?.index ?? ""}`,
          forceToolbarVisible: true,
          toolbarPosition: Position.Top,
          schema,
          sourceNodeType,
        },
        origin: [0.5, 0.0] as [number, number],
      };

      // Validate the new node
      const errors = validateNewNode(newNode as AppNode, sourceNodeType);
      if (errors.length > 0) {
        errors.forEach((error) => {
          showNotification(error, "error");
        });
        return null;
      }

      addNode(newNode as AppNode);
      return newNode;
    },
    [screenToFlowPosition, addNode, showNotification],
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
      id: undefined,
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

        // Get default dimensions if not measured
        const width = nodeToPaste.measured?.width || 250;
        const height = nodeToPaste.measured?.height || 200;

        // Get all existing nodes
        const existingNodes = getNodes();

        // Calculate initial offset position
        let newX = nodeToPaste.position.x + width + 50; // Add width + padding
        let newY = nodeToPaste.position.y;

        // Check for overlapping with existing nodes
        const isOverlapping = (x: number, y: number) => {
          return existingNodes.some((node) => {
            const nodeWidth = node.measured?.width || 250;
            const nodeHeight = node.measured?.height || 200;

            // Check if rectangles overlap
            return !(
              x + width < node.position.x ||
              x > node.position.x + nodeWidth ||
              y + height < node.position.y ||
              y > node.position.y + nodeHeight
            );
          });
        };

        // Try different positions until we find a non-overlapping one
        let attempts = 0;
        const maxAttempts = 8; // Try 8 different positions

        while (isOverlapping(newX, newY) && attempts < maxAttempts) {
          // Try different positions in a spiral pattern
          switch (attempts % 4) {
            case 0: // Right
              newX += width + 50;
              break;
            case 1: // Down
              newY += height + 50;
              break;
            case 2: // Left
              newX -= width + 50;
              break;
            case 3: // Up
              newY -= height + 50;
              break;
          }
          attempts++;
        }

        const newNode = {
          ...nodeToPaste,
          id: generateNodeId(
            "toolbar",
            (nodeToPaste.data as { schema?: NodeSchema }).schema || null,
          ),
          position: {
            x: newX,
            y: newY,
          },
        };

        addNode(newNode);
        localStorage.removeItem("copiedNode");
        return true;
      } catch (error) {
        console.error("Error pasting node:", error);
        return false;
      }
    }
    return false;
  }, [getNodes, addNode]);

  const createEdge = useCallback(
    (
      source: string,
      target: string,
      sourceHandle: string,
      targetHandle: string,
    ) => {
      // Ensure correct handle id usage
      let safeSourceHandle = sourceHandle;
      let safeTargetHandle = targetHandle;
      const handleDirections = ["left", "right", "top", "bottom"] as const;
      type HandleDirection = (typeof handleDirections)[number];
      if (!safeSourceHandle.endsWith("-source")) {
        if (handleDirections.includes(safeSourceHandle as HandleDirection)) {
          safeSourceHandle =
            HANDLE_ID_MAP[safeSourceHandle as HandleDirection].source;
        } else if (safeSourceHandle.endsWith("-target")) {
          // Try to recover if a target handle is used as a source
          const dir = safeSourceHandle.replace(
            "-target",
            "",
          ) as HandleDirection;
          if (handleDirections.includes(dir)) {
            safeSourceHandle = HANDLE_ID_MAP[dir].source;
          } else {
            console.warn("Invalid sourceHandle for edge:", sourceHandle);
          }
        }
      }
      if (!safeTargetHandle.endsWith("-target")) {
        if (handleDirections.includes(safeTargetHandle as HandleDirection)) {
          safeTargetHandle =
            HANDLE_ID_MAP[safeTargetHandle as HandleDirection].target;
        } else if (safeTargetHandle.endsWith("-source")) {
          // Try to recover if a source handle is used as a target
          const dir = safeTargetHandle.replace(
            "-source",
            "",
          ) as HandleDirection;
          if (handleDirections.includes(dir)) {
            safeTargetHandle = HANDLE_ID_MAP[dir].target;
          } else {
            console.warn("Invalid targetHandle for edge:", targetHandle);
          }
        }
      }
      const newEdge = {
        id: `${source}-${target}-${safeSourceHandle}`,
        source,
        sourceHandle: safeSourceHandle,
        target,
        targetHandle: safeTargetHandle,
        type: "toolbar",
      };
      addEdge(newEdge);
      return newEdge;
    },
    [addEdge],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      // Get source and target nodes
      const sourceNode = getNodes().find((n) => n.id === connection.source);
      const targetNode = getNodes().find((n) => n.id === connection.target);

      console.log("sourceNode", sourceNode);
      console.log("targetNode", targetNode);

      // Create edge object for validation
      const newEdge = {
        id: `${connection.source}-${connection.target}-${connection.sourceHandle || ""}`,
        source: connection.source,
        sourceHandle: connection.sourceHandle || "",
        target: connection.target,
        targetHandle: connection.targetHandle || "",
        type: "toolbar",
      };

      // Validate the edge
      const errors = validateNewEdge(
        newEdge,
        sourceNode as AppNode,
        targetNode as AppNode,
      );
      if (errors.length > 0) {
        errors.forEach((error) => {
          showNotification(error, "error");
        });
        return;
      }

      // If validation passes, create the edge
      createEdge(
        connection.source,
        connection.target,
        connection.sourceHandle || "",
        connection.targetHandle || "",
      );
    },
    [createEdge, getNodes, showNotification],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const dropPosition = screenToFlowPosition({ x: clientX, y: clientY });
        const sourceNode = connectionState.fromNode;
        if (!sourceNode || sourceNode.type !== "toolbar") return;
        const sourceType = (sourceNode.data as { schema?: { type: NodeType } })
          ?.schema?.type;
        const newNode = createNewNode(clientX, clientY, "", sourceType);
        if (!newNode) return;

        let handleId =
          typeof connectionState.fromHandle === "string"
            ? connectionState.fromHandle
            : connectionState.fromHandle?.id || "";

        // Use HANDLE_ID_MAP for mapping plain directions to handle IDs
        const handleDirections = ["left", "right", "top", "bottom"] as const;
        type HandleDirection = (typeof handleDirections)[number];
        if (handleDirections.includes(handleId as HandleDirection)) {
          handleId = HANDLE_ID_MAP[handleId as HandleDirection].source;
        }

        const closestHandle = getClosestHandle(
          newNode.position,
          dropPosition,
          handleId,
        );

        const edgeSource = connectionState.fromNode!.id;
        const edgeSourceHandle = handleId;
        const edgeTarget = newNode.id;
        const edgeTargetHandle = closestHandle;

        createEdge(edgeSource, edgeTarget, edgeSourceHandle, edgeTargetHandle);
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

export function getClosestHandle(
  nodePosition: { x: number; y: number },
  dropPosition: { x: number; y: number },
  sourceHandle?: string,
) {
  const handleDirections = ["left", "right", "top", "bottom"] as const;
  type HandleDirection = (typeof handleDirections)[number];

  if (sourceHandle) {
    switch (sourceHandle) {
      case HANDLE_ID_MAP.left.source:
        return HANDLE_ID_MAP.right.target;
      case HANDLE_ID_MAP.right.source:
        return HANDLE_ID_MAP.left.target;
      case HANDLE_ID_MAP.top.source:
        return HANDLE_ID_MAP.bottom.target;
      case HANDLE_ID_MAP.bottom.source:
        return HANDLE_ID_MAP.top.target;
      default:
        if (handleDirections.includes(sourceHandle as HandleDirection)) {
          // If it's a plain direction, map to the opposite target handle
          switch (sourceHandle as HandleDirection) {
            case "left":
              return HANDLE_ID_MAP.right.target;
            case "right":
              return HANDLE_ID_MAP.left.target;
            case "top":
              return HANDLE_ID_MAP.bottom.target;
            case "bottom":
              return HANDLE_ID_MAP.top.target;
          }
        }
        break;
    }
  }

  const dx = dropPosition.x - nodePosition.x;
  const dy = dropPosition.y - nodePosition.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? HANDLE_ID_MAP.right.target : HANDLE_ID_MAP.left.target;
  } else {
    return dy > 0 ? HANDLE_ID_MAP.bottom.target : HANDLE_ID_MAP.top.target;
  }
}
