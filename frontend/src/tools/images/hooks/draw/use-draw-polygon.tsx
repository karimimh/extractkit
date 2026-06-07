import { drawPath } from "@images/lib/layers/render";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { PathObject } from "@images/types/layer-types";
import { getPolygonObject } from "@images/utils/draw-utils";
import { calculateEncircledPolygonPoints } from "@images/utils/geometry-utils";
import { getPointerPositionInFrame } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import usePolygonParams from "../params/use-polygon-params";

interface UsePolygonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: PathObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawPolygon = ({
  canvasRef,
  onNewObject,
  layerFrame,
  isSnapEnabled = false,
  grid,
}: UsePolygonProps) => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const params = usePolygonParams();
  const [previewPoint, setPreviewPoint] = useState<Point>();
  const [linePoints, setLinePoints] = useState<Point[]>([]);
  const [id, setId] = useState<string>(generateId());
  const bounds = useRef<Rect | undefined>();

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(
    () => getPolygonObject(linePoints[0], previewPoint, bounds.current, params, id),
    [linePoints, previewPoint, params, id]
  );

  const endPath = useCallback(
    (points: Point[]) => {
      if (!isDrawing || points.length < 2 || !object) return;
      setIsDrawing(false);
      setPreviewPoint?.(undefined);
      const obj = getPolygonObject(
        points[0],
        points[points.length - 1],
        bounds.current,
        params,
        id
      );
      if (!obj) return;
      onNewObject?.(obj);
      setLinePoints([]);
      bounds.current = undefined;
      setPreviewPoint(undefined);
    },
    [id, isDrawing, object, onNewObject, params]
  );

  const isNearStartPoint = useCallback(
    (point: Point): boolean => {
      if (linePoints.length === 0) return false;
      const startPoint = linePoints[0];
      const distance = Math.sqrt(
        Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
      );
      return distance < 10; // TODO: Adjust threshold as needed
    },
    [linePoints]
  );

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    if (isDrawing && linePoints.length > 0 && previewPoint) {
      const polygonPoints = calculateEncircledPolygonPoints(
        params.numberOfSides,
        linePoints[0],
        previewPoint
      );
      drawPath({ ...object, points: polygonPoints, closed: true }, context);
    } else {
      drawPath(object, context);
    }
  }, [canvasRef, isDrawing, linePoints, object, params.numberOfSides, previewPoint]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDrawing) return;
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (!p) return;
      setLinePoints([p]);
      bounds.current = { x: p.x, y: p.y, width: 0, height: 0 };
      setIsDrawing(true);
    },
    [layerFrame, isSnapEnabled, grid, isDrawing]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || linePoints.length === 0) return;
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (!p) return;
      const lastPoint = linePoints[linePoints.length - 1];
      const threshold = 10;

      if (Math.abs(p.x - lastPoint.x) < threshold) {
        p.x = lastPoint.x;
      } else if (Math.abs(p.y - lastPoint.y) < threshold) {
        p.y = lastPoint.y;
      }
      setPreviewPoint?.(p);
      const polygonPoints = calculateEncircledPolygonPoints(params.numberOfSides, linePoints[0], p);
      bounds.current = undefined;
      for (const pt of polygonPoints) {
        recomputeBounds(pt);
      }
    },
    [isDrawing, linePoints, layerFrame, isSnapEnabled, grid, params.numberOfSides]
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (!p) return;
      if (isNearStartPoint(p)) {
        endPath([...linePoints, linePoints[0]]);
      } else if (linePoints.length === 1) {
        endPath([...linePoints, p]);
      } else {
        setLinePoints(prevPoints => [...prevPoints, p]);
        const polygonPoints = calculateEncircledPolygonPoints(
          params.numberOfSides,
          linePoints[0],
          p
        );
        bounds.current = undefined;
        for (const pt of polygonPoints) {
          recomputeBounds(pt);
        }
      }
      setIsDrawing(false);
      setPreviewPoint(undefined);
      draw();
    },
    [
      isDrawing,
      layerFrame,
      isSnapEnabled,
      grid,
      isNearStartPoint,
      linePoints,
      draw,
      endPath,
      params.numberOfSides,
    ]
  );

  // --- Touch event handlers for mobile support ---
  const getTouchPoint = useCallback(
    (touchEvent: React.TouchEvent<HTMLCanvasElement>): Point => {
      return (
        getPointerPositionInFrame(touchEvent, touchEvent.target as HTMLElement, layerFrame) || {
          x: 0,
          y: 0,
        }
      );
    },
    [layerFrame]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) {
        const p = getTouchPoint(event);
        setLinePoints([p]);
        bounds.current = { x: p.x, y: p.y, width: 0, height: 0 };
        setIsDrawing(true);
      }
    },
    [isDrawing, getTouchPoint]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || linePoints.length === 0) return;
      const p = getTouchPoint(event);
      setPreviewPoint(p);
      const polygonPoints = calculateEncircledPolygonPoints(params.numberOfSides, linePoints[0], p);
      bounds.current = undefined;
      for (const pt of polygonPoints) {
        recomputeBounds(pt);
      }
    },
    [isDrawing, linePoints, getTouchPoint, params.numberOfSides]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const pt = getTouchPoint(event);
      if (isNearStartPoint(pt)) {
        endPath([...linePoints, linePoints[0]]);
      } else if (linePoints.length === 1) {
        endPath([...linePoints, pt]);
      } else {
        setLinePoints(prevPoints => [...prevPoints, pt]);
        const polygonPoints = calculateEncircledPolygonPoints(
          params.numberOfSides,
          linePoints[0],
          pt
        );
        bounds.current = undefined;
        for (const p of polygonPoints) {
          recomputeBounds(p);
        }
      }
      setIsDrawing(false);
      setPreviewPoint(undefined);
      draw();
    },
    [isDrawing, getTouchPoint, isNearStartPoint, linePoints, draw, endPath, params.numberOfSides]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        endPath(linePoints);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [endPath, linePoints]);

  function recomputeBounds(p: Point) {
    if (!bounds.current) {
      bounds.current = { x: p.x, y: p.y, width: 0, height: 0 };
    } else {
      const minX = Math.min(bounds.current.x, p.x);
      const minY = Math.min(bounds.current.y, p.y);
      const maxX = Math.max(bounds.current.x + bounds.current.width, p.x);
      const maxY = Math.max(bounds.current.y + bounds.current.height, p.y);
      bounds.current = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    draw,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export default useDrawPolygon;
