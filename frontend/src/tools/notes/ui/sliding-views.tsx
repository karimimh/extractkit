"use client";

import { cn } from "@notes/utils/css-utils";
import { type ReactNode } from "react";

interface SlidingViewsProps {
  children: ReactNode[];
  className?: string;
  childContainerClassName?: string;
  activeTab?: number;
}

const SlidingViews = ({
  children,
  className = "",
  childContainerClassName = "",
  activeTab = 0,
}: SlidingViewsProps) => {
  return (
    <div className={cn("relative overflow-x-hidden overflow-y-hidden", className)}>
      {children.map((child, index) => (
        <div
          className={cn(
            "absolute inset-0 transform transition-transform ease-in-out overflow-y-auto",
            childContainerClassName
          )}
          key={index}
          style={{ transform: `translateX(${(index - activeTab) * 100}%)` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default SlidingViews;
