
import { Rect } from "@images/types/geometry-types";
import { ReactNode, useEffect, useRef } from "react";

interface ObservableDivProps {
  children?: ReactNode;
  className?: string;
  onAspectRatioChange?: (ap: number) => void;
  onBoundingRectChange?: (br: Rect) => void;
}

export default function ObservableDiv({
  children,
  className = "",
  onAspectRatioChange,
  onBoundingRectChange,
}: ObservableDivProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const v = divRef.current;
      if (v) {
        const rect = v.getBoundingClientRect();
        onBoundingRectChange?.({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      }
      if (!Array.isArray(entries) || !entries.length) return;

      const entry = entries[0];
      if (entry.target === divRef.current) {
        const { width, height } = entry.contentRect;
        const newAspectRatio = width / height;
        onAspectRatioChange?.(newAspectRatio);
      }
    });

    const d = divRef.current;

    if (d) {
      resizeObserver.observe(d);
    }

    return () => {
      if (d) {
        resizeObserver.unobserve(d);
      }
    };
  }, [onAspectRatioChange, onBoundingRectChange]);

  return (
    <div className={className} ref={divRef}>
      {children}
    </div>
  );
}
