import { drawObject } from "@images/lib/layers/render";
import { Layer } from "@images/types/layer-types";

export function getNonDuplicateLayerName(
  layerName: string | undefined,
  allLayers: { [id: string]: Layer }
) {
  const layers = Object.values(allLayers);
  let name = layerName ?? `layer-${layers.length + 1}`;
  let index = layers.findIndex(l => l.name === name);
  while (index >= 0) {
    name = `${name}-(${1})`;
    index = layers.findIndex(l => l.name === name);
  }
  return name;
}

export const renderAllLayers = async (
  canvas: HTMLCanvasElement,
  layers: { [id: string]: Layer },
  layerOrders: string[],
  width: number,
  height: number
) => {
  const context = canvas?.getContext("2d");
  if (!context) return;
  canvas.width = width;
  canvas.height = height;
  for (const layerId of layerOrders) {
    const layer = layers[layerId];
    if (!layer.objectOrders) continue;
    for (const objectId of layer.objectOrders) {
      const object = layer.objects?.[objectId];
      if (!object) continue;
      drawObject(object, context, width, height);
    }
  }
};

export const getLayerObject = (
  layerId: string | undefined,
  objectId: string | undefined,
  layers: {
    [id: string]: Layer;
  }
) => {
  if (!layerId || !objectId) return undefined;
  const layer = layers[layerId];
  if (!layer) return undefined;
  return layer.objects?.[objectId];
};
