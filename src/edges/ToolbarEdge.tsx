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

  const markerId = `arrowhead-${id}`;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path
            d="M0,0 L6,3.5"
            fill="none"
            stroke={
              selected
                ? "oklch(44.6% 0.03 256.802)"
                : "oklch(70.7% 0.022 261.325)"
            }
            strokeWidth="1"
          />
          <path
            d="M0,7 L6,3.5"
            fill="none"
            stroke={
              selected
                ? "oklch(44.6% 0.03 256.802)"
                : "oklch(70.7% 0.022 261.325)"
            }
            strokeWidth="1"
          />
        </marker>
      </defs>
      <BaseEdge
        path={edgePath}
        className="toolbar-edge"
        markerEnd={`url(#${markerId})`}
      />
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
