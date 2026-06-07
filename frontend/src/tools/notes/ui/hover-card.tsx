import { cn } from "@notes/utils/css-utils";
import { type Point, type Size } from "@notes/types/geometry-types";
import {
  Children,
  cloneElement,
  type FC,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  horizontalContentAlignment?: "left" | "center" | "right";
  openDelay?: number; // Delay in ms before showing the content
  closeDelay?: number; // Delay in ms before hiding the content
}

interface HoverCardTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

interface HoverCardContentProps {
  children: React.ReactNode;
  className?: string;
}

const HoverCard: FC<HoverCardProps> & {
  Trigger: FC<HoverCardTriggerProps>;
  Content: FC<HoverCardContentProps>;
} = ({
  children,
  className,
  horizontalContentAlignment = "center",
  openDelay = 200,
  closeDelay = 150,
}: HoverCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hoverCardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [containerStyles, setContainerStyles] = useState<Record<string, string | number>>({
    opacity: 0,
    visibility: "hidden",
  });
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    if (isOpen && containerRef.current) {
      updateContainerSize();

      const resizeObserver = new ResizeObserver(updateContainerSize);
      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [isOpen]);

  const updateHoverCardPosition = useCallback(() => {
    if (!hoverCardRef.current || !containerRef.current) return;
    const triggerRect = hoverCardRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const downwardPosition: Point =
      horizontalContentAlignment === "center"
        ? {
            x: triggerRect.left + triggerRect.width / 2 - containerSize.width / 2,
            y: triggerRect.top + triggerRect.height + 8,
          }
        : horizontalContentAlignment === "left"
        ? {
            x: triggerRect.left,
            y: triggerRect.top + triggerRect.height + 8,
          }
        : {
            x: triggerRect.right - containerSize.width,
            y: triggerRect.top + triggerRect.height + 8,
          };

    const upwardPosition: Point =
      horizontalContentAlignment === "center"
        ? {
            x: triggerRect.left + triggerRect.width / 2 - containerSize.width / 2,
            y: triggerRect.top - containerSize.height - 8,
          }
        : horizontalContentAlignment === "left"
        ? {
            x: triggerRect.left,
            y: triggerRect.top - containerSize.height - 8,
          }
        : {
            x: triggerRect.right - containerSize.width,
            y: triggerRect.top - containerSize.height - 8,
          };

    const downwardPositionEmptySpace = viewportHeight - (downwardPosition.y + containerSize.height);
    const upwardPositionEmptySpace = upwardPosition.y;
    const emptyRightSpace = viewportWidth - (downwardPosition.x + containerSize.width);
    const emptyLeftSpace = downwardPosition.x;
    const isDownwardHoverCardsBottomOutOfView = downwardPositionEmptySpace < 0;
    const isRightSpaceEnough = emptyRightSpace > 0;
    const isLeftSpaceEnough = emptyLeftSpace > 0;

    let position = downwardPosition;
    if (
      isDownwardHoverCardsBottomOutOfView &&
      downwardPositionEmptySpace < upwardPositionEmptySpace
    ) {
      position = upwardPosition;
    }
    if (containerSize.width < viewportWidth - 4) {
      if (!isRightSpaceEnough) {
        position.x = viewportWidth - containerSize.width - 4;
      } else if (!isLeftSpaceEnough) {
        position.x = 4;
      }
    }

    const contentContainerStyles = {
      top: position.y,
      left: position.x,
      opacity: 1,
      visibility: "visible" as const,
    };
    setContainerStyles(contentContainerStyles);
  }, [containerSize, horizontalContentAlignment]);

  const handleMouseEnter = useCallback(() => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Set timeout to open the hover card
    openTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setIsOpen(true);
      // Update position after the hover card is opened and DOM is updated
      setTimeout(() => updateHoverCardPosition(), 0);
    }, openDelay);
  }, [openDelay, updateHoverCardPosition]);

  const handleMouseLeave = useCallback(() => {
    // Clear any pending open timeout
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    // Set timeout to close the hover card
    closeTimeoutRef.current = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setContainerStyles(prev => ({ ...prev, opacity: 0, visibility: "hidden" }));
      }, 150);
    }, closeDelay);
  }, [closeDelay]);

  const handleContentMouseEnter = useCallback(() => {
    // Clear any pending close timeout when hovering over content
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleContentMouseLeave = useCallback(() => {
    // Close when leaving the content
    handleMouseLeave();
  }, [handleMouseLeave]);

  const trigger = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== HoverCard.Trigger) return null;

        const triggerNode = child as ReactElement<HoverCardTriggerProps>;
        const triggerProps = triggerNode.props;

        if (triggerProps.asChild && triggerProps.children) {
          const childElement = Children.only(triggerProps.children) as ReactElement<any>;
          const originalOnMouseEnter = (childElement.props as any)?.onMouseEnter;
          const originalOnMouseLeave = (childElement.props as any)?.onMouseLeave;
          return cloneElement(childElement, {
            onMouseEnter: (e: React.MouseEvent) => {
              originalOnMouseEnter?.(e);
              handleMouseEnter();
            },
            onMouseLeave: (e: React.MouseEvent) => {
              originalOnMouseLeave?.(e);
              handleMouseLeave();
            },
          } as any);
        }

        return cloneElement(triggerNode, {
          onMouseEnter: () => {
            handleMouseEnter();
          },
          onMouseLeave: () => {
            handleMouseLeave();
          },
        } as any);
      })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children, handleMouseEnter, handleMouseLeave]);

  const content = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== HoverCard.Content) return null;

        const contentNode = child as ReactElement<HoverCardContentProps>;
        return contentNode;
      })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children]);

  useEffect(() => {
    if (!hoverCardRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updateHoverCardPosition();
    });

    resizeObserver.observe(hoverCardRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateHoverCardPosition]);

  useEffect(() => {
    document.addEventListener("wheel", updateHoverCardPosition);
    return () => {
      document.removeEventListener("wheel", updateHoverCardPosition);
    };
  }, [updateHoverCardPosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative inline-block", className)} ref={hoverCardRef}>
      {trigger}
      {isOpen &&
        createPortal(
          <div className="fixed z-50 top-0 left-0 w-full h-screen pointer-events-none">
            <div
              className={cn(
                "absolute z-50 bg-white rounded-md pointer-events-auto",
                "origin-top shadow-[0_4px_6px_-1px_rgba(0,0,0,.1),0_2px_4px_-2px_rgba(0,0,0,.1)]",
                isAnimating && "animate-hide-scaled",
                !isAnimating && "animate-show-scaled",
                content?.props.className
              )}
              data-type="hover-card-content"
              data-portaled
              ref={containerRef}
              style={containerStyles}
              onMouseEnter={handleContentMouseEnter}
              onMouseLeave={handleContentMouseLeave}
            >
              {content?.props.children}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

HoverCard.Trigger = function HoverCardTrigger({ children, className }: HoverCardTriggerProps) {
  return <div className={className}>{children}</div>;
};

HoverCard.Content = function HoverCardContent({ children }: HoverCardContentProps) {
  return <>{children}</>;
};

export default HoverCard;
