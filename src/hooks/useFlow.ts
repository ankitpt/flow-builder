import { useContext } from "react";
import { FlowContext } from "../contexts/FlowContext";

export function useFlow() {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error("useFlow must be used within a FlowProvider");
  }
  return context;
}
