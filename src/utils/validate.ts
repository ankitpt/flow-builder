// validate that all nodes have metadata filled out

import { Edge } from "@xyflow/react";
import { AppNode } from "../nodes/types";

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
        if (schema.index === undefined || schema.index === "") {
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
        if (schema.index === undefined || schema.index === "") {
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
        if (schema.index === undefined || schema.index === "") {
          errors.push("Action node is missing its index. Please add an index.");
        }
      }
    }
  }

  return errors;
};
