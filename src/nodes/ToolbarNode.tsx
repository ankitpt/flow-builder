import { NodeToolbar, Handle, Position } from "@xyflow/react";
import {
  type ToolbarNode,
  type ControlPoint,
  type Action,
  type NodeSchema,
  ToolbarNodeProps,
  type Conditional,
  AppNode,
} from "./types";
import { useCallback, useState, useEffect } from "react";
import { FaRegEdit } from "react-icons/fa";
import { useCopyPaste } from "../hooks/useCopyPaste";

const ToolbarNode = (props: ToolbarNodeProps) => {
  const { data, id, updateNodeSchema, handleDelete } = props;
  const { copyNode } = useCopyPaste();
  const schema = data.schema;
  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleSchemaUpdate = useCallback(
    (updates: Partial<NodeSchema>) => {
      if (!schema) return;
      updateNodeSchema(id, updates);
    },
    [schema, id, updateNodeSchema],
  );

  const toggleSchemaType = useCallback(() => {
    if (!schema) return;
    if (schema.type === "control-point") {
      handleSchemaUpdate({
        type: "action",
        label: "Action",
        fragment_index: schema.index || 0,
        description: "",
      });
    } else if (schema.type === "action") {
      handleSchemaUpdate({
        type: "conditional",
        label: "Condition",
        index: schema.fragment_index || 0,
        target_index: undefined,
        condition: "",
      });
    } else {
      handleSchemaUpdate({
        type: "control-point",
        label: "Control Point",
        index: schema.index || 0,
        motivation: "",
      });
    }
  }, [schema, handleSchemaUpdate]);

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
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={() => {
                  handleDelete(id);
                  setMenuOpen(false);
                }}
              >
                Delete
              </button>
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
              <button
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                onClick={() => {
                  toggleSchemaType();
                  setMenuOpen(false);
                }}
              >
                {schema?.type === "control-point"
                  ? "Switch to Action"
                  : schema?.type === "action"
                    ? "Switch to Condition"
                    : "Switch to Control Point"}
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
          style={{ top: -8 }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={`toolbar-handle ${schema?.type}`}
          style={{ top: -8 }}
        />
        {/* Bottom handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={`toolbar-handle ${schema?.type}`}
          style={{ bottom: -8 }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className={`toolbar-handle ${schema?.type}`}
          style={{ bottom: -8 }}
        />
        {/* Left handle */}
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className={`toolbar-handle ${schema?.type}`}
          style={{ left: -8 }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className={`toolbar-handle ${schema?.type}`}
          style={{ left: -8 }}
        />
        {/* Right handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={`toolbar-handle ${schema?.type}`}
          style={{ right: -8 }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className={`toolbar-handle ${schema?.type}`}
          style={{ right: -8 }}
        />
        {schema ? (
          <div className="space-y-2 p-2 text-left">
            <p className="text-sm font-bold">
              {schema.label}{" "}
              {schema.type === "action" ? schema.fragment_index : schema.index}
            </p>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">
                {schema.type === "action" ? "Fragment Index" : "Index"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={
                    schema.type === "action"
                      ? schema.fragment_index
                      : schema.index
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      const parsedValue = value === "" ? 0 : parseInt(value);
                      if (parsedValue >= 0) {
                        handleSchemaUpdate({
                          [schema.type === "action"
                            ? "fragment_index"
                            : "index"]: parsedValue,
                        });
                      }
                    }
                  }}
                  className="w-full p-1 border rounded"
                  placeholder="Enter index..."
                />
                <div className="flex flex-col">
                  <button
                    className="text-xs px-1 bg-gray-200 rounded-t hover:bg-gray-300"
                    onClick={() => {
                      const currentIndex =
                        schema.type === "action"
                          ? schema.fragment_index
                          : schema.index;
                      handleSchemaUpdate({
                        [schema.type === "action" ? "fragment_index" : "index"]:
                          (currentIndex ?? 0) + 1,
                      });
                    }}
                  >
                    +
                  </button>
                  <button
                    className="text-xs px-1 bg-gray-200 rounded-b hover:bg-gray-300"
                    onClick={() => {
                      const currentIndex =
                        schema.type === "action"
                          ? schema.fragment_index
                          : schema.index;
                      if ((currentIndex ?? 0) > 0) {
                        handleSchemaUpdate({
                          [schema.type === "action"
                            ? "fragment_index"
                            : "index"]: (currentIndex ?? 0) - 1,
                        });
                      }
                    }}
                  >
                    -
                  </button>
                </div>
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
                          handleSchemaUpdate({
                            target_index: parsedValue,
                          });
                        }
                      }
                    }}
                    className="w-full p-1 border rounded"
                    placeholder="Enter target index..."
                  />
                  <div className="flex flex-col">
                    <button
                      className="text-xs px-1 bg-gray-200 rounded-t hover:bg-gray-300"
                      onClick={() => {
                        const currentTargetIndex = schema.target_index;
                        if (typeof currentTargetIndex === "number") {
                          handleSchemaUpdate({
                            target_index: currentTargetIndex + 1,
                          });
                        } else {
                          handleSchemaUpdate({
                            target_index: 1,
                          });
                        }
                      }}
                    >
                      +
                    </button>
                    <button
                      className="text-xs px-1 bg-gray-200 rounded-b hover:bg-gray-300"
                      onClick={() => {
                        const currentTargetIndex = schema.target_index;
                        if (typeof currentTargetIndex === "number") {
                          handleSchemaUpdate({
                            target_index: currentTargetIndex - 1,
                          });
                        }
                      }}
                    >
                      -
                    </button>
                  </div>
                </div>
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
                onBlur={() => {
                  if (!schema) return;
                  handleSchemaUpdate({
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
            <div className="flex gap-4 justify-center">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() =>
                  updateNodeSchema(id, {
                    type: "control-point",
                    label: "Control Point",
                    index: 0,
                    motivation: "",
                  })
                }
              >
                Control Point
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={() =>
                  updateNodeSchema(id, {
                    type: "action",
                    label: "Action",
                    fragment_index: 0,
                    description: "",
                  })
                }
              >
                Action
              </button>
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                onClick={() =>
                  updateNodeSchema(id, {
                    type: "conditional",
                    label: "Condition",
                    index: 0,
                    condition: "",
                  })
                }
              >
                Condition
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ToolbarNode;
