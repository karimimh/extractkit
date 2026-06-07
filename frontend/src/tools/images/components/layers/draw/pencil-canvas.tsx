import useDrawPencil from "@images/hooks/draw/use-draw-pencil";
import { Grid, Rect } from "@images/types/geometry-types";
import { ContentObject } from "@images/types/layer-types";
import { useEffect, useRef } from "react";

interface PencilCanvasProps {
  layerFrame: Rect;
  onNewObject?: (object: ContentObject) => void;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const PencilCanvas = ({ layerFrame, onNewObject, isSnapEnabled, grid }: PencilCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    draw,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDrawPencil({
    canvasRef,
    onNewObject,
    layerFrame,
    grid,
    isSnapEnabled,
  });

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className="absolute top-0 left-0 w-full h-full cursor-crosshair"
      ref={canvasRef}
      width={layerFrame.width}
      height={layerFrame.height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    />
  );
};

export default PencilCanvas;
