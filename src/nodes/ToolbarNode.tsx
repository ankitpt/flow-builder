import {
  NodeToolbar,
  useReactFlow,
  type NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import { type ToolbarNode, type ControlPoint, type Action, type NodeSchema } from "./types";
import { useMemo, useCallback, useState, useEffect } from "react";
import React from "react";

type ToolbarNodeProps = NodeProps<ToolbarNode> & {
  updateNodeSchema: (id: string, updates: Partial<NodeSchema>) => void;
  handleDelete: (id: string) => void;
};

function ToolbarNode(props: ToolbarNodeProps) {
  const schema = props.data.schema;
  const [localText, setLocalText] = useState(() => {
    if (!schema) {
      return "";
    }
    return schema.type === "control-point"
      ? (schema as ControlPoint).motivation
      : (schema as Action).description;
  });

  // Update local text when schema changes from outside
  useEffect(() => {
    if (!schema) return;
    const newText = schema.type === "control-point"
      ? (schema as ControlPoint).motivation
      : (schema as Action).description;
    setLocalText(newText);
  }, [schema]);

  const handleSchemaUpdate = useCallback((updates: Partial<NodeSchema>) => {
    if (!schema) return;
    props.updateNodeSchema(props.id, updates);
  }, [schema, props]);

  const toggleSchemaType = useCallback(() => {
    if (!schema) return;
    if (schema.type === "control-point") {
      handleSchemaUpdate({
        type: "action",
        label: "Action",
        index: schema.index || 0,
        description: "",
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
        position={props.data.toolbarPosition}
      >
        <div className="flex gap-2 text-sm">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            onClick={() => props.handleDelete(props.id)}
          >
            delete
          </button>
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            onClick={toggleSchemaType}
          >
            {schema?.type === "control-point" ? "Switch to Action" : "Switch to Control Point"}
          </button>
        </div>
      </NodeToolbar>
      <div
        className={`toolbar-node min-w-[250px]${props.selected ? " selected" : ""} ${schema ? schema.type : ""}`}
      >
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
              {schema.label} {schema.index}
            </p>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Index</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={schema.index}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      handleSchemaUpdate({
                        index: value === "" ? 0 : parseInt(value),
                      });
                    }
                  }}
                  className="w-full p-1 border rounded"
                  placeholder="Enter index..."
                />
                <div className="flex flex-col">
                  <button
                    className="text-xs px-1 bg-gray-200 rounded-t hover:bg-gray-300"
                    onClick={() => {
                      const currentIndex = schema.index;
                      if (typeof currentIndex === "number") {
                        handleSchemaUpdate({
                          index: currentIndex + 1,
                        });
                      }
                    }}
                  >
                    +
                  </button>
                  <button
                    className="text-xs px-1 bg-gray-200 rounded-b hover:bg-gray-300"
                    onClick={() => {
                      const currentIndex = schema.index;
                      if (
                        typeof currentIndex === "number" &&
                        currentIndex > 1
                      ) {
                        handleSchemaUpdate({
                          index: currentIndex - 1,
                        });
                      }
                    }}
                  >
                    -
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">
                {schema.type === "control-point" ? "Motivation" : "Description"}
              </label>
              <textarea
                rows={5}
                value={localText}
                onChange={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  setLocalText(e.target.value);  // Only update local state
                }}
                onBlur={() => {
                  if (!schema) return;
                  handleSchemaUpdate({  // Update schema only when textarea loses focus
                    [schema.type === "control-point" ? "motivation" : "description"]: localText,
                  });
                }}
                className="w-full p-1 border rounded resize-none overflow-hidden"
                placeholder={`Enter ${schema?.type === "control-point" ? "motivation" : "description"}...`}
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
                onClick={() => props.updateNodeSchema(props.id, {
                  type: "control-point",
                  label: "Control Point",
                  index: parseInt(props.id) || 0,
                  motivation: "",
                })}
              >
                Control Point
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={() => props.updateNodeSchema(props.id, {
                  type: "action",
                  label: "Action",
                  index: parseInt(props.id) || 0,
                  description: "",
                })}
              >
                Action
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ToolbarNode;
