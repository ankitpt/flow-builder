import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";
import { ImCross } from "react-icons/im";
import { useNodeOperations } from "../hooks/useNodeOperations";

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
  const { deleteEdge } = useNodeOperations();
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
          onClick={() => deleteEdge(id)}
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
