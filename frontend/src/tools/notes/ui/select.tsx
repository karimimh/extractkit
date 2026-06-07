/**
 * Select Component
 *
 * A customizable dropdown select component that supports controlled and uncontrolled modes.
 * Features mobile-responsive drawer on mobile devices and dropdown on desktop.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Select placeholder="Choose an option" onValueChange={(value) => console.log(value)}>
 *   <Select.Trigger />
 *   <Select.Content>
 *     <Select.Item value="option1">Option 1</Select.Item>
 *     <Select.Item value="option2">Option 2</Select.Item>
 *     <Select.Item value="option3" disabled>Option 3 (Disabled)</Select.Item>
 *   </Select.Content>
 * </Select>
 *
 * // Controlled usage
 * const [selectedValue, setSelectedValue] = useState("option1");
 * <Select value={selectedValue} onValueChange={setSelectedValue}>
 *   <Select.Trigger className="w-64" />
 *   <Select.Content>
 *     <Select.Item value="option1">First Option</Select.Item>
 *     <Select.Item value="option2">Second Option</Select.Item>
 *   </Select.Content>
 * </Select>
 * ```
 */

import { cn } from "@notes/utils/css-utils";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import {
  Children,
  cloneElement,
  createContext,
  type Dispatch,
  type FC,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface SelectContextValue {
  selectedValue: string | null;
  setSelectedValue: (value: string) => void;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

interface SelectProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
  onTriggerClick?: () => void;
  raw?: boolean;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

const Select: FC<SelectProps> & {
  Trigger: FC<SelectTriggerProps>;
  Content: FC<SelectContentProps>;
  Item: FC<SelectItemProps>;
} = ({
  children,
  className,
  value: controlledValue,
  onValueChange,
  placeholder = "Select an option...",
  disabled = false,
}: SelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const isMobile = useIsMobile();
  const selectRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedValue = controlledValue ?? uncontrolledValue;

  const setSelectedValue = useCallback(
    (value: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(value);
      }
      onValueChange?.(value);
      setIsOpen(false);
    },
    [controlledValue, onValueChange]
  );

  const updatePosition = useCallback(() => {
    if (!selectRef.current || !contentRef.current) return;

    const triggerRect = selectRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Default to showing below the trigger
    let top = triggerRect.bottom + 4;
    let left = triggerRect.left;

    // Check if there's enough space below, otherwise show above
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < contentRect.height + 8 && spaceAbove > spaceBelow) {
      top = triggerRect.top - contentRect.height - 4;
    }

    // Ensure the dropdown doesn't go off-screen horizontally
    if (left + contentRect.width > viewportWidth - 8) {
      left = viewportWidth - contentRect.width - 8;
    }
    if (left < 8) {
      left = 8;
    }

    // Match the width of the trigger
    const width = triggerRect.width;

    setPosition({ top, left });
    setIsPositioned(true);

    // Apply the width to the content
    if (contentRef.current) {
      contentRef.current.style.minWidth = `${width}px`;
    }
  }, []);

  const handleTriggerClick = useCallback(() => {
    if (disabled) return;

    if (isOpen) {
      if (isMobile) {
        setIsAnimating(true);
        setShouldOpen(false);
        setTimeout(() => {
          setIsOpen(false);
          setIsAnimating(false);
        }, 300);
      } else {
        setIsAnimating(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsPositioned(false);
        }, 150);
      }
    } else {
      setIsAnimating(false);
      setIsOpen(true);
      if (isMobile) {
        setTimeout(() => {
          setShouldOpen(true);
        }, 0);
      } else {
        setTimeout(() => updatePosition(), 0);
      }
    }
  }, [disabled, isOpen, isMobile, updatePosition]);

  const handleClickOutside = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        selectRef.current &&
        contentRef.current &&
        !selectRef.current.contains(e.target as Node) &&
        !contentRef.current.contains(e.target as Node)
      ) {
        if (isMobile) {
          setIsAnimating(true);
          setShouldOpen(false);
          setTimeout(() => {
            setIsOpen(false);
            setIsAnimating(false);
          }, 300);
        } else {
          setIsOpen(false);
          setIsPositioned(false);
        }
      }
    },
    [isMobile]
  );

  const handleOverlayEvents = (
    e: React.MouseEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
  };

  const handleTouchEvents = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  useEffect(() => {
    if (!selectRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });

    resizeObserver.observe(selectRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updatePosition]);

  useEffect(() => {
    document.addEventListener("wheel", updatePosition);
    return () => {
      document.removeEventListener("wheel", updatePosition);
    };
  }, [updatePosition]);

  const contextValue: SelectContextValue = {
    selectedValue,
    setSelectedValue,
    isOpen,
    setIsOpen,
    placeholder,
    onValueChange,
  };

  const trigger = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== Select.Trigger) return null;

        const triggerNode = child as ReactElement<SelectTriggerProps>;
        return cloneElement(triggerNode, {
          ...triggerNode.props,
          onTriggerClick: handleTriggerClick,
        });
      })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children, handleTriggerClick]);

  const content = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== Select.Content) return null;

        const contentNode = child as ReactElement<SelectContentProps>;
        return contentNode;
      })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children]);

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={cn("relative", className)} ref={selectRef}>
        {trigger}
        {isOpen &&
          createPortal(
            isMobile ? (
              // Mobile drawer
              <div
                className="fixed inset-0 z-50 bg-[var(--overlay)] transition-opacity duration-200"
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
                    "w-full absolute overflow-hidden bottom-0 left-0 right-0 bg-[var(--bg-primary)] rounded-t-xl shadow-lg transform ease-in duration-300",
                    content?.props.className
                  )}
                  style={{
                    transformOrigin: "bottom center",
                    maxHeight: "calc(100vh - 4rem)",
                    transform: shouldOpen ? "translateY(0)" : "translateY(100%)",
                    transition: "transform 300ms ease-in",
                  }}
                  onClick={e => e.stopPropagation()}
                  data-type="select-content"
                  data-portaled
                  ref={contentRef}
                >
                  <div className="p-4">{content?.props.children}</div>
                </div>
              </div>
            ) : (
              // Desktop dropdown
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
                    "absolute z-50 bg-[var(--bg-primary)] rounded-md border border-[var(--border-primary)]",
                    "origin-top shadow-[0_4px_6px_-1px_rgba(0,0,0,.1),0_2px_4px_-2px_rgba(0,0,0,.1)]",
                    isAnimating && "animate-hide-scaled",
                    !isAnimating && "animate-show-scaled",
                    content?.props.className
                  )}
                  data-type="select-content"
                  data-portaled
                  ref={contentRef}
                  style={{
                    top: position.top,
                    left: position.left,
                    opacity: isPositioned ? 1 : 0,
                    visibility: isPositioned ? "visible" : "hidden",
                  }}
                >
                  {content?.props.children}
                </div>
              </div>
            ),
            document.body
          )}
      </div>
    </SelectContext.Provider>
  );
};

