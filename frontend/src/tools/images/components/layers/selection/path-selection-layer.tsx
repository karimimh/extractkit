
import useDrawPath from "@images/hooks/draw/use-draw-path";
import { drawPath } from "@images/lib/layers/render";
import { Point, Rect } from "@images/types/geometry-types";
import { PathObject } from "@images/types/layer-types";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PathSelectionLayerProps {
  layerFrame: Rect;
}

const PathSelectionLayer = ({ layerFrame }: PathSelectionLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point>();

  const object: PathObject | undefined = useMemo(() => {
    if (points.length === 0) return;
    return {
      type: "path",
      id: generateId(),
      points,
      lineColor: "blue",
      lineWidth: 2,
      closed: true,
      isSelection: true,
      lineDash: [5, 5],
    } as PathObject;
  }, [points]);

  const { handleMouseDown, handleMouseMove, isDrawing } = useDrawPath({
    canvasRef,
    layerFrame,
    points,
    isContinuous: true,
    onPointsChange: setPoints,
    setPreviewPoint,
  });

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas || !object) return;
    const { width, height } = layerFrame;
    canvas.width = width;
    canvas.height = height;

    if (isDrawing && points.length > 0 && previewPoint) {
      const path = [...points, previewPoint];
      drawPath({ ...object, points: path }, context);
    } else {
      drawPath(object, context);
    }
  }, [isDrawing, layerFrame, object, points, previewPoint]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className="absolute top-0 left-0 w-full h-full"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{
        cursor: "crosshair",
      }}
    />
  );
};

export default PathSelectionLayer;
