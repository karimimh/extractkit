import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface UseContextMenuOptions {
  renderMenu: (closeMenu: () => void) => ReactNode;
}

export function useContextMenu({ renderMenu }: UseContextMenuOptions) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsVisible(true);
  };

  const closeMenu = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside as any);
    } else {
      document.removeEventListener("mousedown", handleClickOutside as any);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as any);
    };
  }, [isVisible]);

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

  return { ContextMenu, handleContextMenu };
}
