import { createContext, useState, ReactNode } from "react";

interface FlowContextType {
  isTextareaFocused: boolean;
  setIsTextareaFocused: (focused: boolean) => void;
}

export const FlowContext = createContext<FlowContextType | undefined>(
  undefined,
);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  return (
    <FlowContext.Provider value={{ isTextareaFocused, setIsTextareaFocused }}>
      {children}
    </FlowContext.Provider>
  );
}
