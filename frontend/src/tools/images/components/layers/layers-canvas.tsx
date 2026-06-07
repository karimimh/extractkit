import { useLayersContext } from "@images/context/layers/use-layers-context";
import { applyAdjustment } from "@images/lib/adjustments/adjustments";
import { applyColorization } from "@images/lib/colorizations/colorizations";
import { applyEnhancement } from "@images/lib/enhacements/enhancements";
import { applyFilter } from "@images/lib/filters/filters";
import { drawObject } from "@images/lib/layers/render";
import { Rect } from "@images/types/geometry-types";
import { memo, useCallback, useEffect, useRef } from "react";

interface LayersCanvasProps {
  layerFrame: Rect;
}

const LayersCanvas = memo(({ layerFrame }: LayersCanvasProps) => {
  const { layerOrders, layers } = useLayersContext();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const layerId of layerOrders) {
      const layer = layers[layerId];
      if (layer.hidden) continue;
      const objectOrders = layer.objectOrders;
      if (!objectOrders) continue;
      if (layer.type === "content") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object || object.hidden) continue;
          await drawObject(object, context, canvas.width, canvas.height);
        }
      } else if (layer.type === "adjustment") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyAdjustment(object, context, canvas.width, canvas.height);
        }
      } else if (layer.type === "colorization") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyColorization(object, context, canvas.width, canvas.height);
        }
      } else if (layer.type === "filter") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyFilter(object, context, canvas.width, canvas.height);
        }
      } else if (layer.type === "enhancement") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyEnhancement(object, context, canvas.width, canvas.height);
        }
      }
      // Note: colorization layers use complex cv-point-ops functions
      // and are not yet supported in this canvas renderer
    }
  }, [layerOrders, layers]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className="absolute top-0 left-0 w-full h-full"
      ref={canvasRef}
      width={layerFrame.width}
      height={layerFrame.height}
    />
  );
});

LayersCanvas.displayName = "LayersCanvas";

export default LayersCanvas;
