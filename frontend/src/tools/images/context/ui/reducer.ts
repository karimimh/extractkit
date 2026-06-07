import { Action, UIState, initialState } from "../../types/ui-context-types";

export function uiReducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case "SET_IS_SNAP_ENABLED":
      return { ...state, isSnapEnabled: action.payload };
    case "TOGGLE_SNAP":
      return { ...state, isSnapEnabled: !state.isSnapEnabled };
    case "SET_SIDEBAR_OPEN":
      return { ...state, isSidebarOpen: action.payload };
    case "TOGGLE_SIDEBAR_PINNED":
      return { ...state, isSidebarPinned: !state.isSidebarPinned };
    case "SET_SIDEBAR_PINNED":
      return { ...state, isSidebarPinned: action.payload };
    case "SET_CURRENT_MENU":
      return { ...state, currentMenu: action.payload };
    case "TOGGLE_IS_PROCESSING_IMAGE":
      return { ...state, isProcessingImage: !state.isProcessingImage };
    case "SET_DIFF_BUTTON_PRESSED":
      return { ...state, isDiffButtonPressed: action.payload };
    case "SET_IS_PROCESSING_IMAGE":
      return { ...state, isProcessingImage: action.payload };
    case "SET_LAYER_FRAME":
      return {
        ...state,
        layerFrame: action.payload,
      };
    case "SET_SELECTED_TOOL":
      return {
        ...state,
        selectedTool: action.payload,
      };
    case "SET_SELECTED_MENU":
      return {
        ...state,
        selectedMenu: action.payload,
      };
    case "SET_SELECTION_TYPE":
      return {
        ...state,
        selectionType: action.payload,
      };
    case "SET_IS_EDITING_OBJECT":
      return {
        ...state,
        isEditingObject: action.payload,
      };
    case "SET_SIDEBAR_OBJECT":
      return {
        ...state,
        sidebarLayerId: action.payload.layerId,
        sidebarObjectId: action.payload.objectId,
      };
    case "SET_GRID":
      return {
        ...state,
        grid: action.payload,
      };
    case "RESET_UI":
      return initialState;
    default:
      return state;
  }
}
