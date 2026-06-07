"use client";

import { cn } from "@notes/utils/css-utils";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface CucumberProps {
  className?: string;
  children?: ReactNode;
  onBlur?: () => void;
  contentClassName?: string;
  widthConstant?: number;
  animateHeightOnly?: boolean;
}

const Cucumber = ({
  className,
  children,
  onBlur,
  contentClassName,
  widthConstant = 32,
  animateHeightOnly = false,
}: CucumberProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = contentRef.current;
    const resizeObserver = new ResizeObserver(() => {
      if (node) {
        const { width, height } = node.getBoundingClientRect();
        setDimensions({ width: width + widthConstant, height });
      }
    });

    if (node) {
      resizeObserver.observe(node);
    }

    return () => {
      if (node) {
        resizeObserver.unobserve(node);
      }
    };
  }, [widthConstant]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-l-full overflow-hidden rounded-r-full px-4 flex items-center justify-center",
        "transition-all duration-300 ease-out",
        className
      )}
      style={{
        ...(animateHeightOnly ? {} : { width: `${dimensions.width}px` }),
        height: `${dimensions.height}px`,
      }}
      onBlur={onBlur}
      tabIndex={onBlur ? 0 : undefined}
    >
      <div ref={contentRef} className={cn("inline-block py-1 px-4", contentClassName)}>
        {children}
      </div>
    </div>
  );
};

export default Cucumber;
