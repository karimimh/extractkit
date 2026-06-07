
import useMousePosition from "@images/hooks/common/use-mouse-position";
import { Rect } from "@images/types/geometry-types";
import { cn } from "@images/utils/css-utils";
import { domRectToRect, getAspectRatio } from "@images/utils/math-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import LayersContents from "./layers-contents";

interface LayersContainerProps {
  layerFrame?: Rect;
  isSnapEnabled?: boolean;
  grid?: {
    rows: number;
    columns: number;
  };
}

const LayersContainer = ({
  layerFrame,
  grid,
  isSnapEnabled = false,
}: LayersContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerAR, setContainerAR] = useState<number>();
  const [contentAR, setContentAR] = useState<number>();
  const { handleMouseLeave, handleMouseMove, mousePosition } = useMousePosition(
    layerFrame,
    isSnapEnabled,
    grid
  );

  const setAR = useCallback(() => {
    const containerFrame = domRectToRect(
      containerRef.current?.getBoundingClientRect()
    );
    setContainerAR(getAspectRatio(containerFrame));
    setContentAR(getAspectRatio(layerFrame));
  }, [layerFrame]);

  useEffect(() => {
    setAR();
  }, [setAR]);

  useEffect(() => {
    window.addEventListener("resize", setAR);

    return () => {
      window.removeEventListener("resize", setAR);
    };
  }, [setAR]);

  return (
    <div
      className="flex items-center justify-center h-full w-full select-none relative"
      ref={containerRef}
    >
      {contentAR && containerAR ? (
        <div
          className={cn(
            "relative select-none bg-[#F8F8F8]",
            contentAR > containerAR ? "w-full" : "h-full"
          )}
          id="layers-area"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          ref={contentRef}
          style={{ aspectRatio: contentAR }}
        >
          {layerFrame && (
            <LayersContents
              layerFrame={layerFrame}
              mousePosition={mousePosition}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default LayersContainer;
