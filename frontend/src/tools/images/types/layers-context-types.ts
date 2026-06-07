import { Layer, LayerObject } from "@images/types/layer-types";

export interface LayersState {
  layers: { [id: string]: Layer };
  layerOrders: string[];
  selectedLayerId?: string;
  selectedObjectId?: string;
}

export const initialLayersState: LayersState = {
  layers: {},
  layerOrders: [],
};

export enum LayersActionTypes {
  ADD_LAYER = "ADD_LAYER",
  MODIFY_LAYER = "MODIFY_LAYER",
  MODIFY_OBJECT = "MODIFY_OBJECT",
  SELECT_LAYER = "SELECT_LAYER",
  RENAME_LAYER = "RENAME_LAYER",
  DELETE_LAYER = "DELETE_LAYER",
  SWAP_LAYERS = "SWAP_LAYERS",
  SET_STATE = "SET_STATE",
  RESET = "RESET",
}

export type LayersAction =
  | { type: LayersActionTypes.ADD_LAYER; payload: Layer }
  | { type: LayersActionTypes.MODIFY_LAYER; payload: Layer }
  | { type: LayersActionTypes.MODIFY_OBJECT; payload: { layerId: string; object: LayerObject } }
  | {
      type: LayersActionTypes.RENAME_LAYER;
      payload: { name: string; id: string };
    }
  | { type: LayersActionTypes.DELETE_LAYER; payload: string }
  | { type: LayersActionTypes.SELECT_LAYER; payload: string }
  | {
      type: LayersActionTypes.SWAP_LAYERS;
      payload: { srcLayerId: string; destLayerId: string };
    }
  | { type: LayersActionTypes.SET_STATE; payload: LayersState }
  | { type: LayersActionTypes.RESET };

export interface HistoryEntry {
  id: string;
  action: LayersActionTypes;
  description: string;
  timestamp: number;
}
