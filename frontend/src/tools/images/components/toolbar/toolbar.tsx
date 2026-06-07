
import { Point } from "@images/types/geometry-types";
import { cn } from "@images/utils/css-utils";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Anchor = "top" | "bottom" | "left" | "right";

interface AnchoredToolbarProps {
  children: React.ReactNode;
  className?: string;
}

const AnchoredToolbar = ({ children, className }: AnchoredToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [delta, setDelta] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });

  const [anchor, setAnchor] = useState<Anchor>("top");

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    },
    []
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setDelta({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [dragStart.x, dragStart.y, isDragging]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    anchorToClosestPosition();
    setDelta({ x: 0, y: 0 });
  }, []);

  const anchorToClosestPosition = () => {
    if (!toolbarRef.current) return;

    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const distances = {
      top: Math.abs(toolbarRect.top),
      bottom: Math.abs(windowHeight - toolbarRect.bottom),
      left: Math.abs(toolbarRect.left),
      right: Math.abs(windowWidth - toolbarRect.right),
    };

    const closestPosition = (
      Object.keys(distances) as Array<keyof typeof distances>
    ).reduce(
      (closest, key) => (distances[key] < distances[closest] ? key : closest),
      "top"
    );
    setAnchor(closestPosition);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    } else {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  return (
    <div
      className={cn(
        "fixed pl-6 pr-4 flex items-center justify-center shadow-lg rounded-lg z-50",
        { "transition-transform": !isDragging },
        className
      )}
      ref={toolbarRef}
      style={{
        left: "50%",
        top: 8,
        transform: getTransform(),
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 left-1 cursor-grab"
        onMouseDown={onMouseDown}
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      {children}
    </div>
  );

  function signedStr(n: number) {
    return n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`;
  }

  function getTransform() {
    if (!toolbarRef.current) return "translate(-50%, 0)";
    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const toolbarHeight = Math.min(toolbarRect.width, toolbarRect.height);
    const trY = windowHeight - 24 - toolbarHeight;
    const trX = Math.floor(windowWidth / 2 - toolbarHeight);
    if (anchor === "top") {
      return `translate(calc(-50% ${signedStr(delta.x)}px), ${
        delta.y
      }px) rotate(0deg)`;
    } else if (anchor === "bottom") {
      return `translate(calc(-50% ${signedStr(delta.x)}px), ${
        trY + delta.y
      }px) rotate(0deg)`;
    } else if (anchor === "left") {
      return `translate(calc(-50% ${signedStr(-trX + delta.x)}px), ${
        delta.y + Math.floor(trY / 2)
      }px) rotate(90deg)`;
    } else if (anchor === "right") {
      return `translate(calc(-50% ${signedStr(trX + delta.x)}px), ${
        delta.y + Math.floor(trY / 2)
      }px) rotate(90deg)`;
    }
    return "none";
  }
};

export default AnchoredToolbar;
