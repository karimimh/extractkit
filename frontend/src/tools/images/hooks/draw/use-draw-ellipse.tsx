import { drawEllipse } from "@images/lib/layers/render";
import { Grid, Point, Rect, Size } from "@images/types/geometry-types";
import { EllipseObject } from "@images/types/layer-types";
import { getEllipseObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame, getRectTopLeftAndSize } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { parseIntegerPoint, parseIntegerSize } from "@images/utils/ui-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import useIsKeyPressed from "../common/use-is-key-pressed";
import useEllipseParams from "../params/use-ellipse-params";
import { UseDrawObject } from "@images/types/draw-types";

interface UseEllipseProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: EllipseObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawEllipse = ({
  canvasRef,
  onNewObject,
  layerFrame,
  isSnapEnabled = false,
  grid,
}: UseEllipseProps): UseDrawObject => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startingPoint, setStartingPoint] = useState<Point>();
  const [endpoint, setEndpoint] = useState<Point>();
  const [center, setCenter] = useState<Point>();
  const [size, setSize] = useState<Size>();
  const isShiftPressed = useIsKeyPressed("Shift");
  const params = useEllipseParams();
  const [id, setId] = useState<string>(generateId());

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object: EllipseObject | undefined = useMemo(
    () => getEllipseObject(center, size, params, id),
    [center, size, params, id]
  );

  useEffect(() => {
    if (!isDrawing || !startingPoint || !endpoint) return;

    const isCircle = params.isCircle || isShiftPressed;

    const rect = getRectTopLeftAndSize(startingPoint, endpoint, isCircle);

    if (params.drawMethod === "Center") {
      setCenter(parseIntegerPoint({ x: rect.x, y: rect.y }));
      setSize(parseIntegerSize({ width: rect.width, height: rect.height }));
    } else {
      setCenter(
        parseIntegerPoint({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        })
      );
      setSize(parseIntegerSize({ width: rect.width / 2, height: rect.height / 2 }));
    }
  }, [endpoint, isDrawing, isShiftPressed, params.drawMethod, params.isCircle, startingPoint]);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    drawEllipse(object, context);
  }, [canvasRef, object]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDrawing) return;
      setIsDrawing(true);
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      setStartingPoint(p);
      setEndpoint(p);
      draw();
    },
    [isDrawing, layerFrame, isSnapEnabled, grid, draw]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      setEndpoint(p);
    },
    [isDrawing, layerFrame, isSnapEnabled, grid]
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
      setEndpoint(p);
      object && onNewObject?.(object);
      setCenter(undefined);
      setSize(undefined);
      setIsDrawing(false);
      setStartingPoint(undefined);
      setEndpoint(undefined);
      draw();
    },
    [isDrawing, layerFrame, isSnapEnabled, grid, object, onNewObject, draw]
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
      if (isDrawing) return;
      setIsDrawing(true);
      const p = getTouchPoint(event);
      setStartingPoint(p);
      setEndpoint(p);
      draw();
    },
    [isDrawing, getTouchPoint, draw]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      setEndpoint(getTouchPoint(event));
    },
    [isDrawing, getTouchPoint]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      setEndpoint(getTouchPoint(event));
      object && onNewObject?.(object);
      setCenter(undefined);
      setSize(undefined);
      setIsDrawing(false);
      setStartingPoint(undefined);
      setEndpoint(undefined);
      draw();
    },
    [isDrawing, getTouchPoint, object, onNewObject, draw]
  );

  // --- End touch event handlers ---

  return {
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    draw,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export default useDrawEllipse;
