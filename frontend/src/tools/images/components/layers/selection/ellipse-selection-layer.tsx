import useDrawEllipse from "@images/hooks/draw/use-draw-ellipse";
import { drawEllipse } from "@images/lib/layers/render";
import { Point, Rect, Size } from "@images/types/geometry-types";
import { EllipseObject } from "@images/types/layer-types";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface EllipseSelectionLayerProps {
  layerFrame: Rect;
}

const EllipseSelectionLayer = ({ layerFrame }: EllipseSelectionLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [center, setCenter] = useState<Point>();
  const [size, setSize] = useState<Size>();

  const object: EllipseObject | undefined = useMemo(() => {
    if (!center || !size) return;
    return {
      type: "ellipse",
      id: generateId(),
      center,
      radiusX: size.width,
      radiusY: size.height,
      frame: {
        x: center.x - size.width,
        y: center.y - size.height,
        width: size.width * 2,
        height: size.height * 2,
      },
      lineWidth: 1,
      lineColor: "dashed",
      isSelection: true,
      lineDash: [5, 5],
    } as EllipseObject;
  }, [center, size]);

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawEllipse({
    layerFrame,
    canvasRef,
    drawMethod: "Corner",
    onChange: (center, size) => {
      setCenter(center);
      setSize(size);
    },
    onDrawEnd: () => {},
  });

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas || !object) return;
    const { width, height } = layerFrame;
    canvas.width = width;
    canvas.height = height;

    drawEllipse(object, context);
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
      style={{
        pointerEvents: "auto",
        cursor: "crosshair",
      }}
    />
  );
};

export default EllipseSelectionLayer;
