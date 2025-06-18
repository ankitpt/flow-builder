import { createContext, useState, ReactNode, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

export interface FlowMetadata {
  title: string;
  slide_idx: number;
  tutor_opening_phrase: string;
}

interface FlowContextType {
  isTextFocused: boolean;
  setIsTextFocused: (focused: boolean) => void;
  handleEditName: (flowId: string, newName: string) => Promise<void>;
  metadata: FlowMetadata;
  setMetadata: (metadata: FlowMetadata) => void;
  updateMetadata: (updates: Partial<FlowMetadata>) => void;
  lastUpdated: Date | null;
  setLastUpdated: (date: Date) => void;
}

export const FlowContext = createContext<FlowContextType | undefined>(
  undefined,
);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [metadata, setMetadata] = useState<FlowMetadata>({
    title: "",
    slide_idx: 0,
    tutor_opening_phrase: "",
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { getNodes, getEdges } = useReactFlow();

  const updateMetadata = useCallback((updates: Partial<FlowMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updates }));
  }, []);

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
        metadata,
        setMetadata,
        updateMetadata,
        lastUpdated,
        setLastUpdated,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}
