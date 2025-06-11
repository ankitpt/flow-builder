import type { NodeTypes } from '@xyflow/react';

import { PositionLoggerNode } from './PositionLoggerNode';
import { AppNode } from './types';
import ToolbarNode from './ToolbarNode';

export const initialNodes: AppNode[] = [
  { id: 'a', type: 'toolbar', position: { x: 0, y: 0 }, data: { label: 'autodeploy worked 2' } },
];

export const nodeTypes = {
  'position-logger': PositionLoggerNode,
  'toolbar': ToolbarNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
