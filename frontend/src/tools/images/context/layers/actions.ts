import { Layer, LayerObject } from "@images/types/layer-types";
import { LayersAction, LayersActionTypes } from "../../types/layers-context-types";

export const layersActions = (dispatch: React.Dispatch<LayersAction>) => {
  const addLayer = (layer: Layer) => {
    dispatch({ type: LayersActionTypes.ADD_LAYER, payload: layer });
  };

  const modifyLayer = (layer: Layer) => {
    dispatch({ type: LayersActionTypes.MODIFY_LAYER, payload: layer });
  };

  const modifyObject = (layerId: string, object: LayerObject) => {
    dispatch({
      type: LayersActionTypes.MODIFY_OBJECT,
      payload: { layerId, object },
    });
  };

  const renameLayer = (name: string, id: string) => {
    dispatch({ type: LayersActionTypes.RENAME_LAYER, payload: { name, id } });
  };

  const deleteLayer = (id: string) => {
    dispatch({ type: LayersActionTypes.DELETE_LAYER, payload: id });
  };

  const swapLayers = (srcLayerId: string, destLayerId: string) => {
    dispatch({
      type: LayersActionTypes.SWAP_LAYERS,
      payload: { srcLayerId, destLayerId },
    });
  };

  const selectLayer = (id: string) => {
    dispatch({ type: LayersActionTypes.SELECT_LAYER, payload: id });
  };

  return {
    addLayer,
    renameLayer,
    deleteLayer,
    swapLayers,
    selectLayer,
    modifyLayer,
    modifyObject,
  };
};

export type LayersActions = ReturnType<typeof layersActions>;
