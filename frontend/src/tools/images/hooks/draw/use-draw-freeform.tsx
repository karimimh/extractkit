import { drawFreeform } from "@images/lib/layers/render";
import { UseDrawObject } from "@images/types/draw-types";
import { Point } from "@images/types/geometry-types";
import { FreeformObject } from "@images/types/layer-types";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import useFreeformParams from "../params/use-freeform-params";

interface UseFreeformProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: FreeformObject) => void;
  mousePosition: Point;
}

const useDrawFreeform = ({
  canvasRef,
  onNewObject,
  mousePosition,
}: UseFreeformProps): UseDrawObject => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [points, setPoints] = useState<Point[]>([]);
  const { lineColor, lineWidth, lineDash } = useFreeformParams();

  const object: FreeformObject | undefined = useMemo(() => {
    if (points.length === 0) return;
    return {
      type: "freeform",
      id: generateId(),
      points,
      lineColor,
      lineWidth,
      lineDash,
    };
  }, [lineDash, lineColor, lineWidth, points]);

  const handleMouseDown = useCallback(() => {
    setPoints([mousePosition]);
    setIsDrawing(true);
  }, [mousePosition]);

  const handleMouseMove = useCallback(() => {
    if (!isDrawing) return;

    setPoints(prevPoints => [...prevPoints, mousePosition]);
  }, [isDrawing, mousePosition]);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    if (isDrawing && points.length > 0) {
      const path = [...points];
      drawFreeform({ ...object, points: path }, context);
    } else {
      drawFreeform(object, context);
    }
  }, [canvasRef, object, isDrawing, points]);

  // --- Touch event handlers for mobile support ---
  const getTouchPoint = useCallback(
    (touchEvent: React.TouchEvent<HTMLCanvasElement>): Point => {
      const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
      const canvas = canvasRef.current;
      if (!canvas || !touch) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    },
    [canvasRef]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      setPoints([getTouchPoint(event)]);
      setIsDrawing(true);
    },
    [getTouchPoint]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      if (!isDrawing) return;
      setPoints(prevPoints => [...prevPoints, getTouchPoint(event)]);
    },
    [isDrawing, getTouchPoint]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      setIsDrawing(false);
      if (points.length === 0) return;
      if (!object) return;
      onNewObject?.({ ...object, points });
      draw();
      setPoints([]);
    },
    [draw, object, onNewObject, points]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    if (points.length === 0) return;
    if (!object) return;
    onNewObject?.({ ...object, points });
    draw();
    setPoints([]);
  }, [draw, object, onNewObject, points]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleMouseUp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMouseUp]);

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

export default useDrawFreeform;
