import type { Point, Rect } from "@notes/types/geometry-types";
import { scalePoint } from "@notes/utils/math-utils";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseDraggingProps {
  enabled?: boolean;
  srcFrame?: Rect;
  targetFrame?: Rect;
  onDragStart?: (point: Point, dx: number, dy: number) => void;
  onDragEnd?: (point: Point, dx: number, dy: number) => void;
  onMove?: (point: Point, dx: number, dy: number) => void;
}

const useDragging = ({
  enabled = true,
  srcFrame,
  targetFrame,
  onMove,
  onDragEnd,
  onDragStart,
}: UseDraggingProps) => {
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPointRef = useRef<Point | null>(null);
  const dragDeltaRef = useRef<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      dragDeltaRef.current = { x: 0, y: 0 };
      setDragDelta({ x: 0, y: 0 });
    }
  }, [enabled]);

  const handlePointerDown = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!enabled) return;
      let clientX: number, clientY: number;
      if ("touches" in event) {
        if (event.touches.length !== 1) return;
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }
      let point: Point = { x: clientX, y: clientY };
      if (srcFrame && targetFrame) point = scalePoint(point, srcFrame, targetFrame);

      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartPointRef.current = point;
      onDragStart?.(point, 0, 0);

      const handlePointerMove = (moveEvent: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current || !dragStartPointRef.current || !enabled) return;
        let moveX: number, moveY: number;
        if ("touches" in moveEvent) {
          if (moveEvent.touches.length !== 1) return;
          moveX = moveEvent.touches[0].clientX;
          moveY = moveEvent.touches[0].clientY;
        } else {
          moveX = (moveEvent as MouseEvent).clientX;
          moveY = (moveEvent as MouseEvent).clientY;
        }
        let movePoint: Point = { x: moveX, y: moveY };
        if (srcFrame && targetFrame) movePoint = scalePoint(movePoint, srcFrame, targetFrame);
        const dx = Math.floor(movePoint.x - dragStartPointRef.current.x);
        const dy = Math.floor(movePoint.y - dragStartPointRef.current.y);
        dragDeltaRef.current = { x: dx, y: dy };
        setDragDelta({ x: dx, y: dy });
        onMove?.(movePoint, dx, dy);
      };

      const handlePointerUp = (upEvent: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current || !enabled) return;
        let upX: number, upY: number;
        if ("changedTouches" in upEvent) {
          upX = upEvent.changedTouches[0].clientX;
          upY = upEvent.changedTouches[0].clientY;
        } else {
          upX = (upEvent as MouseEvent).clientX;
          upY = (upEvent as MouseEvent).clientY;
        }
        let upPoint: Point = { x: upX, y: upY };
        if (srcFrame && targetFrame) upPoint = scalePoint(upPoint, srcFrame, targetFrame);
        isDraggingRef.current = false;
        setIsDragging(false);
        dragStartPointRef.current = null;
        onDragEnd?.(upPoint, dragDeltaRef.current.x, dragDeltaRef.current.y);
      };

      document.addEventListener("mousemove", handlePointerMove);
      document.addEventListener("mouseup", handlePointerUp);
      document.addEventListener("touchmove", handlePointerMove, { passive: false });
      document.addEventListener("touchend", handlePointerUp);
      document.addEventListener("touchcancel", handlePointerUp);

      const cleanup = () => {
        document.removeEventListener("mousemove", handlePointerMove);
        document.removeEventListener("mouseup", handlePointerUp);
        document.removeEventListener("touchmove", handlePointerMove);
        document.removeEventListener("touchend", handlePointerUp);
        document.removeEventListener("touchcancel", handlePointerUp);
      };
      // For React synthetic events, prevent default to avoid scrolling on touch
      if ("preventDefault" in event) event.preventDefault();
      // Return cleanup for React event system
      return cleanup;
    },
    [enabled, onDragEnd, onDragStart, onMove, srcFrame, targetFrame]
  );

  // For backward compatibility, keep handleMouseDown as an alias
  const handleMouseDown = handlePointerDown;
  const handleTouchStart = handlePointerDown;

  return {
    dx: dragDelta.x,
    dy: dragDelta.y,
    handleMouseDown,
    handleTouchStart,
    isDragging,
  };
};

export default useDragging;
