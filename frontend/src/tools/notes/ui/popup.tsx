import { cn } from "@notes/utils/css-utils";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

interface PopupProps {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  triggerButton: HTMLButtonElement | null;
}

export default function Popup({
  children,
  className = "",
  isOpen,
  setIsOpen,
  triggerButton,
}: PopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!triggerButton) return;
    const rect = triggerButton.getBoundingClientRect();
    setPopupPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
  }, [isOpen, setIsOpen, triggerButton]);

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  return isOpen ? (
    <div
      className={cn("fixed border shadow bg-white p-2 no-scrollbar", className)}
      ref={popupRef}
      style={{ top: popupPosition.top, left: popupPosition.left, zIndex: 1000 }}
    >
      {children}
    </div>
  ) : (
    <></>
  );
}
