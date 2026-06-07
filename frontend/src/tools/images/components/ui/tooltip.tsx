
import { cn } from "@images/utils/css-utils";
import { ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: ReactNode;
  message: string;
  messagePosition?: "top" | "bottom";
}

const Tooltip = ({
  children,
  message,
  messagePosition = "top",
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  const containerBounds = containerRef.current?.getBoundingClientRect();
  return (
    <div
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      ref={containerRef}
    >
      {children}
      {isVisible &&
        containerBounds &&
        createPortal(
          <div
            className={cn(
              "absolute px-2 py-1 -translate-x-1/2 -translate-y-1/2 bg-black text-white rounded whitespace-nowrap z-[200] transition-[visibility_opacity]",
              messagePosition === "top" ? "mb-1" : "mt-1",
              isVisible ? "visible opacity-100" : "invisible opacity-0"
            )}
            style={{
              left: containerBounds.x + containerBounds.width / 2,
              top:
                messagePosition === "top"
                  ? containerBounds.top - containerBounds.height
                  : containerBounds.bottom + containerBounds.height,
            }}
          >
            {message}
          </div>,
          document.body
        )}
    </div>
  );
};
export default Tooltip;
