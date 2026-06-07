import React, { useContext, useMemo } from "react";
import { HistoryEntry, LayersAction, LayersState } from "../../types/layers-context-types";
import { LayersActions, layersActions } from "./actions";
import { LayersContext } from "./layers-context";

export const useLayersContext = (): LayersState &
  LayersActions & {
    dispatch: React.Dispatch<LayersAction>;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    reset: () => void;
    history: HistoryEntry[];
  } => {
  const context = useContext(LayersContext);
  if (!context) {
    throw new Error("useLayersContext must be used within a ProjectProvider");
  }
  const { canRedo, canUndo, dispatch, redo, reset, state, undo, historyEntries } = context;
  // TODO: check if this causes a re-render on every state change
  const actions = useMemo(() => layersActions(dispatch), [dispatch]);
  return {
    ...state,
    ...actions,
    dispatch,
    canRedo,
    canUndo,
    redo,
    reset,
    undo,
    history: historyEntries,
  };
};
