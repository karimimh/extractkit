
import useDrawPath from "@images/hooks/draw/use-draw-path";
import { drawPolygon } from "@images/lib/layers/render";
import { Point, Rect } from "@images/types/geometry-types";
import { PathObject } from "@images/types/layer-types";
import { calculateEncircledPolygonPoints } from "@images/utils/geometry-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PolygonSelectionLayerProps {
  layerFrame: Rect;
}

const PolygonSelectionLayer = ({ layerFrame }: PolygonSelectionLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [linePoints, setLinePoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point>();

  const object: PathObject | undefined = useMemo(() => {
    const canvasFrame = canvasRef.current?.getBoundingClientRect();
    if (linePoints.length === 0 || !canvasFrame || !previewPoint) return;
    const polygonPoints = calculateEncircledPolygonPoints(
      5,
      linePoints[0],
      previewPoint
    );
    return {
      type: "polygon",
      id: generateId(),
      points: polygonPoints,
      lineColor: "blue",
      lineWidth: 2,
      lineDash: [5, 5],
      bgColor: "transparent",
      isSelection: true,
    } as PathObject;
  }, [linePoints, previewPoint]);

  const { handleMouseDown, handleMouseMove } = useDrawPath({
    canvasRef,
    layerFrame,
    isContinuous: false,
    points: linePoints,
    setPreviewPoint,
    onPointsChange: setLinePoints,
    isSnapEnabled: false,
  });

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!context || !canvas || !object) return;
    const { width, height } = layerFrame;
    canvas.width = width;
    canvas.height = height;

    drawPolygon(object, context);
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
      style={{
        cursor: "crosshair",
      }}
    />
  );
};

export default PolygonSelectionLayer;
