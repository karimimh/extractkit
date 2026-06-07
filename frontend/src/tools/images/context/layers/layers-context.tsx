import { getActionDescription } from "@images/utils/history-utils";
import { deepCopy, generateId } from "@images/utils/object-utils";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  HistoryEntry,
  LayersAction,
  LayersActionTypes,
  LayersState,
  initialLayersState,
} from "../../types/layers-context-types";
import layersReducer from "./reducer";

interface LayersContextProps {
  state: LayersState;
  dispatch: React.Dispatch<LayersAction>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => void;
  historyEntries: HistoryEntry[];
  redoEntries: HistoryEntry[];
}

const LayersContext = createContext<LayersContextProps | undefined>(undefined);

export { LayersContext };

export const LayersProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(layersReducer, initialLayersState);
  const stateRef = useRef(state); // ref for preventing recreation of enhancedDispatch on state change
  const [historyStack, setHistoryStack] = useState<LayersState[]>([]);
  const [redoStack, setRedoStack] = useState<LayersState[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [redoEntries, setRedoEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const enhancedDispatch = useCallback((action: LayersAction) => {
    if (![LayersActionTypes.SELECT_LAYER].includes(action.type)) {
      setHistoryStack(prevStack => [...prevStack, deepCopy(stateRef.current)]);
      setRedoStack([]);
      setHistoryEntries(prev => [
        ...prev,
        {
          action: action.type,
          id: generateId(),
          description: getActionDescription(action),
          timestamp: new Date().getMilliseconds(),
        },
      ]);
      setRedoEntries([]);
    }
    dispatch(action);
  }, []);

  const undo = useCallback(() => {
    if (historyStack.length > 0) {
      const previousState = historyStack[historyStack.length - 1];
      setHistoryStack(prevStack => prevStack.slice(0, -1));
      setRedoStack(prevStack => [deepCopy(state), ...prevStack]);
      const historyLastEntry = historyEntries[historyEntries.length - 1];
      setHistoryEntries(prev => prev.slice(0, -1));
      setRedoEntries(prev => [historyLastEntry, ...prev]);
      dispatch({ type: LayersActionTypes.SET_STATE, payload: previousState });
    }
  }, [historyEntries, historyStack, state]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      const redoFirstEntry = redoEntries[0];
      setRedoStack(prevStack => prevStack.slice(1));
      setRedoEntries(prev => prev.slice(1));
      setHistoryStack(prevStack => [...prevStack, state]);
      setHistoryEntries(prev => [...prev, redoFirstEntry]);
      dispatch({ type: LayersActionTypes.SET_STATE, payload: nextState });
    }
  }, [redoEntries, redoStack, state]);

  const reset = useCallback(() => {
    setHistoryStack([]);
    setRedoStack([]);
    setHistoryEntries([]);
    setRedoEntries([]);
    dispatch({ type: LayersActionTypes.RESET });
  }, []);

  return (
    <LayersContext.Provider
      value={{
        state,
        dispatch: enhancedDispatch,
        undo,
        redo,
        canUndo: historyStack.length > 0,
        canRedo: redoStack.length > 0,
        reset,
        historyEntries,
        redoEntries,
      }}
    >
      {children}
    </LayersContext.Provider>
  );
};
