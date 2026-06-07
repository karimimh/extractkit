import { drawObject } from "@images/lib/layers/render";
import { Rect } from "@images/types/geometry-types";
import { ImageObject } from "@images/types/layer-types";
import { useCallback, useEffect, useRef } from "react";

interface ImageCanvasProps {
  layerFrame: Rect;
  object: ImageObject;
  original?: boolean;
  layerId: string;
}

const ImageCanvas = ({
  layerFrame,
  object,
}: ImageCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    await drawObject(object, context, canvas.width, canvas.height);
  }, [object]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={layerFrame.width}
      height={layerFrame.height}
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        opacity: 0.5,
      }}
    />
  );
};

export default ImageCanvas;
