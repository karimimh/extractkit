import { drawArc } from "@images/lib/layers/render";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { ArcObject } from "@images/types/layer-types";
import { getArcObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useArcParams from "../params/use-arc-params";

interface UseArcProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: ArcObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawArc = ({
  canvasRef,
  onNewObject,
  layerFrame,
  isSnapEnabled = false,
  grid,
}: UseArcProps) => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const params = useArcParams();
  const [points, setPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point>();
  const [id, setId] = useState<string>(generateId());
  const bounds = useRef<Rect | undefined>();

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(
    () => getArcObject(points, bounds.current, params, id),
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
      } else if (
        (points.length === 2 && params.arcType === "quadratic") ||
        (points.length === 3 && params.arcType === "bezier")
      ) {
        endPath([...points, p]);
      } else {
        setPoints(prevPoints => [...prevPoints, p]);
        recomputeBounds(p);
      }
    },
    [endPath, grid, isDrawing, isSnapEnabled, layerFrame, params.arcType, points]
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
      setPreviewPoint?.(p);
      recomputeBounds(p);
    },
    [grid, isDrawing, isSnapEnabled, layerFrame, points.length]
  );

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    if (isDrawing && points.length > 0 && previewPoint) {
      const path = [...points, previewPoint];
      drawArc({ ...object, points: path }, context);
    } else {
      drawArc(object, context);
    }
  }, [canvasRef, isDrawing, object, points, previewPoint]);

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
    handleClick,
    handleMouseMove,
    draw,
  };
};

export default useDrawArc;
