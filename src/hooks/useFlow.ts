import { useContext } from "react";
import { FlowContext } from "../contexts/FlowContext";

export function useFlow() {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error("useFlow must be used within a FlowProvider");
  }
  return context;
}

// Export the metadata type for use in other components
export type { FlowMetadata } from "../contexts/FlowContext";
