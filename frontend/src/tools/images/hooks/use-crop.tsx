import { Point, Rect } from "@images/types/geometry-types";
import { getRectTopLeftAndSize } from "@images/utils/math-utils";
import { parseInteger, scaleRect } from "@images/utils/ui-utils";
import { useCallback, useEffect, useState } from "react";

interface UseCropProps {
  layerFrame: Rect;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isSquare?: boolean;
  onChange?: (object: Rect) => void;
  onDrawEnd?: () => void;
  onSelectChange?: (selected: boolean) => void;
}

const useCrop = ({
  layerFrame,
  canvasRef,
  isSquare: isSquareProp,
  onChange,
  onDrawEnd,
  onSelectChange,
}: UseCropProps) => {
  const [startingPoint, setStartingPoint] = useState<Point>();
  const [endpoint, setEndpoint] = useState<Point>();
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const isSquare: boolean = isSquareProp || isShiftPressed;

  useEffect(() => {
    const canvasFrame = canvasRef.current?.getBoundingClientRect();
    if (!canvasFrame || !startingPoint || !endpoint) return;

    const canvasRect = getRectTopLeftAndSize(startingPoint, endpoint, isSquare);
    const rect = scaleRect(canvasRect, canvasFrame, layerFrame);
    onChange?.(parseInteger(rect));
  }, [
    canvasRef,
    endpoint,
    isSquare,
    layerFrame,
    onChange,
    startingPoint,
  ]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Shift") {
      setIsShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === "Shift") {
      setIsShiftPressed(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvasFrame = canvasRef.current?.getBoundingClientRect();
      if (!canvasFrame) return;
      setStartingPoint({ x: e.clientX, y: e.clientY });
      setIsDrawing(true);
    },
    [canvasRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      setEndpoint({ x: e.clientX, y: e.clientY });
    },
    [isDrawing]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    onDrawEnd?.();
    setStartingPoint(undefined);
    setEndpoint(undefined);
  }, [isDrawing, onDrawEnd]);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
};

export default useCrop;
