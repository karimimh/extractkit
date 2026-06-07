import useDrawFreeform from "@images/hooks/draw/use-draw-freeform";
import { drawFreeform } from "@images/lib/layers/render";
import { Point, Rect } from "@images/types/geometry-types";
import { FreeformObject } from "@images/types/layer-types";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface FreeformSelectionLayerProps {
  layerFrame: Rect;
}

const FreeformSelectionLayer = ({
  layerFrame,
}: FreeformSelectionLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);

  const object: FreeformObject | undefined = useMemo(() => {
    if (points.length === 0) return;
    return {
      type: "freeform",
      id: generateId(),
      points,
      lineColor: "blue",
      lineWidth: 2,
      lineDash: [5, 5],
      bgColor: "transparent",
      isSelection: true,
    } as FreeformObject;
  }, [points]);

  const { handleMouseDown, handleMouseMove, handleMouseUp, isDrawing } =
    useDrawFreeform({
      layerFrame,
      canvasRef,
      points,
      setPoints,
    });

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!context || !canvas || !object) return;
    const { width, height } = layerFrame;
    canvas.width = width;
    canvas.height = height;

    if (isDrawing && points.length > 0) {
      const path = [...points];
      drawFreeform({ ...object, points: path }, context);
    } else {
      drawFreeform(object, context);
    }
  }, [object, layerFrame, isDrawing, points]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className="absolute top-0 left-0 w-full h-full"
      ref={canvasRef}
      width={layerFrame.width}
      height={layerFrame.height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ pointerEvents: "auto", cursor: "crosshair" }}
    />
  );
};

export default FreeformSelectionLayer;
