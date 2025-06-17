import { Edge } from "@xyflow/react";
import { AppNode, NodeSchema, NodeType } from "../nodes/types";

export type ValidationResult = {
  isValid: boolean;
  errorMessages: string[];
};

const isConnected = (nodes: AppNode[], edges: Edge[]): boolean => {
  if (nodes.length === 0) return true; // Empty graph is considered connected

  const visited = new Set<string>();
  const queue = [nodes[0].id];

  // Create adjacency list for faster lookup
  const adjacencyList = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    if (!adjacencyList.has(edge.target)) {
      adjacencyList.set(edge.target, []);
    }
    adjacencyList.get(edge.source)?.push(edge.target);
    adjacencyList.get(edge.target)?.push(edge.source);
  });

  // BFS to visit all connected nodes
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;

    visited.add(nodeId);

    // Add all unvisited neighbors to the queue
    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  // Check if all nodes were visited
  console.log("Visited nodes", visited.size, "of", nodes.length);
  return visited.size === nodes.length;
};

export const validateGraph = (
  nodes: AppNode[],
  edges: Edge[],
): ValidationResult => {
  const errors: string[] = [];

  // validate that graph is connected
  const connected = isConnected(nodes, edges);
  if (!connected) {
    errors.push("Flow is not connected. Please connect all nodes.");
  }

  // validate that all nodes have metadata filled out
  const nodeErrors = validateNodes(nodes);
  errors.push(...nodeErrors);

  return {
    isValid: errors.length === 0,
    errorMessages: errors,
  };
};

const validateNodes = (nodes: AppNode[]): string[] => {
  const errors: string[] = [];

  for (const node of nodes) {
    if (node.type === "toolbar") {
      const schema = node.data.schema;
      if (schema === null) {
        errors.push("Node has no type selected. Please choose a node type.");
      }
      if (schema?.type === "conditional") {
        if (schema.condition === "") {
          errors.push(
            "Conditional node is missing its condition. Please add a condition.",
          );
        }
        if (schema.index === undefined || schema.index === null) {
          errors.push(
            "Conditional node is missing its index. Please add an index.",
          );
        }
      }
      if (schema?.type === "control-point") {
        if (schema.motivation === "") {
          errors.push(
            "Control Point node is missing its goal. Please add a goal.",
          );
        }
        if (schema.index === undefined || schema.index === null) {
          errors.push(
            "Control Point node is missing its index. Please add an index.",
          );
        }
      }
      if (schema?.type === "action") {
        if (schema.description === "") {
          errors.push(
            "Action node is missing its description. Please add a description.",
          );
        }
        if (schema.index === undefined || schema.index === null) {
          errors.push("Action node is missing its index. Please add an index.");
        }
      }
    }
  }

  return errors;
};

const NODE_CONNECTION_RULES = {
  conditional: {
    canConnectTo: [] as NodeType[],
    errorMessage: "Conditional nodes cannot connect to other nodes.",
  },
  "control-point": {
    canConnectTo: ["control-point", "action", "conditional"] as NodeType[],
    errorMessage:
      "Control Point nodes can only connect to Control Points, Actions, or Conditionals.",
  },
  action: {
    canConnectTo: ["action", "conditional"] as NodeType[],
    errorMessage: "Action nodes can only connect to Actions or Conditionals.",
  },
} as const;

export const validateNewEdge = (
  edge: Edge,
  source: AppNode | null,
  target: AppNode | null,
): string[] => {
  const errors: string[] = [];

  if (edge.type === "toolbar") {
    if (!source || !target) {
      errors.push("Edge must have both source and target nodes.");
      return errors;
    }

    if (!("schema" in source.data) || !("schema" in target.data)) {
      errors.push("Both nodes must have a schema.");
      return errors;
    }

    const sourceSchema = source.data.schema as NodeSchema;
    const targetSchema = target.data.schema as NodeSchema;

    if (sourceSchema === null || targetSchema === null) {
      errors.push("Both nodes must have a schema.");
      return errors;
    }

    const sourceType = sourceSchema.type as NodeType;
    const targetType = targetSchema.type as NodeType;

    if (sourceType in NODE_CONNECTION_RULES) {
      const rules = NODE_CONNECTION_RULES[sourceType];
      if (!rules.canConnectTo.includes(targetType)) {
        errors.push(rules.errorMessage);
      }
    }
  }
  return errors;
};

export const validateNewNode = (
  node: AppNode,
  source: AppNode | null,
): string[] => {
  const errors: string[] = [];

  if (node.type === "toolbar") {
    if (!source) {
      errors.push("Node must have a source node.");
      return errors;
    }

    if (!("schema" in source.data)) {
      errors.push("Source node must have a schema.");
      return errors;
    }

    const schema = node.data.schema as NodeSchema;
    const sourceSchema = source.data.schema as NodeSchema;

    if (sourceSchema === null) {
      errors.push("Source node must have a schema.");
      return errors;
    }

    const sourceType = sourceSchema.type as NodeType;

    if (sourceType in NODE_CONNECTION_RULES) {
      const rules = NODE_CONNECTION_RULES[sourceType];
      if (schema?.type && !rules.canConnectTo.includes(schema.type)) {
        errors.push(rules.errorMessage);
      }
    }
  }
  return errors;
};
