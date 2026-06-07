import { drawHighlighterObject } from "@images/lib/layers/render";
import { UseDrawObject } from "@images/types/draw-types";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { HighlighterObject, HighlighterParticle } from "@images/types/layer-types";
import { getHighlighterObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { interpolatePoints } from "../../lib/draw/interpolation";
import useHighlighterParams from "../params/use-highlighter-params";

interface UseHighlighterProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: HighlighterObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawHighlighter = ({
  canvasRef,
  onNewObject,
  layerFrame,
  isSnapEnabled = false,
  grid,
}: UseHighlighterProps): UseDrawObject => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [particles, setParticles] = useState<HighlighterParticle[]>([]);
  const params = useHighlighterParams();
  const [id, setId] = useState<string>(generateId());
  const bounds = useRef<Rect | undefined>();

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(
    () => getHighlighterObject(particles, bounds.current, id),
    [particles, id]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const p = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (!p) return;
      setParticles([
        {
          center: p,
          color: params.color,
          type: "highlighter",
          size: params.size,
          time: performance.now(),
        },
      ]);
      bounds.current = { x: p.x, y: p.y, width: 0, height: 0 };
      setIsDrawing(true);
    },
    [params.color, params.size, layerFrame, isSnapEnabled, grid]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const pt = getPointerPositionInFrame(
        event,
        event.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (!pt) return;

      setParticles(prev => {
        const previousCenter = prev[prev.length - 1].center;
        const dx = previousCenter.x - pt.x;
        const dy = previousCenter.y - pt.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = performance.now() - prev[prev.length - 1].time;

        const speed = distance / timeDiff; // pixels per millisecond
        const N = Math.max(1, Math.min(10, Math.floor(20 / speed))); // adjust as needed
        const interpolatedPoints = interpolatePoints([previousCenter, pt], N);
        const generatedParticles: HighlighterParticle[] = interpolatedPoints.map(
          p =>
            ({
              center: p,
              color: params.color,
              type: "highlighter",
              size: params.size,
              time: performance.now(),
            }) as HighlighterParticle
        );
        return [...prev, ...generatedParticles];
      });
      recomputeBounds(pt);
    },
    [isDrawing, layerFrame, isSnapEnabled, grid, params.color, params.size]
  );

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    drawHighlighterObject({ ...object, particles }, context);
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
      const pt = getTouchPoint(event);
      if (!pt) return;
      setParticles([
        {
          center: pt,
          color: params.color,
          type: "highlighter",
          size: params.size,
          time: performance.now(),
        },
      ]);
      setIsDrawing(true);
      recomputeBounds(pt);
    },
    [getTouchPoint, params.color, params.size]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      setParticles(prev => {
        const previousCenter = prev[prev.length - 1].center;
        const pt = getTouchPoint(event);
        recomputeBounds(pt);
        const dx = previousCenter.x - pt.x;
        const dy = previousCenter.y - pt.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = performance.now() - prev[prev.length - 1].time;
        const speed = distance / timeDiff;
        const N = Math.max(1, Math.min(10, Math.floor(20 / speed)));
        const interpolatedPoints = interpolatePoints([previousCenter, pt], N);
        const generatedParticles: HighlighterParticle[] = interpolatedPoints.map(p => ({
          center: p,
          color: params.color,
          type: "highlighter",
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
  // --- End touch event handlers ---

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

export default useDrawHighlighter;
