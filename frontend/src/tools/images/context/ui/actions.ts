import { Rect } from "@images/types/geometry-types";
import { SelectionType } from "@images/types/selection-types";
import { MenuType, Tool } from "@images/types/tool-types";
import { UIState } from "@images/types/ui-context-types";
import { useUIContext } from "./use-ui-context";

export const useUIActions = () => {
  const { dispatch } = useUIContext();

  const toggleSnap = () => {
    dispatch({ type: "TOGGLE_SNAP" });
  };

  const setIsSnapEnabled = (isSnapEnabled: boolean) => {
    dispatch({ type: "SET_IS_SNAP_ENABLED", payload: isSnapEnabled });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const setSidebarOpen = (isOpen: boolean) => {
    dispatch({ type: "SET_SIDEBAR_OPEN", payload: isOpen });
  };

  const setCurrentMenu = (menu?: MenuType) => {
    dispatch({ type: "SET_CURRENT_MENU", payload: menu });
  };

  const toggleIsProcessingImage = () => {
    dispatch({ type: "TOGGLE_IS_PROCESSING_IMAGE" });
  };

  const setIsProcessingImage = (isProcessing: boolean) => {
    dispatch({ type: "SET_IS_PROCESSING_IMAGE", payload: isProcessing });
  };

  const setDiffButtonPressed = (isPressed: boolean) => {
    dispatch({ type: "SET_DIFF_BUTTON_PRESSED", payload: isPressed });
  };

  const setLayerFrame = (frame: Rect | undefined) => {
    dispatch({
      type: "SET_LAYER_FRAME",
      payload: frame,
    });
  };

  const setSelectedTool = (tool?: Tool) => {
    dispatch({ type: "SET_SELECTED_TOOL", payload: tool });
  };

  const setSelectedMenu = (menu?: MenuType) => {
    dispatch({ type: "SET_SELECTED_MENU", payload: menu });
  };

  const setSelectionType = (selectionType?: SelectionType) => {
    dispatch({ type: "SET_SELECTION_TYPE", payload: selectionType });
  };

  const setEditingObject = (isEditingObject: boolean) => {
    dispatch({ type: "SET_IS_EDITING_OBJECT", payload: isEditingObject });
  };

  const setGrid = (grid: UIState["grid"]) => {
    dispatch({ type: "SET_GRID", payload: grid });
  };

  const resetUI = () => {
    dispatch({ type: "RESET_UI" });
  };

  const setSidebarObject = (layerId?: string, objectId?: string) => {
    dispatch({ type: "SET_SIDEBAR_OBJECT", payload: { layerId, objectId } });
  };

  const toggleSidebarPinned = () => {
    dispatch({ type: "TOGGLE_SIDEBAR_PINNED" });
  };

  const setSidebarPinned = (isPinned: boolean) => {
    dispatch({ type: "SET_SIDEBAR_PINNED", payload: isPinned });
  };

  return {
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarPinned,
    setSidebarPinned,
    toggleSnap,
    setIsSnapEnabled,
    setCurrentMenu,
    toggleIsProcessingImage,
    setDiffButtonPressed,
    setIsProcessingImage,
    setLayerFrame,
    setSelectedTool,
    setSelectedMenu,
    setSelectionType,
    setEditingObject,
    setSidebarObject,
    setGrid,
    resetUI,
  };
};
