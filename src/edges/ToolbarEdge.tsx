import { BaseEdge, EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react';

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
      <BaseEdge path={edgePath} />
      {selected && (
        <g
          transform={`translate(${(sourceX + targetX) / 2}, ${(sourceY + targetY) / 2})`}
          className="cursor-pointer"
          onClick={() => deleteElements({ edges: [{ id }] })}
        >
          <circle r={8} fill="white" stroke="black" strokeWidth={1} />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs"
          >
            x
          </text>
        </g>
      )}
    </>
  );
} 