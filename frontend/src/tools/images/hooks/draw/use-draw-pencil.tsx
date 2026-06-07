import { generatePencilParticlePoints } from "@images/lib/draw/draw";
import { drawPencilObject } from "@images/lib/layers/render";
import { Grid, Point, Rect } from "@images/types/geometry-types";
import { PencilObject, PencilParticle } from "@images/types/layer-types";
import { getPencilObject } from "@images/utils/draw-utils";
import { getPointerPositionInFrame } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { interpolatePoints } from "../../lib/draw/interpolation";
import usePencilParams from "../params/use-pencil-params";

interface UsePencilProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNewObject?: (object: PencilObject) => void;
  layerFrame: Rect;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const useDrawPencil = ({
  canvasRef,
  onNewObject,
  layerFrame,
  grid,
  isSnapEnabled = false,
}: UsePencilProps) => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [particles, setParticles] = useState<PencilParticle[]>([]);
  const params = usePencilParams();
  const [id, setId] = useState<string>(generateId());
  const bounds = useRef<Rect | undefined>();

  useEffect(() => {
    setId(generateId());
  }, [isDrawing]);

  const object = useMemo(() => getPencilObject(particles, bounds.current, id), [particles, id]);

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
      const points = generatePencilParticlePoints(p, params.size);
      setParticles([
        {
          center: p,
          points,
          alpha: Math.random() * 0.2 + 0.1,
          color: params.color,
          time: performance.now(),
          type: "pencil",
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

      setParticles(prev => {
        const previousCenter = prev[prev.length - 1].center;
        const pt = getPointerPositionInFrame(
          event,
          event.target as HTMLElement,
          layerFrame,
          isSnapEnabled,
          grid
        );
        if (!pt) return prev;
        recomputeBounds(pt);
        const dx = previousCenter.x - pt.x;
        const dy = previousCenter.y - pt.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = performance.now() - prev[prev.length - 1].time;

        const speed = distance / timeDiff; // pixels per millisecond
        const N = Math.max(1, Math.min(20, Math.floor(40 / speed))); // adjust as needed
        const interpolatedPoints = interpolatePoints([previousCenter, pt], N);
        const generatedParticles: PencilParticle[] = interpolatedPoints.map(p => {
          const points = generatePencilParticlePoints(p, params.size);
          return {
            center: p,
            points,
            alpha: Math.random() * 0.2 + 0.1,
            color: params.color,
            type: "pencil",
            size: params.size,
            time: performance.now(),
          };
        });
        return [...prev, ...generatedParticles];
      });
    },
    [isDrawing, layerFrame, isSnapEnabled, grid, params.size, params.color]
  );

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!object) return;
    drawPencilObject({ ...object, particles }, context);
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
      const points = generatePencilParticlePoints(p, params.size);
      setParticles([
        {
          center: p,
          points,
          alpha: Math.random() * 0.2 + 0.1,
          color: params.color,
          time: performance.now(),
          type: "pencil",
          size: params.size,
        },
      ]);
      setIsDrawing(true);
      recomputeBounds(p);
    },
    [params.size, params.color, getTouchPoint]
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
        const N = Math.max(1, Math.min(20, Math.floor(40 / speed)));
        const interpolatedPoints = interpolatePoints([previousCenter, pt], N);
        const generatedParticles: PencilParticle[] = interpolatedPoints.map(p => {
          const points = generatePencilParticlePoints(p, params.size);
          return {
            center: p,
            points,
            alpha: Math.random() * 0.2 + 0.1,
            color: params.color,
            type: "pencil",
            size: params.size,
            time: performance.now(),
          };
        });
        return [...prev, ...generatedParticles];
      });
    },
    [isDrawing, getTouchPoint, params.size, params.color]
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

export default useDrawPencil;
