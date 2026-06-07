
import useDrawRectangle from "@images/hooks/draw/use-draw-rectangle";
import { drawRectangle } from "@images/lib/layers/render";
import { Rect } from "@images/types/geometry-types";
import { RectangleObject } from "@images/types/layer-types";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface RectangleSelectionLayerProps {
  layerFrame: Rect;
}

const RectangleSelectionLayer = ({
  layerFrame,
}: RectangleSelectionLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rectangle, setRectangle] = useState<Rect>();

  const object: RectangleObject | undefined = useMemo(() => {
    if (!rectangle) return;
    return {
      type: "rectangle",
      frame: rectangle,
      id: generateId(),
      lineWidth: 1,
      lineColor: "dashed",
      isSelection: true,
      lineDash: [5, 5],
    } as RectangleObject;
  }, [rectangle]);

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawRectangle({
    layerFrame,
    canvasRef,
    onChange: setRectangle,
    onDrawEnd: () => {},
  });

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas || !object) return;
    const { width, height } = layerFrame;
    canvas.width = width;
    canvas.height = height;

    drawRectangle(object, context);
  }, [layerFrame, object]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className="absolute top-0 left-0 w-full h-full"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ pointerEvents: "auto", cursor: "crosshair" }}
    />
  );
};

export default RectangleSelectionLayer;