Select.Trigger = function SelectTrigger({
  children,
  className,
  placeholder,
  onTriggerClick,
  raw = false,
  ...props
}: SelectTriggerProps) {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error("Select.Trigger must be used within a Select component");
  }

  const { selectedValue, placeholder: contextPlaceholder } = context;

  // If children are provided, use them directly; otherwise find the selected item's display text
  const displayContent = useMemo(() => {
    // If children are explicitly provided to the trigger, use them
    if (children) {
      return children;
    }

    // Otherwise, try to find the selected item's display text from the Select.Content
    if (selectedValue) {
      // This is a fallback - we'd need to access the Select.Content children
      // Since we don't have direct access here, we'll just return the selectedValue
      return selectedValue;
    }

    return null;
  }, [children, selectedValue]);

  const shouldShowPlaceholder = !displayContent;

  return raw ? (
    <button type="button" onClick={onTriggerClick} className={className} {...props}>
      {children}
    </button>
  ) : (
    <button
      type="button"
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 text-left bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md shadow-sm",
        "hover:border-[var(--border-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
        className
      )}
      onClick={onTriggerClick}
      {...props}
    >
      <span className={cn(shouldShowPlaceholder && "text-slate-500")}>
        {displayContent || placeholder || contextPlaceholder}
      </span>
      <ChevronDown className="w-4 h-4 text-slate-400 ml-1 translate-x-1" />
    </button>
  );
};

Select.Content = function SelectContent({ children, className }: SelectContentProps) {
  return <div className={cn("py-1 max-h-60 overflow-auto", className)}>{children}</div>;
};

Select.Item = function SelectItem({
  children,
  value,
  className,
  disabled = false,
}: SelectItemProps) {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error("Select.Item must be used within a Select component");
  }

  const { selectedValue, setSelectedValue } = context;
  const isSelected = selectedValue === value;

  const handleClick = useCallback(() => {
    if (!disabled) {
      setSelectedValue(value);
    }
  }, [disabled, setSelectedValue, value]);

  return (
    <div
      className={cn(
        "px-3 py-2 text-sm cursor-pointer transition-colors",
        isSelected && "bg-blue-50 text-blue-700",
        !isSelected && !disabled && "text-slate-700 hover:bg-slate-100",
        disabled && "text-slate-400 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export default Select;
