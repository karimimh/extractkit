
import Button from "@images/components/ui/button";
import useElementFrame from "@images/hooks/common/use-element-frame";
import { Rect } from "@images/types/geometry-types";
import { clampRect, transferToOrigin } from "@images/utils/math-utils";
import { scaleRect } from "@images/utils/ui-utils";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CropLayerProps {
  onCropRectangleChange: (newRect: Rect) => void;
  onApplyCrop?: (frame: Rect) => void;
  onCancelCrop?: () => void;
  layerFrame: Rect;
  imageFrame: Rect;
  imageCropFrame: Rect;
}

export default function CropLayer({
  onCropRectangleChange,
  imageCropFrame,
  imageFrame,
  onApplyCrop,
  onCancelCrop,
  layerFrame,
}: CropLayerProps) {
  const [cropRectangle, setCropRectangle] = useState<Rect>(imageFrame);
  const containerRef = useRef<HTMLCanvasElement>(null);
  const containerFrame = useElementFrame(containerRef);
  const isResizingRef = useRef<boolean>(false);
  const resizeDirectionRef = useRef<DragDirection>("");

  const scaledCropRectangle = useMemo(
    () =>
      containerFrame
        ? scaleRect(
            cropRectangle,
            transferToOrigin(containerFrame),
            transferToOrigin(layerFrame)
          )
        : undefined,
    [containerFrame, cropRectangle, layerFrame]
  );

  useEffect(() => {
    if (!containerFrame) return;
    setCropRectangle(
      scaleRect(imageCropFrame, layerFrame, transferToOrigin(containerFrame))
    );
  }, [containerFrame, layerFrame, imageCropFrame]);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: DragDirection
  ) => {
    e.preventDefault();
    isResizingRef.current = true;
    resizeDirectionRef.current = direction;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !containerFrame) return;
    const deltaX = e.movementX;
    const deltaY = e.movementY;

    setCropRectangle((prev) => {
      let newRect = { ...prev };
      if (resizeDirectionRef.current.includes("right")) {
        newRect.width = prev.width + deltaX;
      }
      if (resizeDirectionRef.current.includes("bottom")) {
        newRect.height = prev.height + deltaY;
      }
      if (resizeDirectionRef.current.includes("left")) {
        newRect.width = prev.width - deltaX;
        newRect.x = prev.x + deltaX;
      }
      if (resizeDirectionRef.current.includes("top")) {
        newRect.height = prev.height - deltaY;
        newRect.y = prev.y + deltaY;
      }

      return clampRect(
        newRect,
        scaleRect(imageFrame, layerFrame, transferToOrigin(containerFrame))
      );
    });
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    resizeDirectionRef.current = "";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    onCropRectangleChange(cropRectangle);
  };

  useEffect(() => {
    const canvas = containerRef?.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !scaledCropRectangle) return;
    const { width, height } = layerFrame;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    ctx.clearRect(
      scaledCropRectangle.x,
      scaledCropRectangle.y,
      scaledCropRectangle.width,
      scaledCropRectangle.height
    );

    ctx.restore();
  }, [layerFrame, scaledCropRectangle]);

  const projectToolsContainer = document.getElementById("project-tools");

  return (
    <>
      <div className="w-full h-full left-0 top-0 absolute">
        <canvas
          className="w-full h-full left-0 top-0 absolute"
          ref={containerRef}
        />
        <div
          className="border-2 border-blue-600 absolute box-border"
          style={{
            top: cropRectangle.y,
            left: cropRectangle.x,
            width: cropRectangle.width,
            height: cropRectangle.height,
          }}
        >
          <div
            className="border-t border-l border-blue-600 absolute -top-1 -left-1 w-4 h-4 cursor-nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "top-left")}
          />
          <div
            className="border-t border-r border-blue-600 absolute -top-1 -right-1 w-4 h-4 cursor-nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "top-right")}
          />
          <div
            className="border-b border-l border-blue-600 absolute -bottom-1 -left-1 w-4 h-4 cursor-nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
          />
          <div
            className="border-b border-r border-blue-600 absolute -bottom-1 -right-1 w-4 h-4 cursor-nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
          />
          <div
            className="absolute -top-2 left-1/2 w-[calc(100%-2rem)] h-4 cursor-ns-resize -translate-x-1/2"
            onMouseDown={(e) => handleMouseDown(e, "top")}
          />
          <div
            className="absolute -bottom-2 left-1/2 w-[calc(100%-2rem)] h-4 cursor-ns-resize -translate-x-1/2"
            onMouseDown={(e) => handleMouseDown(e, "bottom")}
          />
          <div
            className="absolute top-1/2 -left-2 w-4 h-[calc(100%-2rem)] cursor-ew-resize -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, "left")}
          />
          <div
            className="absolute top-1/2 -right-2 w-4 h-[calc(100%-2rem)] cursor-ew-resize -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, "right")}
          />
        </div>
      </div>
      {projectToolsContainer
        ? createPortal(
            <>
              <Button
                type="button"
                variant="apply"
                text="Apply"
                icon={Check}
                onClick={() =>
                  scaledCropRectangle && onApplyCrop?.(scaledCropRectangle)
                }
              />
              <Button
                type="button"
                variant="cancel"
                text="Cancel"
                icon={X}
                onClick={onCancelCrop}
              />
            </>,
            projectToolsContainer
          )
        : null}
    </>
  );
}

type DragDirection =
  | "right"
  | "top"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "";
