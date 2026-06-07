import Button from "@images/components/ui/button";
import useDrawPath from "@images/hooks/draw/use-draw-path";
import { Grid, Rect } from "@images/types/geometry-types";
import { ContentObject } from "@images/types/layer-types";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

interface PathCanvasProps {
  layerFrame: Rect;
  onNewObject?: (object: ContentObject) => void;
  isSnapEnabled?: boolean;
  grid?: Grid;
}

const PathCanvas = ({ layerFrame, onNewObject, isSnapEnabled, grid }: PathCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { draw, handleMouseMove, handleClick, endPath, points, isDrawing } = useDrawPath({
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
    <>
      <canvas
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        ref={canvasRef}
        width={layerFrame.width}
        height={layerFrame.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {isDrawing && points.length > 1 && (
        <Button
          className="flex sm:hidden absolute bottom-2 right-2 z-10 px-1 py-1"
          icon={Check}
          iconSize="5"
          onClick={() => endPath(points)}
          variant="stone"
        />
      )}
    </>
  );
};

export default PathCanvas;
