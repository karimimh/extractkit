import { drawPenObject } from "@images/lib/layers/render";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { PenObject, PenParticle } from "@images/types/layer-types";
import { getPenObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { interpolatePoints } from "../../lib/draw/interpolation";
import usePenParams from "../params/use-pen-params";
import { UseDrawObject } from "@images/types/draw-types";

interface UsePenProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: PenObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawPen = ({
  canvasRef,
  onNewObject,
  layerFrame,
  isSnapEnabled = false,
  grid,
}: UsePenProps): UseDrawObject => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [particles, setParticles] = useState<PenParticle[]>([]);
  const params = usePenParams();
  const [id, setId] = useState<string>(generateId());
  const bounds = useRef<Rect | undefined>();

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(() => getPenObject(particles, bounds.current, id), [particles, id]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const p = getPointerPositionInFrame(event, event.target as HTMLElement, layerFrame);
      if (!p) return;
      setParticles([
        {
          center: p,
          color: params.color,
          type: "pen",
          size: params.size,
          time: performance.now(),
        },
      ]);
      bounds.current = { x: p.x, y: p.y, width: 0, height: 0 };
      setIsDrawing(true);
    },
    [layerFrame, params.color, params.size]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const p = getPointerPositionInFrame(event, event.target as HTMLElement, layerFrame);
      if (!p) return;

      setParticles(prev => {
        const previousCenter = prev[prev.length - 1].center;
        const dx = previousCenter.x - p.x;
        const dy = previousCenter.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = performance.now() - prev[prev.length - 1].time;

        const speed = distance / timeDiff; // pixels per millisecond
        const N = Math.max(1, Math.min(10, Math.floor(20 / speed))); // adjust as needed
        const interpolatedPoints = interpolatePoints([previousCenter, p], N);
        const generatedParticles: PenParticle[] = interpolatedPoints.map(
          p =>
            ({
              center: p,
              color: params.color,
              type: "pen",
              size: params.size,
              time: performance.now(),
            }) as PenParticle
        );
        return [...prev, ...generatedParticles];
      });
      recomputeBounds(p);
    },
    [isDrawing, layerFrame, params.color, params.size]
  );

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    drawPenObject({ ...object, particles }, context);
  }, [canvasRef, object, particles]);

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
      const p = getTouchPoint(event);
      setParticles([
        {
          center: p,
          color: params.color,
          type: "pen",
          size: params.size,
          time: performance.now(),
        },
      ]);
      setIsDrawing(true);
      recomputeBounds(p);
    },
    [isDrawing, getTouchPoint, params.color, params.size]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      setParticles(prev => {
        const previousCenter = prev[prev.length - 1].center;
        const p = getTouchPoint(event);
        recomputeBounds(p);
        const dx = previousCenter.x - p.x;
        const dy = previousCenter.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = performance.now() - prev[prev.length - 1].time;
        const speed = distance / timeDiff;
        const N = Math.max(1, Math.min(10, Math.floor(20 / speed)));
        const interpolatedPoints = interpolatePoints([previousCenter, p], N);
        const generatedParticles: PenParticle[] = interpolatedPoints.map(p => ({
          center: p,
          color: params.color,
          type: "pen",
          size: params.size,
          time: performance.now(),
        }));
        return [...prev, ...generatedParticles];
      });
    },
    [isDrawing, getTouchPoint, params.color, params.size]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (particles.length === 0) return;
    if (!object) return;
    onNewObject?.({ ...object, particles });
    setParticles([]);
    bounds.current = undefined;
    draw();
  }, [draw, isDrawing, object, onNewObject, particles]);

  // --- End touch event handlers ---

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (particles.length === 0) return;
    if (!object) return;
    onNewObject?.({ ...object, particles });
    setParticles([]);
    bounds.current = undefined;
    draw();
  }, [draw, isDrawing, object, onNewObject, particles]);

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

export default useDrawPen;
