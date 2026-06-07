import useDrawArc from "@images/hooks/draw/use-draw-arc";
import { Grid, Rect } from "@images/types/geometry-types";
import { ContentObject } from "@images/types/layer-types";
import { useEffect, useRef } from "react";

interface ArcCanvasProps {
  layerFrame: Rect;
  onNewObject?: (object: ContentObject) => void;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const ArcCanvas = ({ layerFrame, onNewObject, isSnapEnabled, grid }: ArcCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { draw, handleMouseMove, handleClick } = useDrawArc({
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
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    />
  );
};

export default ArcCanvas;
