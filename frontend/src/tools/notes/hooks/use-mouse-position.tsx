import type { Point, Rect } from "@notes/types/geometry-types";
import { getPointerPositionInFrame } from "@notes/utils/math-utils";
import { useCallback, useRef, useState } from "react";

function useMousePosition(
  layerFrame?: Rect,
  isSnapEnabled = false,
  grid?: {
    rows: number;
    columns: number;
  }
) {
  const [mousePosition, setMousePosition] = useState<Point>();
  const mousePositionRef = useRef<Point>(undefined);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const newMousePosition = getPointerPositionInFrame(
        e,
        e.target as HTMLElement,
        layerFrame,
        isSnapEnabled,
        grid
      );
      if (newMousePosition) {
        setMousePosition(newMousePosition);
        mousePositionRef.current = newMousePosition;
      }
    },
    [layerFrame, isSnapEnabled, grid]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePosition(undefined);
    mousePositionRef.current = undefined;
  }, []);

  return { mousePosition, handleMouseMove, handleMouseLeave, mousePositionRef };
}

export default useMousePosition;
