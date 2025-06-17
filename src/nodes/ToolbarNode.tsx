import {
  NodeToolbar,
  Handle,
  Position,
  NodeProps,
  useReactFlow,
} from "@xyflow/react";
import {
  type ToolbarNode,
  type ControlPoint,
  type Action,
  type Conditional,
  AppNode,
} from "./types";
import { useState, useEffect, useRef } from "react";
import { FaRegEdit } from "react-icons/fa";
import { useNodeOperations } from "../hooks/useNodeOperations";
import { useFlow } from "../hooks/useFlow";
import { NODE_CONNECTION_RULES } from "./constants";
import { useNotification } from "../contexts/NotificationContext";

const ToolbarNode = (props: NodeProps<ToolbarNode>) => {
  const { data, id } = props;
  const { copyNode, updateNodeSchema, deleteNode } = useNodeOperations();
  const { setNodes } = useReactFlow();
  const { isTextFocused, setIsTextFocused } = useFlow();
  const { showNotification } = useNotification();
  const schema = data.schema;
  const [menuOpen, setMenuOpen] = useState(false);
  const notificationShown = useRef(false);
  const [localText, setLocalText] = useState(() => {
    if (schema?.type === "conditional") {
      return schema.condition;
    } else if (schema?.type === "control-point") {
      return schema.motivation;
    } else if (schema?.type === "action") {
      return schema.description;
    }
    return "";
  });
  const [localFragmentInput, setLocalFragmentInput] = useState("");

  // Close menu when node is not selected
  useEffect(() => {
    if (!props.selected) {
      setMenuOpen(false);
    }
  }, [props.selected]);

  // Update local text when schema changes from outside
  useEffect(() => {
    if (!schema) return;
    const newText =
      schema.type === "control-point"
        ? (schema as ControlPoint).motivation
        : schema.type === "conditional"
          ? (schema as Conditional).condition
          : (schema as Action).description;
    setLocalText(newText);
  }, [schema]);

  // Update node draggable state when textarea focus changes
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            draggable: !isTextFocused,
          };
        }
        return node;
      }),
    );
    setIsTextFocused(isTextFocused);
  }, [isTextFocused, id, setNodes, setIsTextFocused]);

  return (
    <>
      <NodeToolbar
        isVisible={props.selected}
        position={Position.Top}
        align="end"
        offset={8}
      ></NodeToolbar>
      <div
        className={`toolbar-node min-w-[250px]${props.selected ? " selected" : ""} ${schema ? schema.type : ""}`}
      >
        <div className="relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-600 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <FaRegEdit />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                onClick={() => {
                  copyNode({
                    ...props,
                    position: {
                      x: props.positionAbsoluteX,
                      y: props.positionAbsoluteY,
                    },
                  } as AppNode);
                  setMenuOpen(false);
                }}
              >
                Copy
              </button>
              {[
                {
                  type: "control-point" as const,
                  label: "Control Point" as const,
                  className:
                    "bg-blue-200 text-gray-500 hover:bg-blue-300 hover:text-gray-600",
                },
                {
                  type: "action" as const,
                  label: "Action" as const,
                  className:
                    "bg-green-200 text-gray-500 hover:bg-green-300 hover:text-gray-600",
                },
                {
                  type: "conditional" as const,
                  label: "Conditional" as const,
                  className:
                    "bg-purple-200 text-gray-500 hover:bg-purple-300 hover:text-gray-600",
                },
              ]
                .filter((typeConfig) => {
                  // If there's no source node type, show all options
                  if (!data.sourceNodeType) return true;

                  // Check if this type is allowed by the connection rules
                  const rules =
                    NODE_CONNECTION_RULES[
                      data.sourceNodeType as keyof typeof NODE_CONNECTION_RULES
                    ];
                  return rules?.canConnectTo.includes(typeConfig.type);
                })
                .map((typeConfig) => (
                  <button
                    key={typeConfig.type}
                    className={`w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100`}
                    onClick={() => {
                      if (typeConfig.type === "action") {
                        updateNodeSchema(id, {
                          type: "action",
                          label: "Action",
                          index: schema?.type === "action" ? schema.index : 0,
                          description: "",
                        });
                      } else if (typeConfig.type === "control-point") {
                        updateNodeSchema(id, {
                          type: "control-point",
                          label: "Control Point",
                          index:
                            schema?.type === "action" ? 0 : schema?.index || 0,
                          motivation: "",
                        });
                      } else {
                        updateNodeSchema(id, {
                          type: "conditional",
                          label: "Conditional",
                          index:
                            schema?.type === "action" ? 0 : schema?.index || 0,
                          condition: "",
                        });
                      }
                      setMenuOpen(false);
                    }}
                  >
                    {typeConfig.label}
                  </button>
                ))}
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={() => {
                  deleteNode(id);
                  setMenuOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        {/* Top handle */}
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className={`toolbar-handle ${schema?.type}`}
          style={{ top: -2 }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={`toolbar-handle ${schema?.type}`}
          style={{ top: -2 }}
          isConnectableStart={false}
        />
        {/* Bottom handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={`toolbar-handle ${schema?.type}`}
          style={{ bottom: -2 }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className={`toolbar-handle ${schema?.type}`}
          style={{ bottom: -2 }}
          isConnectableStart={false}
        />
        {/* Left handle */}
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className={`toolbar-handle ${schema?.type}`}
          style={{ left: -2 }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className={`toolbar-handle ${schema?.type}`}
          style={{ left: -2 }}
          isConnectableStart={false}
        />
        {/* Right handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={`toolbar-handle ${schema?.type}`}
          style={{ right: -2 }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className={`toolbar-handle ${schema?.type}`}
          style={{ right: -2 }}
          isConnectableStart={false}
        />
        {schema ? (
          <div className="space-y-2 p-2 text-left">
            <p className="text-sm font-bold">
              {schema.label}{" "}
              {schema.type === "action" ? schema.index : schema.index}
            </p>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Index</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={schema.index ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsedValue =
                      value === "" ? undefined : parseInt(value);
                    if (parsedValue === undefined || parsedValue >= 0) {
                      updateNodeSchema(id, {
                        index: parsedValue,
                      });
                    }
                  }}
                  onFocus={() => setIsTextFocused(true)}
                  onBlur={() => setIsTextFocused(false)}
                  className="w-full p-1 border rounded"
                  placeholder="Enter index..."
                  min="0"
                  step="1"
                />
              </div>
            </div>
            {schema.type === "conditional" && (
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">
                  Go to Control Point
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schema.target_index ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        const parsedValue =
                          value === "" ? undefined : parseInt(value);
                        if (parsedValue === undefined || parsedValue >= 0) {
                          updateNodeSchema(id, {
                            target_index: parsedValue,
                          });
                        }
                      }
                    }}
                    onFocus={() => setIsTextFocused(true)}
                    onBlur={() => setIsTextFocused(false)}
                    className="w-full p-1 border rounded"
                    placeholder="Enter target index..."
                  />
                </div>
              </div>
            )}
            {schema.type === "action" && (
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">
                  Fragment Indices
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localFragmentInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setLocalFragmentInput(value);
                      }
                    }}
                    onFocus={() => setIsTextFocused(true)}
                    onBlur={() => setIsTextFocused(false)}
                    className="w-full p-1 border rounded"
                    placeholder="Enter fragment index..."
                  />
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      const parsedValue = parseInt(localFragmentInput);
                      if (!isNaN(parsedValue) && parsedValue >= 0) {
                        // Check if the fragment index already exists
                        if (!schema.fragments?.includes(parsedValue)) {
                          const newFragments = [
                            ...(schema.fragments || []),
                            parsedValue,
                          ];
                          updateNodeSchema(id, {
                            fragments: newFragments,
                          });
                          setLocalFragmentInput("");
                        }
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(schema.fragments || []).map((fragment, idx) => (
                    <div
                      key={idx}
                      className="relative group bg-blue-100 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      <span>{fragment}</span>
                      <button
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newFragments = (schema.fragments || []).filter(
                            (_, i) => i !== idx,
                          );
                          updateNodeSchema(id, {
                            fragments: newFragments,
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {(schema.fragments || []).length > 1 && (
                  <div className="flex flex-col mt-2">
                    <label className="text-sm font-medium mb-1">
                      Delay (seconds)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={schema.delay ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const parsedValue =
                            value === "" ? undefined : parseFloat(value);
                          if (parsedValue === undefined || parsedValue >= 0) {
                            updateNodeSchema(id, {
                              delay: parsedValue,
                            });
                          }
                        }}
                        onFocus={() => setIsTextFocused(true)}
                        onBlur={() => setIsTextFocused(false)}
                        className="w-full p-1 border rounded"
                        placeholder="Enter delay in seconds..."
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">
                {schema.type === "control-point"
                  ? "Goal"
                  : schema.type === "conditional"
                    ? "Condition"
                    : schema.type === "action"
                      ? "Description"
                      : ""}
              </label>
              <textarea
                rows={5}
                value={localText}
                onChange={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  setLocalText(e.target.value);
                }}
                onFocus={() => setIsTextFocused(true)}
                onBlur={() => {
                  setIsTextFocused(false);
                  if (!schema) return;
                  updateNodeSchema(id, {
                    [schema.type === "control-point"
                      ? "motivation"
                      : schema.type === "conditional"
                        ? "condition"
                        : "description"]: localText,
                  });
                }}
                className="w-full p-1 border rounded resize-none overflow-hidden"
                placeholder={`Enter ${
                  schema?.type === "control-point"
                    ? "motivation"
                    : schema?.type === "conditional"
                      ? "condition"
                      : "description"
                }...`}
              />
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="text-center font-medium mb-2">
              Choose node type:
            </div>
            {(() => {
              const validTypes = [
                {
                  type: "control-point" as const,
                  label: "Control Point" as const,
                  className:
                    "bg-blue-200 text-gray-500 hover:bg-blue-300 hover:text-gray-600",
                },
                {
                  type: "action" as const,
                  label: "Action" as const,
                  className:
                    "bg-green-200 text-gray-500 hover:bg-green-300 hover:text-gray-600",
                },
                {
                  type: "conditional" as const,
                  label: "Conditional" as const,
                  className:
                    "bg-purple-200 text-gray-500 hover:bg-purple-300 hover:text-gray-600",
                },
              ].filter((typeConfig) => {
                // If there's no source node type, show all options
                if (!data.sourceNodeType) return true;

                // Check if this type is allowed by the connection rules
                const rules =
                  NODE_CONNECTION_RULES[
                    data.sourceNodeType as keyof typeof NODE_CONNECTION_RULES
                  ];
                return rules?.canConnectTo.includes(typeConfig.type);
              });

              if (validTypes.length === 0) {
                // Show notification and delete node only once
                if (!notificationShown.current) {
                  notificationShown.current = true;
                  showNotification(
                    "No valid node types available for connection.",
                    "error",
                  );
                  deleteNode(id);
                }
                return null;
              }

              return (
                <div className="flex gap-4 justify-center">
                  {validTypes.map((typeConfig) => (
                    <button
                      key={typeConfig.type}
                      className={`px-4 py-2 rounded-xl ${typeConfig.className}`}
                      onClick={() => {
                        if (typeConfig.type === "action") {
                          updateNodeSchema(id, {
                            type: "action",
                            label: "Action",
                            index: undefined,
                            description: "",
                            delay: 0.5,
                            fragments: [],
                          });
                        } else if (typeConfig.type === "control-point") {
                          updateNodeSchema(id, {
                            type: "control-point",
                            label: "Control Point",
                            index: undefined,
                            motivation: "",
                          });
                        } else {
                          updateNodeSchema(id, {
                            type: "conditional",
                            label: "Conditional",
                            index: undefined,
                            condition: "",
                            target_index: undefined,
                          });
                        }
                        setMenuOpen(false);
                      }}
                    >
                      {typeConfig.label}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
};

export default ToolbarNode;
