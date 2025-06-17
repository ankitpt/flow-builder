import { createContext, useState, ReactNode, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

interface FlowContextType {
  isTextFocused: boolean;
  setIsTextFocused: (focused: boolean) => void;
  handleEditName: (flowId: string, newName: string) => Promise<void>;
}

export const FlowContext = createContext<FlowContextType | undefined>(
  undefined,
);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [isTextFocused, setIsTextFocused] = useState(false);
  const { getNodes, getEdges } = useReactFlow();

  const handleEditName = useCallback(
    async (flowId: string, newName: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const response = await fetch(`/api/flow/${flowId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newName,
            flow: { nodes: getNodes(), edges: getEdges() },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update flow name");
        }
      } catch (error) {
        console.error("Error updating flow name:", error);
      }
    },
    [getNodes, getEdges],
  );

  return (
    <FlowContext.Provider
      value={{
        isTextFocused,
        setIsTextFocused,
        handleEditName,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}
