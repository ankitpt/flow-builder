import { NodeSchema } from "../nodes/types";
import { nanoid } from "nanoid";

/**
 * Generates a node ID based on the node type and schema
 * During editing: {nodeType}-{schemaType}-{nanoid}
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

  const uniqueId = nanoid(10); // Generate 10-character unique ID
  const schemaType = schema?.type || "empty";
  return `${nodeType}-${schemaType}-${uniqueId}`;
}

/**
 * Parses a node ID into its components
 * @returns {nodeType: string, schemaType: string, uniqueId: string} or null if invalid format
 */
export function parseNodeId(
  id: string,
): { nodeType: string; schemaType: string; uniqueId: string } | null {
  const parts = id.split("-");
  if (parts.length < 3) return null;

  const uniqueId = parts[parts.length - 1];
  const schemaType = parts[parts.length - 2];
  const nodeType = parts.slice(0, -2).join("-");

  return { nodeType, schemaType, uniqueId };
}
