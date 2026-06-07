import { drawRectangle } from "@images/lib/layers/render";
import { UseDrawObject } from "@images/types/draw-types";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { RectangleObject } from "@images/types/layer-types";
import { getRectangleObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame, getRectTopLeftAndSize } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import useIsKeyPressed from "../common/use-is-key-pressed";
import useRectangleParams from "../params/use-rectangle-params";

interface UseRectangleProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: RectangleObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawRectangle = ({
  canvasRef,
  onNewObject,
  layerFrame,
  grid,
  isSnapEnabled = false,
}: UseRectangleProps): UseDrawObject => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startingPoint, setStartingPoint] = useState<Point>();
  const [endpoint, setEndpoint] = useState<Point>();
  const isShiftPressed = useIsKeyPressed("Shift");
  const [frame, setFrame] = useState<Rect>();
  const params = useRectangleParams();
  const [id, setId] = useState<string>(generateId());

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(() => getRectangleObject(frame, params, id), [params, frame, id]);

  useEffect(() => {
    if (!isDrawing || !startingPoint || !endpoint) return;
    const isSquare = params.isSquare || isShiftPressed;
    const rect = getRectTopLeftAndSize(startingPoint, endpoint, isSquare);
    setFrame(rect);
  }, [endpoint, isDrawing, isShiftPressed, params.isSquare, startingPoint]);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    drawRectangle(object, context);
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
      if (!p) return;
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
      if (object) onNewObject?.(object);
      setFrame(undefined);
      setStartingPoint(undefined);
      setEndpoint(undefined);
      setIsDrawing(false);
      draw();
    },
    [draw, grid, isDrawing, isSnapEnabled, layerFrame, object, onNewObject]
  );

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
      const p = getTouchPoint(event);
      setEndpoint(p);
    },
    [isDrawing, getTouchPoint]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const p = getTouchPoint(event);
      setEndpoint(p);
      if (object) onNewObject?.(object);
      setFrame(undefined);
      setStartingPoint(undefined);
      setEndpoint(undefined);
      setIsDrawing(false);
      draw();
    },
    [draw, isDrawing, object, onNewObject, getTouchPoint]
  );

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

export default useDrawRectangle;
