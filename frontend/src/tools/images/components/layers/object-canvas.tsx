import { drawObject } from "@images/lib/layers/render";
import { Rect } from "@images/types/geometry-types";
import { ContentObject } from "@images/types/layer-types";
import { useCallback, useEffect, useRef } from "react";
import CropLayer from "./crop/crop-layer";

interface ObjectCanvasProps {
  layerFrame: Rect;
  object: ContentObject;
  isCropping: boolean;
  onApplyCrop?: (frame: Rect) => void;
  onCancelCrop?: () => void;
}

const ObjectCanvas = ({
  layerFrame,
  isCropping,
  object,
  onApplyCrop,
  onCancelCrop,
}: ObjectCanvasProps) => {
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
    <>
      <canvas
        className="absolute top-0 left-0 w-full h-full"
        ref={canvasRef}
        width={layerFrame.width}
        height={layerFrame.height}
      />
      {isCropping && object.type === "image" && (
        <CropLayer
          onCropRectangleChange={() => {}}
          imageFrame={object.frame}
          imageCropFrame={object.cropFrame}
          onApplyCrop={onApplyCrop}
          onCancelCrop={onCancelCrop}
          layerFrame={layerFrame}
        />
      )}
    </>
  );
};

export default ObjectCanvas;
