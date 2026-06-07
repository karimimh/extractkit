import useDrawHighlighter from "@images/hooks/draw/use-draw-highlighter";
import { Grid, Rect } from "@images/types/geometry-types";
import { ContentObject } from "@images/types/layer-types";
import { useEffect, useRef } from "react";

interface HighlighterCanvasProps {
  layerFrame: Rect;
  onNewObject?: (object: ContentObject) => void;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const HighlighterCanvas = ({
  layerFrame,
  onNewObject,
  isSnapEnabled,
  grid,
}: HighlighterCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    draw,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDrawHighlighter({
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

export default HighlighterCanvas;
