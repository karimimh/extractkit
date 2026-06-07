import React, { useContext } from "react";
import { Action, UIState } from "../../types/ui-context-types";
import { UIContext } from "./ui-context";

export const useUIContext = (): UIState & {
  dispatch: React.Dispatch<Action>;
} => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIContext must be used within a UIProvider");
  }
  return { ...context.state, dispatch: context.dispatch };
};
