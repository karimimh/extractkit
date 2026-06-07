import { Rect } from "@images/types/geometry-types";
import { RectangleObject } from "@images/types/layer-types";
import { useCallback } from "react";
import useDragging from "../common/use-dragging";
import useElementFrame from "../common/use-element-frame";

export type EditAction =
  | "move"
  | "vertical-resize"
  | "horizontal-resize"
  | "resize"
  | "rotate";

interface UseEditRectangleProps {
  layerFrame: Rect;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  object: RectangleObject;
  onChange: (object: RectangleObject) => void;
  onChangeEnd?: () => void;
  isEditing: boolean;
}

const useEditRectangle = ({
  layerFrame,
  canvasRef,
  onChange: onChange,
  onChangeEnd,
  object,
  isEditing,
}: UseEditRectangleProps) => {
  const canvasFrame = useElementFrame(canvasRef);

  const { handleMouseDown, handleMouseMove, handleMouseUp, isDragging } =
    useDragging({
      srcFrame: canvasFrame,
      targetFrame: layerFrame,
      onMove: (_point, dx, dy) => handleMove(dx, dy),
      enabled: isEditing,
      onDragStart: () => {},
      onDragEnd: onChangeEnd,
    });

  const handleMove = useCallback(
    (dx: number, dy: number) => {
      const { x, y } = object.frame;
      onChange({
        ...object,
        frame: { ...object.frame, x: x + dx, y: y + dy },
      });
    },
    [object, onChange]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isMoving: isDragging,
  };
};

export default useEditRectangle;
