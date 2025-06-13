import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import React from "react";
import { RxCross1 } from "react-icons/rx";
import { ImCross } from "react-icons/im";

export function ToolbarEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  id,
}: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} className="toolbar-edge" />
      {selected && (
        <g
          transform={`translate(${(sourceX + targetX) / 2}, ${(sourceY + targetY) / 2})`}
          className="cursor-pointer"
          onClick={() => deleteElements({ edges: [{ id }] })}
        >
          <circle r={8} fill="#FFFFFF" />
          <foreignObject x={-8} y={-8} width={16} height={16}>
            <div className="flex items-center justify-center h-full text-red-500 p-2">
              <ImCross className="w-2 h-2" />
            </div>
          </foreignObject>
        </g>
      )}
    </>
  );
}
