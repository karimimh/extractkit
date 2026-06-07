import { drawPath } from "@images/lib/layers/render";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { PathObject } from "@images/types/layer-types";
import { getPathObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import usePathParams from "../params/use-path-params";

interface UsePathProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: PathObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawPath = ({
  canvasRef,
  onNewObject,
  layerFrame,
  grid,
  isSnapEnabled = false,
}: UsePathProps) => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const params = usePathParams();
  const [points, setPoints] = useState<Point[]>([]);
  const bounds = useRef<Rect | undefined>();
  const [previewPoint, setPreviewPoint] = useState<Point>();
  const [id, setId] = useState<string>(generateId());

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(
    () => getPathObject(points, bounds.current, params, id),
    [points, params, id]
  );

  const endPath = useCallback(
    (points: Point[]) => {
      if (!isDrawing || points.length === 0 || !object) return;
      setIsDrawing(false);
      setPreviewPoint?.(undefined);
      onNewObject?.({ ...object, points });
      setPoints([]);
      bounds.current = undefined;
      setPreviewPoint(undefined);
    },
    [isDrawing, object, onNewObject]
  );

  const isNearStartPoint = useCallback(
    (point: Point): boolean => {
      if (points.length === 0) return false;
      const startPoint = points[0];
      const distance = Math.sqrt(
        Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
      );
      return distance < 10; // TODO: Adjust threshold as needed
    },
    [points]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (!p) return;
      if (!isDrawing) {
        setPoints([p]);
        bounds.current = { x: p.x, y: p.y, width: 0, height: 0 };
        setIsDrawing(true);
      } else if (isNearStartPoint(p)) {
        endPath([...points, points[0]]);
      } else if (points.length === 1 && !params.isContinuous) {
        endPath([...points, p]);
      } else {
        setPoints(prevPoints => [...prevPoints, p]);
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
    },
    [
      endPath,
      grid,
      isDrawing,
      isNearStartPoint,
      isSnapEnabled,
      layerFrame,
      params.isContinuous,
      points,
    ]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || points.length === 0) return;
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (!p) return;

      const lastPoint = points[points.length - 1];
      const threshold = 10;

      if (Math.abs(p.x - lastPoint.x) < threshold) {
        p.x = lastPoint.x;
      } else if (Math.abs(p.y - lastPoint.y) < threshold) {
        p.y = lastPoint.y;
      }
      setPreviewPoint?.(p);
    },
    [grid, isDrawing, isSnapEnabled, layerFrame, points]
  );

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    if (isDrawing && points.length > 0 && previewPoint) {
      const path = [...points, previewPoint];
      drawPath({ ...object, points: path }, context);
    } else {
      drawPath(object, context);
    }
  }, [canvasRef, isDrawing, object, points, previewPoint]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        endPath(points);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [endPath, points]);

  return {
    handleClick,
    handleMouseMove,
    draw,
    endPath,
    points,
    isDrawing,
  };
};

export default useDrawPath;
