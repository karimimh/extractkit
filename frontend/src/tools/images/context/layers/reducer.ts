import { Layer, LayerObject } from "@images/types/layer-types";
import { getNonDuplicateLayerName } from "@images/utils/layer-utils";
import { generateId } from "@images/utils/object-utils";
import {
  LayersAction,
  LayersActionTypes,
  LayersState,
  initialLayersState,
} from "../../types/layers-context-types";

function addLayer(
  state: LayersState,
  action: { type: LayersActionTypes.ADD_LAYER; payload: Layer }
): LayersState {
  const layer = {
    ...action.payload,
    name: getNonDuplicateLayerName(action.payload.name, state.layers),
  };
  return {
    ...state,
    layers: { ...state.layers, [layer.id]: layer },
    layerOrders: [...state.layerOrders, layer.id],
    selectedLayerId: layer.id,
    selectedObjectId: layer.objectOrders
      ? layer.objectOrders[layer.objectOrders.length - 1]
      : undefined,
  };
}

function modifyLayer(
  state: LayersState,
  action: { type: LayersActionTypes.MODIFY_LAYER; payload: Layer }
): LayersState {
  const layer = action.payload;
  if (state.layers[layer.id]) {
    return {
      ...state,
      layers: {
        ...state.layers,
        [layer.id]: layer,
      },
    };
  }
  return state;
}

const modifyObject = (
  state: LayersState,
  action: {
    type: LayersActionTypes.MODIFY_OBJECT;
    payload: { layerId: string; object: LayerObject };
  }
) => {
  const { layerId, object } = action.payload;
  const layer = state.layers[layerId];
  const objects = layer?.objects;
  if (!objects) return state;
  const existingObject = objects[object.id];
  if (!existingObject) return state;
  if (existingObject.category !== object.category) return state;
  return {
    ...state,
    layers: {
      ...state.layers,
      [layerId]: {
        ...layer,
        objects: {
          ...layer.objects,
          [object.id]: object,
        },
      },
    },
  };
};

function renameLayer(
  state: LayersState,
  action: {
    type: LayersActionTypes.RENAME_LAYER;
    payload: { name: string; id: string };
  }
) {
  const { name, id } = action.payload;
  return {
    ...state,
    layers: {
      ...state.layers,
      [id]: {
        ...state.layers[id],
        name: getNonDuplicateLayerName(name, state.layers),
        objects: state.layers[id].objects
          ? Object.values(state.layers[id].objects).map(obj => ({
              ...obj,
              layerName: name,
            }))
          : {},
      },
    },
  };
}

function deleteLayer(
  state: LayersState,
  action: { type: LayersActionTypes.DELETE_LAYER; payload: string }
) {
  const layerIdToDelete = action.payload;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [layerIdToDelete]: _, ...newLayers } = state.layers;
  const newLayerOrders = state.layerOrders.filter(id => id !== layerIdToDelete);

  // Update selectedObjectId if necessary
  // Update selectedLayerId if necessary
  let newSelectedObjectId = state.selectedObjectId;
  let newSelectedLayerId = state.selectedLayerId;

  if (state.selectedLayerId === layerIdToDelete) {
    newSelectedLayerId = undefined;
    newSelectedObjectId = undefined;
  }

  if (newLayerOrders.length > 0) {
    return {
      ...state,
      layers: newLayers,
      layerOrders: newLayerOrders,
      selectedLayerId: newSelectedLayerId,
      selectedObjectId: newSelectedObjectId,
    };
  }

  // If all layers are deleted, reset to initial state
  const emptyLayerId = generateId();
  const emptyLayer: Layer = { name: "layer-1", id: emptyLayerId, type: "content" };
  return {
    ...state,
    layers: { [emptyLayerId]: emptyLayer },
    layerOrders: [emptyLayerId],
    selectedLayerId: emptyLayerId,
    selectedObjectId: undefined,
  };
}

function selectLayer(
  state: LayersState,
  action: { type: LayersActionTypes.SELECT_LAYER; payload: string }
) {
  let newSelectedObjectId = state.selectedObjectId;
  if (state.selectedLayerId !== action.payload) {
    newSelectedObjectId = undefined;
  }
  return {
    ...state,
    selectedLayerId: action.payload,
    selectedObjectId: newSelectedObjectId,
  };
}

function swapLayers(
  state: LayersState,
  action: {
    type: LayersActionTypes.SWAP_LAYERS;
    payload: { srcLayerId: string; destLayerId: string };
  }
) {
  const { srcLayerId, destLayerId } = action.payload;
  const layerOrders = state.layerOrders;
  const srcIndex = layerOrders.indexOf(srcLayerId);
  const destIndex = layerOrders.indexOf(destLayerId);

  const newLayerOrders = [...layerOrders];
  newLayerOrders[srcIndex] = destLayerId;
  newLayerOrders[destIndex] = srcLayerId;

  return {
    ...state,
    layerOrders: newLayerOrders,
  };
}

function setState(
  _state: LayersState,
  action: { type: LayersActionTypes.SET_STATE; payload: LayersState }
) {
  return action.payload;
}

function resetState() {
  return initialLayersState;
}

export default function layersReducer(state: LayersState, action: LayersAction): LayersState {
  switch (action.type) {
    case LayersActionTypes.ADD_LAYER:
      return addLayer(state, action);
    case LayersActionTypes.SELECT_LAYER:
      return selectLayer(state, action);
    case LayersActionTypes.MODIFY_OBJECT:
      return modifyObject(state, action);
    case LayersActionTypes.RENAME_LAYER:
      return renameLayer(state, action);
    case LayersActionTypes.DELETE_LAYER:
      return deleteLayer(state, action);
    case LayersActionTypes.MODIFY_LAYER:
      return modifyLayer(state, action);
    case LayersActionTypes.SWAP_LAYERS:
      return swapLayers(state, action);
    case LayersActionTypes.SET_STATE:
      return setState(state, action);
    case LayersActionTypes.RESET:
      return resetState();
    default:
      return state;
  }
}
