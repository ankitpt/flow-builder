import { NodeSchema } from "../nodes/types";

/**
 * Generates a node ID based on the node type and schema
 * During editing: {nodeType}-{schemaType}-{timestamp}
 * On export: {schemaType}-{index}
 */
export function generateNodeId(
  nodeType: string,
  schema: NodeSchema | null,
  isExport: boolean = false,
): string {
  if (isExport && schema?.index !== undefined) {
    return `${schema.type}-${schema.index}`;
  }

  const timestamp = Date.now();
  const schemaType = schema?.type || "empty";
  return `${nodeType}-${schemaType}-${timestamp}`;
}

/**
 * Parses a node ID into its components
 * @returns {nodeType: string, schemaType: string, timestamp: number} or null if invalid format
 */
export function parseNodeId(
  id: string,
): { nodeType: string; schemaType: string; timestamp: number } | null {
  const parts = id.split("-");
  if (parts.length < 3) return null;

  const timestamp = parseInt(parts[parts.length - 1]);
  if (isNaN(timestamp)) return null;

  const schemaType = parts[parts.length - 2];
  const nodeType = parts.slice(0, -2).join("-");

  return { nodeType, schemaType, timestamp };
}
