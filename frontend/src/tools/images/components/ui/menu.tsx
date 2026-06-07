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

interface MenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  horizontalContentAlignment?: "left" | "center" | "right";
}

type MenuTriggerProps = ButtonProps;

interface MenuContentProps {
  children: React.ReactNode;
  className?: string;
}

const Menu: FC<MenuProps> & {
  Trigger: FC<MenuTriggerProps>;
  Content: FC<MenuContentProps>;
  Item: FC<MenuItemProps>;
} = ({
  children,
  className,
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
  horizontalContentAlignment = "center",
}: MenuProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const setIsOpen = controlledSetIsOpen ?? setUncontrolledIsOpen;
  const [isAnimating, setIsAnimating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerStyles, setContainerStyles] = useState<Record<string, any>>({});
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
    };
    setContainerStyles(contentContainerStyles);
  }, [containerSize, horizontalContentAlignment]);

  const handleButtonClick = useCallback(() => {
    updatePopoverPosition();
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => setIsOpen(false), 150);
    } else {
      setIsAnimating(false);
      setIsOpen(true);
    }
  }, [isOpen, setIsOpen, updatePopoverPosition]);

  const trigger = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type.name !== Menu.Trigger.name) return null;

        const triggerNode = child as ReactElement<MenuTriggerProps>;
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
    const findContent = (nodes: ReactNode): ReactElement<MenuContentProps> | null => {
      return Children.toArray(nodes).reduce<ReactElement<MenuContentProps> | null>(
        (found, child): ReactElement<MenuContentProps> | null => {
          if (found) return found;
          if (!isValidElement(child) || typeof child.type === "string") return null;
          if (child.type.name === Menu.Content.name) return child as ReactElement<MenuContentProps>;
          return findContent((child.props as any).children);
        },
        null
      );
    };

    return findContent(children);
  }, [children]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        const portals = document.querySelectorAll("[data-portaled]");
        if (portals.length > 1 && portals[portals.length - 1] !== containerRef.current) {
          return;
        }
        event.stopPropagation();
        trigger?.props.onClick?.(event as any);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, trigger?.props]);

  useEffect(() => {
    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [updatePopoverPosition]);

  useEffect(() => {
    document.addEventListener("wheel", updatePopoverPosition);
    return () => {
      document.removeEventListener("wheel", updatePopoverPosition);
    };
  }, [updatePopoverPosition]);

  return (
    <div className={cn("relative", className)} ref={popoverRef}>
      {trigger}
      {isOpen &&
        createPortal(
          <div
            className={cn(
              "absolute z-50 bg-white rounded-md outline-slate-200/70 outline outline-3",
              "origin-top shadow-[0_4px_6px_-1px_rgba(0,0,0,.1),0_2px_4px_-2px_rgba(0,0,0,.1)]",
              isAnimating ? "animate-menu-drop-out" : "animate-menu-drop-in",
              content?.props.className
            )}
            data-type="popover-content"
            data-portaled
            ref={containerRef}
            style={containerStyles}
          >
            {content?.props.children}
          </div>,
          document.body
        )}
    </div>
  );
};

Menu.Trigger = function DropdownTrigger(props: MenuTriggerProps) {
  return <Button {...props} />;
};

Menu.Content = function DropdownContent({ children, className }: MenuContentProps) {
  return <>{children}</>;
};

interface MenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

Menu.Item = function MenuItem({ children, className, onClick }: MenuItemProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 cursor-pointer select-none hover:bg-slate-100 transition-colors text-sm text-slate-700 rounded-md",
        className
      )}
      onClick={onClick}
      role="menuitem"
      tabIndex={0}
    >
      {children}
    </div>
  );
};

export default Menu;
