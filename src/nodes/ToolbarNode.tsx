import { NodeToolbar, useReactFlow, type NodeProps, Handle, Position } from "@xyflow/react";
import { type ToolbarNode } from "./types";

function ToolbarNode(props: NodeProps<ToolbarNode>) {
  const { deleteElements } = useReactFlow();
  return (
    <>
      <NodeToolbar
        isVisible={props.selected}
        position={props.data.toolbarPosition}
      >
        <button 
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          onClick={() => deleteElements({ nodes: [{ id: props.id }] })}
        >
          delete
        </button>
      </NodeToolbar>
      <div className={`react-flow__node-default ${props.selected ? 'selected' : ''}`}>
        {props.data.label && <div>{props.data.label}</div>}
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    </>
  );
}

export default ToolbarNode;