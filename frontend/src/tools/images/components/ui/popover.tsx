import { useIsMobile } from "@images/hooks/common/use-is-mobile";
import { Point, Size } from "@images/types/geometry-types";
import { cn } from "@images/utils/css-utils";
import {
  Children,
  cloneElement,
  Dispatch,
  FC,
  isValidElement,
  ReactElement,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Button, { ButtonProps } from "./button";

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  horizontalContentAlignment?: "left" | "center" | "right";
  mobileVariant?: "popover" | "drawer";
}

type PopoverTriggerProps = ButtonProps;

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

const Popover: FC<PopoverProps> & {
  Trigger: FC<PopoverTriggerProps>;
  Content: FC<PopoverContentProps>;
} = ({
  children,
  className,
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
  horizontalContentAlignment = "center",
  mobileVariant = "popover",
}: PopoverProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const setIsOpen = controlledSetIsOpen ?? setUncontrolledIsOpen;
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);
  const isMobile = useIsMobile();
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const updatePopoverPosition = useCallback(() => {
    if (!popoverRef.current || !containerRef.current) return;
    const triggerRect = popoverRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const downwardPosition: Point =
      horizontalContentAlignment === "center"
        ? {
            x: triggerRect.left + triggerRect.width / 2 - containerSize.width / 2,
            y: triggerRect.top + triggerRect.height + 4,
          }
        : horizontalContentAlignment === "left"
          ? {
              x: triggerRect.left,
              y: triggerRect.top + triggerRect.height + 4,
            }
          : {
              x: triggerRect.right - containerSize.width,
              y: triggerRect.top + triggerRect.height + 4,
            };

    const upwardPosition: Point =
      horizontalContentAlignment === "center"
        ? {
            x: triggerRect.left + triggerRect.width / 2 - containerSize.width / 2,
            y: triggerRect.top - containerSize.height - 4,
          }
        : horizontalContentAlignment === "left"
          ? {
              x: triggerRect.left,
              y: triggerRect.top - containerSize.height - 4,
            }
          : {
              x: triggerRect.right - containerSize.width,
              y: triggerRect.top - containerSize.height - 4,
            };

    const downwardPositionEmptySpace = viewportHeight - (downwardPosition.y + containerSize.height);
    const upwardPositionEmptySpace = upwardPosition.y;
    const emptyRightSpace = viewportWidth - (downwardPosition.x + containerSize.width);
    const emptyLeftSpace = downwardPosition.x;
    const isDownwardPopoversBottomOutOfView = downwardPositionEmptySpace < 0;
    const isRightSpaceEnough = emptyRightSpace > 0;
    const isLeftSpaceEnough = emptyLeftSpace > 0;

    let position = downwardPosition;
    if (
      isDownwardPopoversBottomOutOfView &&
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

  const handleButtonClick = useCallback(() => {
    if (isOpen) {
      if (isMobile && mobileVariant === "drawer") {
        setIsAnimating(true);
        setShouldOpen(false);
        // For mobile drawer, wait for animation before closing
        setTimeout(() => {
          setIsOpen(false);
          setContainerStyles(prev => ({ ...prev, opacity: 0, visibility: "hidden" }));
          setIsAnimating(false);
        }, 300); // Match drawer animation duration
      } else {
        setIsAnimating(true);
        setTimeout(() => {
          setIsOpen(false);
          setContainerStyles(prev => ({ ...prev, opacity: 0, visibility: "hidden" }));
        }, 150);
      }
    } else {
      setIsAnimating(false);
      setIsOpen(true);
      if (isMobile && mobileVariant === "drawer") {
        // For mobile drawer, trigger animation after opening
        setTimeout(() => {
          setShouldOpen(true);
        }, 0);
      } else {
        // Update position after the popover is opened and DOM is updated
        setTimeout(() => updatePopoverPosition(), 0);
      }
    }
  }, [isOpen, setIsOpen, updatePopoverPosition, isMobile, mobileVariant]);

  const trigger = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== Popover.Trigger) return null;

        const triggerNode = child as ReactElement<PopoverTriggerProps>;
        const triggerProps = triggerNode.props;

        return cloneElement(triggerNode, {
          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            triggerProps.onClick?.(e);
            handleButtonClick();
          },
        });
      })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children, handleButtonClick]);

  const content = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== Popover.Content) return null;

        const contentNode = child as ReactElement<PopoverContentProps>;
        return contentNode;
      })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children]);

  useEffect(() => {
    if (!popoverRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updatePopoverPosition();
    });

    resizeObserver.observe(popoverRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updatePopoverPosition]);

  useEffect(() => {
    document.addEventListener("wheel", updatePopoverPosition);
    return () => {
      document.removeEventListener("wheel", updatePopoverPosition);
    };
  }, [updatePopoverPosition]);

  // Handle ESC key to close popover
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.stopPropagation();
        if (isMobile && mobileVariant === "drawer") {
          setIsAnimating(true);
          setShouldOpen(false);
          setTimeout(() => {
            setIsOpen(false);
            setContainerStyles(prev => ({ ...prev, opacity: 0, visibility: "hidden" }));
            setIsAnimating(false);
          }, 300);
        } else {
          setIsAnimating(true);
          setTimeout(() => {
            setIsOpen(false);
            setContainerStyles(prev => ({ ...prev, opacity: 0, visibility: "hidden" }));
          }, 150);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen, setIsOpen, isMobile, mobileVariant]);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      popoverRef.current &&
      containerRef.current &&
      !popoverRef.current.contains(e.target as Node) &&
      !containerRef.current.contains(e.target as Node)
    ) {
      if (isMobile && mobileVariant === "drawer") {
        setIsAnimating(true);
        setShouldOpen(false);
        setTimeout(() => {
          setIsOpen(false);
          setContainerStyles(prev => ({ ...prev, opacity: 0, visibility: "hidden" }));
          setIsAnimating(false);
        }, 300);
      } else {
        setIsOpen(false);
        setContainerStyles(prev => ({ ...prev, opacity: 0, visibility: "hidden" }));
      }
    }
  };

  const handleOverlayEvents = (
    e: React.MouseEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement>
  ) => {
    // Prevent all mouse and wheel events from propagating to content below
    e.stopPropagation();
  };

  const handleTouchEvents = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent touch events from propagating to content below
    e.stopPropagation();
  };
  return (
    <div className={cn("relative", className)} ref={popoverRef}>
      {trigger}
      {isOpen &&
        createPortal(
          isMobile && mobileVariant === "drawer" ? (
            // Mobile drawer
            <div
              className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200"
              style={{
                opacity: shouldOpen ? 1 : 0,
              }}
              onClick={handleClickOutside}
              onWheel={handleOverlayEvents}
              onMouseDown={handleOverlayEvents}
              onMouseMove={handleOverlayEvents}
              onMouseUp={handleOverlayEvents}
              onTouchStart={handleTouchEvents}
              onTouchMove={handleTouchEvents}
              onTouchEnd={handleTouchEvents}
            >
              <div
                className={cn(
                  "w-full absolute overflow-hidden bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg transform ease-in duration-300",
                  content?.props.className
                )}
                style={{
                  transformOrigin: "bottom center",
                  maxHeight: "calc(100vh - 4rem)",
                  transform: shouldOpen ? "translateY(0)" : "translateY(100%)",
                  transition: "transform 300ms ease-in",
                }}
                onClick={e => e.stopPropagation()}
                data-type="popover-content"
                data-portaled
                ref={containerRef}
              >
                <div className="p-4">{content?.props.children}</div>
              </div>
            </div>
          ) : (
            // Desktop popover or mobile popover
            <div
              className="fixed z-50 top-0 left-0 w-full h-screen"
              style={{ pointerEvents: "auto" }}
              onClick={handleClickOutside}
              onWheel={handleOverlayEvents}
              onMouseDown={handleOverlayEvents}
              onMouseMove={handleOverlayEvents}
              onMouseUp={handleOverlayEvents}
              onTouchStart={handleTouchEvents}
              onTouchMove={handleTouchEvents}
              onTouchEnd={handleTouchEvents}
            >
              <div
                className={cn(
                  "absolute z-50 bg-white rounded-md",
                  "origin-top shadow-[0_4px_6px_-1px_rgba(0,0,0,.1),0_2px_4px_-2px_rgba(0,0,0,.1)]",
                  isAnimating && "animate-hide-scaled",
                  !isAnimating && "animate-show-scaled",
                  content?.props.className
                )}
                data-type="popover-content"
                data-portaled
                ref={containerRef}
                style={containerStyles}
              >
                {content?.props.children}
              </div>
            </div>
          ),
          document.body
        )}
    </div>
  );
};

Popover.Trigger = function DropdownTrigger(props: PopoverTriggerProps) {
  return <Button {...props} />;
};

Popover.Content = function DropdownItem({ children }: PopoverContentProps) {
  return <>{children}</>;
};

export default Popover;
