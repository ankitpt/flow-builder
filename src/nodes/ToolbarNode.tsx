import {
  NodeToolbar,
  useReactFlow,
  type NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import {
  type ToolbarNode,
  type NodeSchema,
  type ControlPoint,
  type Action,
} from "./types";
import { useState, useEffect, useMemo } from "react";
import { useSchemaStore } from "../store/schemaStore";

function ToolbarNode(props: NodeProps<ToolbarNode>) {
  const { deleteElements } = useReactFlow();
  const { getNodeSchema, setNodeSchema } = useSchemaStore();

  const [schema, setSchema] = useState<NodeSchema | null>(() => {
    const storedSchema = getNodeSchema(props.id);
    if (storedSchema) {
      return storedSchema;
    }
    return null;
  });

  useEffect(() => {
    // Update store whenever schema changes
    if (schema) {
      setNodeSchema(props.id, schema);
    }
  }, [schema, props.id, setNodeSchema]);

  const isControlPoint = useMemo(() => {
    return schema?.label === "Control Point";
  }, [schema?.label]);

  const toggleSchemaType = () => {
    if (!schema) return;

    if (isControlPoint) {
      const currentSchema = schema.schema as ControlPoint;
      setSchema({
        label: "Action",
        schema: {
          index: currentSchema.index || 0,
          description: "",
        },
      });
    } else {
      const currentSchema = schema.schema as Action;
      setSchema({
        label: "Control Point",
        schema: {
          index: currentSchema.index || 0,
          motivation: "",
          conditions: [],
        },
      });
    }
  };

  return (
    <>
      <NodeToolbar
        isVisible={props.selected}
        position={props.data.toolbarPosition}
      >
        <div className="flex gap-2 text-sm">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            onClick={() => deleteElements({ nodes: [{ id: props.id }] })}
          >
            delete
          </button>
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            onClick={toggleSchemaType}
          >
            {isControlPoint ? "Switch to Action" : "Switch to Control Point"}
          </button>
        </div>
      </NodeToolbar>
      <div
        className={`react-flow__node-default toolbar-node min-w-[250px]${props.selected ? " selected" : ""} ${schema ? (isControlPoint ? "bg-blue-100" : "bg-green-100") : ""}`}
      >
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
        {schema ? (
          <div className="space-y-2 p-2 text-left">
            <p className="text-sm font-bold">
              {schema.label} {schema.schema.index}
            </p>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Index</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={schema.schema.index}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setSchema({
                        ...schema,
                        schema: {
                          ...schema.schema,
                          index: value === "" ? 0 : parseInt(value),
                        },
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
                      const currentIndex = schema.schema.index;
                      if (typeof currentIndex === "number") {
                        setSchema({
                          ...schema,
                          schema: {
                            ...schema.schema,
                            index: currentIndex + 1,
                          },
                        });
                      }
                    }}
                  >
                    +
                  </button>
                  <button
                    className="text-xs px-1 bg-gray-200 rounded-b hover:bg-gray-300"
                    onClick={() => {
                      const currentIndex = schema.schema.index;
                      if (
                        typeof currentIndex === "number" &&
                        currentIndex > 1
                      ) {
                        setSchema({
                          ...schema,
                          schema: {
                            ...schema.schema,
                            index: currentIndex - 1,
                          },
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
                {isControlPoint ? "Motivation" : "Description"}
              </label>
              <textarea
                rows={5}
                value={
                  isControlPoint
                    ? (schema.schema as ControlPoint).motivation
                    : (schema.schema as Action).description
                }
                onChange={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;

                  setSchema({
                    ...schema,
                    schema: {
                      ...schema.schema,
                      [isControlPoint ? "motivation" : "description"]:
                        e.target.value,
                    },
                  });
                }}
                className="w-full p-1 border rounded resize-none overflow-hidden"
                placeholder={`Enter ${isControlPoint ? "motivation" : "description"}...`}
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
                  setSchema({
                    label: "Control Point",
                    schema: {
                      index: parseInt(props.id) || 0,
                      motivation: "",
                      conditions: [],
                    },
                  })
                }
              >
                Control Point
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={() =>
                  setSchema({
                    label: "Action",
                    schema: {
                      index: parseInt(props.id) || 0,
                      description: "",
                    },
                  })
                }
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
