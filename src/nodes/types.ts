import type { Node, BuiltInNode, Position } from '@xyflow/react';

export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>;
export type ToolbarNode = Node<{ label: string, forceToolbarVisible?: boolean, toolbarPosition?: Position }, 'toolbar'>;
export type AppNode = BuiltInNode | PositionLoggerNode | ToolbarNode;
