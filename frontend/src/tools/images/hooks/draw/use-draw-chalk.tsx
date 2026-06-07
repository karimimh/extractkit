import { generateChalkParticlePoints } from "@images/lib/draw/draw";
import { drawChalkObject } from "@images/lib/layers/render";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { getChalkObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { interpolatePoints } from "../../lib/draw/interpolation";
import { ChalkObject, ChalkParticle } from "../../types/layer-types";
import useChalkParams from "../params/use-chalk-params";
import { UseDrawObject } from "@images/types/draw-types";

interface UseChalkProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: ChalkObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawChalk = ({
  canvasRef,
  onNewObject,
  layerFrame,
  isSnapEnabled = false,
  grid,
}: UseChalkProps): UseDrawObject => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [particles, setParticles] = useState<ChalkParticle[]>([]);
  const params = useChalkParams();
  const [id, setId] = useState<string>(generateId());
  const bounds = useRef<Rect | undefined>();

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(() => getChalkObject(particles, bounds.current, id), [particles, id]);

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
      const particlePoints: Point[] = generateChalkParticlePoints(p, params.size);
      setParticles([
        {
          center: p,
          points: particlePoints,
          alpha: Math.random() * 0.5 + 0.3,
          color: params.color,
          time: performance.now(),
          type: "chalk",
          size: params.size,
        },
      ]);
      bounds.current = { x: p.x, y: p.y, width: 0, height: 0 };
      setIsDrawing(true);
    },
    [grid, isSnapEnabled, layerFrame, params.color, params.size]
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
      setParticles(prev => {
        const previousCenter = prev[prev.length - 1].center;
        const dx = previousCenter.x - p.x;
        const dy = previousCenter.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = performance.now() - prev[prev.length - 1].time;

        const speed = distance / timeDiff; // pixels per millisecond
        const N = Math.max(1, Math.min(10, Math.floor(20 / speed))); // adjust as needed
        const interpolatedPoints = interpolatePoints([previousCenter, p], N);
        const generatedParticles: ChalkParticle[] = interpolatedPoints.map(p => ({
          center: p,
          points: generateChalkParticlePoints(p, params.size),
          alpha: Math.random() * 0.5 + 0.3,
          color: params.color,
          type: "chalk",
          size: params.size,
          time: performance.now(),
        }));
        return [...prev, ...generatedParticles];
      });
      recomputeBounds(p);
    },
    [isDrawing, layerFrame, isSnapEnabled, grid, params.color, params.size]
  );

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;

    drawChalkObject({ ...object, particles }, context);
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
      const p = getTouchPoint(event);
      const particlePoints: Point[] = generateChalkParticlePoints(p, params.size);
      setParticles([
        {
          center: p,
          points: particlePoints,
          alpha: Math.random() * 0.5 + 0.3,
          color: params.color,
          time: performance.now(),
          type: "chalk",
          size: params.size,
        },
      ]);
      setIsDrawing(true);
      recomputeBounds(p);
    },
    [params.color, params.size, getTouchPoint]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      setParticles(prev => {
        const previousCenter = prev[prev.length - 1].center;
        const p = getTouchPoint(event as React.TouchEvent<HTMLCanvasElement>);
        recomputeBounds(p);
        const dx = previousCenter.x - p.x;
        const dy = previousCenter.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = performance.now() - prev[prev.length - 1].time;
        const speed = distance / timeDiff;
        const N = Math.max(1, Math.min(10, Math.floor(20 / speed)));
        const interpolatedPoints = interpolatePoints([previousCenter, p], N);
        const generatedParticles: ChalkParticle[] = interpolatedPoints.map(p => ({
          center: p,
          points: generateChalkParticlePoints(p, params.size),
          alpha: Math.random() * 0.5 + 0.3,
          color: params.color,
          type: "chalk",
          size: params.size,
          time: performance.now(),
        }));
        return [...prev, ...generatedParticles];
      });
    },
    [params.color, isDrawing, params.size, getTouchPoint]
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

export default useDrawChalk;
