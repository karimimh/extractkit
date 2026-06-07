import { Rect } from "@images/types/geometry-types";
import { SelectionType } from "@images/types/selection-types";
import { TOOLS } from "@images/constants/tool-constants";
import { MenuType, Tool } from "@images/types/tool-types";

export interface UIState {
  isSidebarOpen: boolean;
  isSidebarPinned: boolean;
  currentMenu?: MenuType;
  isProcessingImage: boolean;
  layerFrame?: Rect;
  tools: Record<MenuType, Tool[]>;
  selectedMenu?: MenuType;
  selectedTool?: Tool;
  selectionType?: SelectionType;
  isSnapEnabled: boolean;
  isDiffButtonPressed: boolean;
  isEditingObject: boolean;
  sidebarObjectId?: string;
  sidebarLayerId?: string;
  grid: {
    rows: number;
    columns: number;
    status: "always-show" | "show-when-drawing" | "hide";
  };
}

let uiStateStorage: string | null = null;
if (typeof window !== "undefined") {
  uiStateStorage = localStorage.getItem("uiState");
}
const uiState: UIState | undefined = uiStateStorage ? JSON.parse(uiStateStorage) : undefined;
const initialTools: Record<MenuType, Tool[]> = uiState ? uiState.tools : TOOLS;

export const initialState: UIState = {
  isSidebarOpen: false,
  isSidebarPinned: false,
  isProcessingImage: false,
  isSnapEnabled: false,
  tools: initialTools,
  selectedTool: undefined,
  isDiffButtonPressed: false,
  selectionType: undefined,
  isEditingObject: false,
  grid: {
    rows: 10,
    columns: 10,
    status: "show-when-drawing",
  },
};

export type Action =
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean }
  | { type: "TOGGLE_SIDEBAR_PINNED" }
  | { type: "SET_SIDEBAR_PINNED"; payload: boolean }
  | { type: "SET_IS_SNAP_ENABLED"; payload: boolean }
  | { type: "TOGGLE_SNAP" }
  | { type: "SET_CURRENT_MENU"; payload: MenuType | undefined }
  | { type: "SET_SELECTION_TYPE"; payload: SelectionType | undefined }
  | { type: "TOGGLE_IS_PROCESSING_IMAGE" }
  | { type: "SET_IS_PROCESSING_IMAGE"; payload: boolean }
  | { type: "SET_DIFF_BUTTON_PRESSED"; payload: boolean }
  | { type: "RESET_UI" }
  | { type: "SET_LAYER_FRAME"; payload: Rect | undefined }
  | { type: "RESET" }
  | { type: "SET_SELECTED_TOOL"; payload: Tool | undefined }
  | { type: "SET_SELECTED_MENU"; payload: MenuType | undefined }
  | { type: "SET_TOOLS"; payload: Record<MenuType, Tool[]> }
  | { type: "SET_IS_EDITING_OBJECT"; payload: boolean }
  | {
      type: "SET_SIDEBAR_OBJECT";
      payload: { layerId?: string; objectId?: string };
    }
  | { type: "SET_GRID"; payload: UIState["grid"] };
