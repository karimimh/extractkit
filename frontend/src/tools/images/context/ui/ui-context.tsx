import React, { createContext, ReactNode, useReducer } from "react";
import { uiReducer } from "./reducer";
import { Action, initialState, UIState } from "../../types/ui-context-types";

interface UIContextProps {
  state: UIState;
  dispatch: React.Dispatch<Action>;
}

const UIContext = createContext<UIContextProps | undefined>(undefined);

export { UIContext };

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const enhancedDispatch = (action: Action) => {
    localStorage.setItem("uiState", JSON.stringify(state));
    dispatch(action);
  };

  return (
    <UIContext.Provider value={{ state, dispatch: enhancedDispatch }}>
      {children}
    </UIContext.Provider>
  );
};
