
import { Rect } from "@images/types/geometry-types";
import { cn } from "@images/utils/css-utils";
import { clampRect, getRectTopLeftAndSize } from "@images/utils/math-utils";
import { Redo } from "lucide-react";
import { useRef, useState } from "react";

interface EditableDivProps {
  onChange: (newRect: Rect, rotation: number) => void;
  boundingFrame: Rect;
  initialFrame: Rect;
  initialRotation?: number;
  children?: React.ReactNode;
  className?: string;
  handleColor?: string;
  handleSize?: number;
}

export default function EditableDiv({
  onChange,
  initialFrame,
  initialRotation,
  boundingFrame,
  children,
  className,
  handleColor = "#93c5fd",
  handleSize = 2,
}: EditableDivProps) {
  const [frame, setFrame] = useState<Rect>(initialFrame);
  const frameRef = useRef<Rect>(initialFrame);
  const isResizingRef = useRef<boolean>(false);
  const resizeDirectionRef = useRef<DragDirection>("");
  const isMovingRef = useRef(false);
  const moveStartRef = useRef({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [rotation, setRotation] = useState<number>(initialRotation ?? 0);
  const isRotatingRef = useRef(false);
  const rotateStartRef = useRef({ x: 0, y: 0 });

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
    if (isResizingRef.current) {
      const deltaX = e.movementX;
      const deltaY = e.movementY;

      setFrame((prev) => {
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
        newRect = getRectTopLeftAndSize(
          { x: newRect.x, y: newRect.y },
          { x: newRect.x + newRect.width, y: newRect.y + newRect.height }
        );
        const result = clampRect(newRect, boundingFrame);
        frameRef.current = result;

        return result;
      });
    } else if (isMovingRef.current) {
      const deltaX = e.clientX - moveStartRef.current.x;
      const deltaY = e.clientY - moveStartRef.current.y;
      setFrame((prev) => {
        let newRect = {
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        };
        newRect = getRectTopLeftAndSize(
          { x: newRect.x, y: newRect.y },
          { x: newRect.x + newRect.width, y: newRect.y + newRect.height }
        );
        const result = clampRect(newRect, boundingFrame);
        frameRef.current = result;
        return result;
      });
      moveStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    resizeDirectionRef.current = "";
    isMovingRef.current = false;
    setIsMoving(false);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    onChange(frameRef.current, rotation);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isMovingRef.current = true;
    moveStartRef.current = { x: e.clientX, y: e.clientY };
    setIsMoving(true);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleRotateMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isRotatingRef.current = true;
    rotateStartRef.current = { x: e.clientX, y: e.clientY };
    window.addEventListener("mousemove", handleRotateMouseMove);
    window.addEventListener("mouseup", handleRotateMouseUp);
  };

  const handleRotateMouseMove = (e: MouseEvent) => {
    if (!isRotatingRef.current) return;
    const deltaX = e.clientX - (frame.x + frame.width / 2);
    const deltaY = e.clientY - (frame.y + frame.height / 2);
    const newRotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    setRotation(Math.floor(newRotation));
  };

  const handleRotateMouseUp = () => {
    isRotatingRef.current = false;
    window.removeEventListener("mousemove", handleRotateMouseMove);
    window.removeEventListener("mouseup", handleRotateMouseUp);
    onChange(frameRef.current, rotation);
  };

  return (
    <div
      className={cn("absolute box-border", className)}
      style={{
        top: frame.y,
        left: frame.x,
        width: frame.width,
        height: frame.height,
        cursor: isMoving ? "grabbing" : "auto",
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {children}
      <div
        className="absolute cursor-move"
        onMouseDown={handleDragStart}
        style={{
          top: handleSize,
          left: handleSize,
          width: frame.width - 2 * handleSize,
          height: frame.height - 2 * handleSize,
        }}
      />
      <div
        className="absolute cursor-nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "top-left")}
        style={{
          backgroundColor: handleColor,
          top: -handleSize / 2,
          left: -handleSize / 2,
          width: handleSize * 4,
          height: handleSize,
        }}
      />
      <div
        className="absolute cursor-nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "top-left")}
        style={{
          backgroundColor: handleColor,
          top: -handleSize / 2,
          left: -handleSize / 2,
          width: handleSize,
          height: handleSize * 4,
        }}
      />

      <div
        className="absolute cursor-nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "top-right")}
        style={{
          backgroundColor: handleColor,
          top: -handleSize / 2,
          right: -handleSize / 2,
          width: handleSize * 4,
          height: handleSize,
        }}
      />
      <div
        className="absolute cursor-nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "top-right")}
        style={{
          backgroundColor: handleColor,
          top: -handleSize / 2,
          right: -handleSize / 2,
          width: handleSize,
          height: handleSize * 4,
        }}
      />

      <div
        className="absolute cursor-nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
        style={{
          backgroundColor: handleColor,
          bottom: -handleSize / 2,
          left: -handleSize / 2,
          width: handleSize * 4,
          height: handleSize,
        }}
      />
      <div
        className="absolute cursor-nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
        style={{
          backgroundColor: handleColor,
          bottom: -handleSize / 2,
          left: -handleSize / 2,
          width: handleSize,
          height: handleSize * 4,
        }}
      />

      <div
        className="absolute cursor-nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
        style={{
          backgroundColor: handleColor,
          bottom: -handleSize / 2,
          right: -handleSize / 2,
          width: handleSize * 4,
          height: handleSize,
        }}
      />
      <div
        className="absolute cursor-nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
        style={{
          backgroundColor: handleColor,
          bottom: -handleSize / 2,
          right: -handleSize / 2,
          width: handleSize,
          height: handleSize * 4,
        }}
      />
      <div
        className="absolute cursor-ns-resize"
        onMouseDown={(e) => handleMouseDown(e, "top")}
        style={{
          top: -handleSize / 2,
          left: "25%",
          width: "50%",
          height: handleSize,
        }}
      />
      <div
        className="absolute cursor-ns-resize"
        onMouseDown={(e) => handleMouseDown(e, "bottom")}
        style={{
          width: "50%",
          height: handleSize,
          bottom: -handleSize / 2,
          left: "25%",
        }}
      />
      <div
        className="absolute cursor-ew-resize"
        onMouseDown={(e) => handleMouseDown(e, "left")}
        style={{
          top: "25%",
          left: -handleSize / 2,
          width: handleSize,
          height: "50%",
        }}
      />
      <div
        className="absolute cursor-ew-resize"
        onMouseDown={(e) => handleMouseDown(e, "right")}
        style={{
          top: "25%",
          right: -handleSize / 2,
          width: handleSize,
          height: "50%",
        }}
      />
      <div
        className="absolute top-1/2 -right-5 -translate-y-1/2"
        onMouseDown={handleRotateMouseDown}
      >
        <Redo className="size-4 rotate-90" />
      </div>
      <div
        className={cn(
          "absolute top-1/2 -translate-y-[calc(100%+0.75rem)] text-sm h-4 left-[calc(100%+1rem)] -translate-x-1/2 text-left",
          isRotatingRef.current ? "block" : "hidden"
        )}
      >
        {rotation}°
      </div>
    </div>
  );
}

export type DragDirection =
  | "right"
  | "top"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "";
