import {
  type MouseEvent,
  type TouchEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface UseContextMenuOptions {
  renderMenu: (closeMenu: () => void) => ReactNode;
  longPressDuration?: number; // Duration in ms for long press on mobile
}

export function useContextMenu({ renderMenu, longPressDuration = 500 }: UseContextMenuOptions) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate viewport-aware position to prevent menu from going off-screen
  const calculatePosition = (x: number, y: number) => {
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 300; // Approximate menu height
    const padding = 10; // Padding from viewport edge

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }
    if (adjustedX < padding) {
      adjustedX = padding;
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - menuHeight - padding;
    }
    if (adjustedY < padding) {
      adjustedY = padding;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const showMenu = (x: number, y: number) => {
    const adjustedPosition = calculatePosition(x, y);
    setPosition(adjustedPosition);
    setIsVisible(true);
  };

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    showMenu(event.clientX, event.clientY);
  };

  // Touch event handlers for mobile long-press
  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;

    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    // Start long press timer
    longPressTimerRef.current = window.setTimeout(() => {
      if (touchStartRef.current) {
        event.preventDefault();
        showMenu(touchStartRef.current.x, touchStartRef.current.y);
      }
    }, longPressDuration);
  };

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch || !touchStartRef.current) return;

    // Cancel long press if finger moved too much
    const moveThreshold = 10; // pixels
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    if (dx > moveThreshold || dy > moveThreshold) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      touchStartRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    // Clear timer if touch ended before long press completed
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
  };

  const closeMenu = () => {
    setIsVisible(false);
  };

  // Handle clicks/touches outside menu
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isVisible]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const ContextMenu = isVisible
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: position.y,
            left: position.x,
            zIndex: 1000,
          }}
        >
          {renderMenu(closeMenu)}
        </div>,
        document.body
      )
    : null;

  return {
    ContextMenu,
    handleContextMenu,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
