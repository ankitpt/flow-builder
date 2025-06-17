import { createContext, useState, ReactNode } from "react";

interface FlowContextType {
  isTextFocused: boolean;
  setIsTextFocused: (focused: boolean) => void;
}

export const FlowContext = createContext<FlowContextType | undefined>(
  undefined,
);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [isTextFocused, setIsTextFocused] = useState(false);

  return (
    <FlowContext.Provider value={{ isTextFocused, setIsTextFocused }}>
      {children}
    </FlowContext.Provider>
  );
}
