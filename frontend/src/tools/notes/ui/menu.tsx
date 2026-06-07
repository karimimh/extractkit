"use client";

import { cn } from "@notes/utils/css-utils";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface MenuItem {
  id: string;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  children?: MenuItem[];
  separator?: boolean;
  checked?: boolean;
}

interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  title?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  itemClassName?: string;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  offset?: number;
}

interface SubMenuProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  onClose: () => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
  side?: "right" | "left";
  className?: string;
  itemClassName?: string;
}

interface MenuItemComponentProps {
  item: MenuItem;
  onItemClick: (item: MenuItem) => void;
  onClose: () => void;
  onSubmenuClick?: (item: MenuItem) => void;
  className?: string;
  hasChildren?: boolean;
}

const MenuItemComponent = ({
  item,
  onItemClick,
  onClose,
  onSubmenuClick,
  className,
  hasChildren,
}: MenuItemComponentProps) => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [subMenuSide, setSubMenuSide] = useState<"right" | "left">("right");
  const itemRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const handleMouseEnter = useCallback(() => {
    if (!hasChildren || isMobile) return;

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Determine which side to show the submenu
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const spaceOnRight = windowWidth - rect.right;
      const spaceOnLeft = rect.left;

      // Show on left if there's not enough space on the right
      setSubMenuSide(spaceOnRight < 200 && spaceOnLeft > 200 ? "left" : "right");
    }

    // Small delay before showing submenu
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSubMenu(true);
    }, 150);
  }, [hasChildren, isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;

    // Clear timeout if mouse leaves before submenu shows
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Delay before hiding to allow moving to submenu
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSubMenu(false);
    }, 150);
  }, [isMobile]);

  const handleClick = useCallback(() => {
    // Clear any pending mouse leave timeouts to prevent interference
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (!hasChildren) {
      onItemClick(item);
      onClose();
    } else if (isMobile && onSubmenuClick) {
      // On mobile, clicking a submenu item should navigate to the submenu
      onSubmenuClick(item);
    } else if (isMobile) {
      // Fallback: show submenu overlay (old behavior)
      setShowSubMenu(true);
    }
  }, [item, onItemClick, onClose, hasChildren, isMobile, onSubmenuClick]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (item.separator) {
    return <div className="h-px bg-[var(--border-primary)] my-1" />;
  }

  return (
    <div
      ref={itemRef}
      className={cn(
        "relative flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors",
        item.disabled
          ? "text-[var(--text-tertiary)] cursor-not-allowed"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 flex-1">
        {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
        <span className="flex-1">{item.label}</span>
      </div>

      {item.checked !== undefined && (
        <Check
          className={cn(
            "w-4 h-4 ml-2",
            item.checked ? "text-[var(--text-secondary)]" : "opacity-0"
          )}
        />
      )}
      {hasChildren && <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] ml-2" />}

      {hasChildren && showSubMenu && item.children && !isMobile && (
        <SubMenu
          items={item.children}
          onItemClick={onItemClick}
          onClose={onClose}
          parentRef={itemRef}
          side={subMenuSide}
          className={className}
          itemClassName={className}
        />
      )}
    </div>
  );
};

const SubMenu = ({
  items,
  onItemClick,
  onClose,
  parentRef,
  side = "right",
  className,
  itemClassName,
}: SubMenuProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (parentRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Estimate submenu dimensions
      const estimatedMenuWidth = 192; // min-w-48
      const estimatedMenuHeight = items.length * 40;

      let top = parentRect.top;
      let left = side === "right" ? parentRect.right : parentRect.left - estimatedMenuWidth;

      // On mobile, center the submenu on screen
      if (isMobile) {
        const centerX = windowWidth / 2;
        const centerY = windowHeight / 2;

        left = centerX - estimatedMenuWidth / 2;
        top = centerY - estimatedMenuHeight / 2;

        // Ensure submenu stays within screen bounds
        if (left < 8) left = 8;
        if (left + estimatedMenuWidth > windowWidth - 8) {
          left = windowWidth - estimatedMenuWidth - 8;
        }
        if (top < 8) top = 8;
        if (top + estimatedMenuHeight > windowHeight - 8) {
          top = windowHeight - estimatedMenuHeight - 8;
        }
      } else {
        // Desktop positioning logic
        // Adjust vertical position if submenu would go off screen
        if (top + estimatedMenuHeight > windowHeight) {
          top = Math.max(0, windowHeight - estimatedMenuHeight);
        }

        // Adjust horizontal position if submenu would go off screen
        if (left < 0) {
          left = parentRect.right;
        } else if (left + estimatedMenuWidth > windowWidth) {
          left = parentRect.left - estimatedMenuWidth;
        }
      }

      setPosition({ top, left });

      // After setting initial position, refine it with actual dimensions
      if (subMenuRef.current) {
        requestAnimationFrame(() => {
          if (parentRef.current && subMenuRef.current) {
            const parentRect = parentRef.current.getBoundingClientRect();
            const subMenuRect = subMenuRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;

            let refinedTop = isMobile ? windowHeight / 2 - subMenuRect.height / 2 : parentRect.top;
            let refinedLeft = isMobile
              ? windowWidth / 2 - subMenuRect.width / 2
              : side === "right"
                ? parentRect.right
                : parentRect.left - subMenuRect.width;

            if (isMobile) {
              // Mobile: keep centered but within bounds
              if (refinedLeft < 8) refinedLeft = 8;
              if (refinedLeft + subMenuRect.width > windowWidth - 8) {
                refinedLeft = windowWidth - subMenuRect.width - 8;
              }
              if (refinedTop < 8) refinedTop = 8;
              if (refinedTop + subMenuRect.height > windowHeight - 8) {
                refinedTop = windowHeight - subMenuRect.height - 8;
              }
            } else {
              // Desktop: adjust position if submenu would go off screen
              if (refinedTop + subMenuRect.height > windowHeight) {
                refinedTop = Math.max(0, windowHeight - subMenuRect.height);
              }

              if (refinedLeft < 0) {
                refinedLeft = parentRect.right;
              } else if (refinedLeft + subMenuRect.width > windowWidth) {
                refinedLeft = parentRect.left - subMenuRect.width;
              }
            }

            setPosition({ top: refinedTop, left: refinedLeft });
            setIsPositioned(true);
          }
        });
      }
    }
  }, [parentRef, side, items.length, isMobile]);

  const handleMouseEnter = useCallback(() => {
    // Keep submenu open when hovering over it
  }, []);

  const handleMouseLeave = useCallback(() => {
    // This will be handled by the parent item
  }, []);

  return createPortal(
    <>
      {isMobile && <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />}
      <div
        ref={subMenuRef}
        className={cn(
          "fixed bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-lg py-1",
          isMobile ? "z-50 min-w-64" : "z-50 min-w-48",
          isPositioned ? "opacity-100" : "opacity-0",
          className
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={e => e.stopPropagation()}
        data-menu-element="true"
      >
        {items.map(item => (
          <MenuItemComponent
            key={item.id}
            item={item}
            onItemClick={onItemClick}
            onClose={onClose}
            onSubmenuClick={undefined} // Desktop submenus don't use this
            className={cn(isMobile ? "px-4 py-3 text-base" : "", itemClassName)}
            hasChildren={!!item.children?.length}
          />
        ))}
      </div>
    </>,
    document.body
  );
};

const Menu = ({
  trigger,
  items,
  title,
  className,
  triggerClassName,
  menuClassName,
  itemClassName,
  placement = "bottom-start",
  offset = 4,
}: MenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);
  const [menuStack, setMenuStack] = useState<{ items: MenuItem[]; title?: string }[]>([]);
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0 };

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Estimate menu dimensions (will be refined after render)
    const estimatedMenuWidth = 192; // min-w-48 = 12rem = 192px
    const estimatedMenuHeight = items.length * 40; // Rough estimate

    let top = 0;
    let left = 0;

    switch (placement) {
      case "bottom-start":
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
      case "bottom-end":
        top = triggerRect.bottom + offset;
        left = triggerRect.right - estimatedMenuWidth;
        break;
      case "top-start":
        top = triggerRect.top - estimatedMenuHeight - offset;
        left = triggerRect.left;
        break;
      case "top-end":
        top = triggerRect.top - estimatedMenuHeight - offset;
        left = triggerRect.right - estimatedMenuWidth;
        break;
    }

    // Adjust if menu would go off screen
    if (left + estimatedMenuWidth > windowWidth) {
      left = windowWidth - estimatedMenuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + estimatedMenuHeight > windowHeight) {
      top = triggerRect.top - estimatedMenuHeight - offset;
    }
    if (top < 8) {
      top = triggerRect.bottom + offset;
    }

    return { top, left };
  }, [placement, offset, items.length]);

  const refinePosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "bottom-start":
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
      case "bottom-end":
        top = triggerRect.bottom + offset;
        left = triggerRect.right - menuRect.width;
        break;
      case "top-start":
        top = triggerRect.top - menuRect.height - offset;
        left = triggerRect.left;
        break;
      case "top-end":
        top = triggerRect.top - menuRect.height - offset;
        left = triggerRect.right - menuRect.width;
        break;
    }

    // Adjust if menu would go off screen
    if (left + menuRect.width > windowWidth) {
      left = windowWidth - menuRect.width - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + menuRect.height > windowHeight) {
      top = triggerRect.top - menuRect.height - offset;
    }
    if (top < 8) {
      top = triggerRect.bottom + offset;
    }

    setPosition({ top, left });
    setIsPositioned(true);
  }, [placement, offset]);

  const handleTriggerClick = useCallback(() => {
    if (isClosing) return; // Prevent interaction while closing

    if (!isOpen) {
      // Calculate initial position before opening
      const initialPosition = calculatePosition();
      setPosition(initialPosition);
      setIsPositioned(false);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setIsPositioned(false);
    }
  }, [isOpen, calculatePosition, isClosing]);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
    }
  }, []);

  const handleSubmenuClick = useCallback(
    (item: MenuItem) => {
      if (isMobile && item.children && item.children.length > 0) {
        // Add current submenu to stack
        setMenuStack(prev => [...prev, { items: item.children!, title: item.label as string }]);
        setCurrentMenuIndex(prev => prev + 1);
      }
    },
    [isMobile]
  );

  const handleBackClick = useCallback(() => {
    if (currentMenuIndex > 0) {
      setMenuStack(prev => prev.slice(0, -1));
      setCurrentMenuIndex(prev => prev - 1);
    }
  }, [currentMenuIndex]);

  const handleClose = useCallback(() => {
    if (isClosing) return; // Prevent multiple close attempts

    if (isMobile && shouldOpen) {
      // On mobile, first trigger the slide-down animation
      setIsClosing(true);
      setShouldOpen(false);
      // Then close the menu after the animation completes
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        // Reset menu stack when closing
        setMenuStack([]);
        setCurrentMenuIndex(0);
      }, 300); // Match the transition duration
    } else {
      // Desktop or menu already closed
      setIsOpen(false);
      setShouldOpen(false);
      setIsClosing(false);
      // Reset menu stack when closing
      setMenuStack([]);
      setCurrentMenuIndex(0);
    }
  }, [isMobile, shouldOpen, isClosing]);

  // Initialize menu stack with root items
  useEffect(() => {
    if (isOpen && menuStack.length === 0) {
      setMenuStack([{ items, title }]);
    }
  }, [isOpen, items, menuStack.length, title]);

  const currentMenu = menuStack[currentMenuIndex] || { items, title };

  // Measure and animate drawer height when content changes
  useEffect(() => {
    if (!isMobile || !contentRef.current || !shouldOpen) return;

    const measureHeight = () => {
      if (contentRef.current) {
        const newHeight = contentRef.current.scrollHeight;
        setDrawerHeight(newHeight);
      }
    };

    // Measure height after content changes
    const timer = setTimeout(measureHeight, 0);
    return () => clearTimeout(timer);
  }, [currentMenuIndex, menuStack, isMobile, shouldOpen]);

  // Reset drawer height when closing
  useEffect(() => {
    if (!shouldOpen && isMobile) {
      setDrawerHeight(undefined);
    }
  }, [shouldOpen, isMobile]);

  // Handle mobile drawer animation timing
  useEffect(() => {
    if (isOpen && isMobile) {
      setTimeout(() => {
        setShouldOpen(true);
      }, 0);
    } else if (!isOpen) {
      setShouldOpen(false);
    }
  }, [isOpen, isMobile]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is on trigger
      if (triggerRef.current?.contains(target)) {
        return;
      }

      // Check if click is on main menu
      if (menuRef.current?.contains(target)) {
        return;
      }

      // Check if click is on any menu element (including submenus)
      const clickedElement = target as Element;
      if (clickedElement?.closest?.('[data-menu-element="true"]')) {
        return;
      }

      handleClose();
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, handleClose]);

  // Calculate position when menu opens (desktop only)
  useEffect(() => {
    if (isOpen && menuRef.current && !isMobile) {
      // Refine position after menu is rendered with actual dimensions
      requestAnimationFrame(() => {
        refinePosition();
      });
    }
  }, [isOpen, refinePosition, isMobile]);

  // Recalculate position on window resize (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleResize = () => {
      refinePosition();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, refinePosition, isMobile]);

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={cn(
          "cursor-pointer transition-colors",
          isOpen && "bg-[var(--bg-secondary)]",
          triggerClassName
        )}
      >
        {trigger}
      </div>

      {isOpen && (
        <>
          {isMobile
            ? // Mobile drawer
              createPortal(
                <div
                  className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200"
                  style={{
                    opacity: shouldOpen ? 1 : 0,
                  }}
                  onClick={handleClose}
                >
                  <div
                    ref={menuRef}
                    className={cn(
                      "w-full absolute overflow-hidden bottom-0 left-0 right-0 bg-[var(--bg-secondary)] rounded-t-xl shadow-lg transform ease-in duration-200",
                      menuClassName
                    )}
                    style={{
                      transformOrigin: "bottom center",
                      height: drawerHeight ? `${drawerHeight}px` : "auto",
                      maxHeight: "calc(100vh - 4rem)",
                      transform: shouldOpen ? "translateY(0)" : "translateY(100%)",
                      transition: drawerHeight
                        ? "height 200ms ease-in, transform 200ms ease-in"
                        : "transform 200ms ease-in",
                    }}
                    onClick={e => e.stopPropagation()}
                    data-menu-element="true"
                  >
                    <div ref={contentRef} className="flex flex-col">
                      {/* Header with back button and title */}
                      <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                        <div className="flex items-center justify-between">
                          {currentMenuIndex > 0 && (
                            <button
                              onClick={handleBackClick}
                              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <ChevronLeft className="size-4" />
                              <span className="text-sm font-medium">Back</span>
                            </button>
                          )}
                          {currentMenuIndex === 0 && !currentMenu.title && (
                            <div className="w-12 h-1 bg-[var(--border-secondary)] rounded-full mx-auto" />
                          )}
                          {currentMenu.title && (
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mx-auto">
                              {currentMenu.title}
                            </h3>
                          )}
                        </div>
                      </div>

                      {/* Menu items with slide transition */}
                      <div className="relative overflow-hidden">
                        <div
                          className="flex transition-transform duration-200 ease-in"
                          style={{
                            transform: `translateX(-${currentMenuIndex * 100}%)`,
                          }}
                        >
                          {menuStack.map((menu, index) => (
                            <div
                              key={index}
                              className="w-full flex-shrink-0 py-1"
                              style={{ minWidth: "100%" }}
                            >
                              {menu.items.map(item => (
                                <MenuItemComponent
                                  key={item.id}
                                  item={item}
                                  onItemClick={handleItemClick}
                                  onClose={handleClose}
                                  onSubmenuClick={handleSubmenuClick}
                                  className={cn(
                                    "px-4 py-3 text-base", // Larger touch targets for mobile
                                    itemClassName
                                  )}
                                  hasChildren={!!item.children?.length}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )
            : // Desktop menu
              createPortal(
                <div
                  ref={menuRef}
                  className={cn(
                    "fixed z-40 min-w-48 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-lg py-1 transition-all duration-100 ease-in",
                    isPositioned ? "opacity-100 scale-100" : "opacity-0 scale-95",
                    menuClassName
                  )}
                  style={{
                    top: position.top,
                    left: position.left,
                  }}
                  data-menu-element="true"
                >
                  {items.map(item => (
                    <MenuItemComponent
                      key={item.id}
                      item={item}
                      onItemClick={handleItemClick}
                      onClose={handleClose}
                      onSubmenuClick={handleSubmenuClick}
                      className={itemClassName}
                      hasChildren={!!item.children?.length}
                    />
                  ))}
                </div>,
                document.body
              )}
        </>
      )}
    </div>
  );
};

export default Menu;
