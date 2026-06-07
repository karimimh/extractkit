import { useDialogScrollLock } from "@notes/hooks/use-dialog-scroll-lock";
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ANIMATION_DURATION } from "../constants";

interface HeroDialogProps {
  children?: ReactNode;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpenTimed: boolean;
  setIsOpenTimed: React.Dispatch<React.SetStateAction<boolean>>;
  triggerStyle: React.CSSProperties;
  triggerClassName?: string;
  dialogStyle: React.CSSProperties;
  onOpenChange?: (isOpen: boolean) => void;
  setIsHovered?: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface HeroDialogRef {
  handleOpenChange: (open: boolean) => void;
}

const HeroDialog = forwardRef<HeroDialogRef, HeroDialogProps>(
  (
    {
      children,
      triggerStyle,
      triggerClassName,
      dialogStyle,
      onOpenChange,
      isOpen,
      setIsOpen,
      isOpenTimed,
      setIsOpenTimed,
      setIsHovered,
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [triggerFrame, setTriggerFrame] = useState<DOMRect | null>(null);
    const mouseDownInsideContent = useRef(false);

    useImperativeHandle(ref, () => ({
      handleOpenChange,
    }));

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (open) {
          // Get trigger position for animation start
          if (triggerRef.current) {
            setTriggerFrame(triggerRef.current.getBoundingClientRect());
          }
          setIsOpen(true);
          onOpenChange?.(true);
        } else {
          setIsOpenTimed(false);
        }
        setIsAnimating(true);
        setTimeout(() => {
          setIsAnimating(false);
          if (open) {
            setIsOpenTimed(open);
          } else {
            setIsOpen(false);
            onOpenChange?.(false);
          }
        }, ANIMATION_DURATION);
      },
      [onOpenChange, setIsOpen, setIsOpenTimed]
    );

    const handleOpen = useCallback(() => {
      if (!isOpen) {
        handleOpenChange(true);
      }
    }, [isOpen, handleOpenChange]);

    const handleClose = useCallback(() => {
      if (isOpen && !isAnimating) {
        handleOpenChange(false);
      }
    }, [isOpen, isAnimating, handleOpenChange]);

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isAnimating && !mouseDownInsideContent.current) {
        handleClose();
      }
      mouseDownInsideContent.current = false;
    };

    const handleContentMouseDown = () => {
      mouseDownInsideContent.current = true;
    };

    const contentStyle = {
      ...dialogStyle,
      left:
        !isOpenTimed || typeof dialogStyle.width !== "number"
          ? triggerFrame?.x
          : `calc(50% - ${dialogStyle.width / 2}px)`,
      top:
        !isOpenTimed || typeof dialogStyle.height !== "number"
          ? triggerFrame?.top
          : `calc(50% - ${dialogStyle.height / 2}px)`,
      width: !isOpenTimed ? triggerStyle?.width : dialogStyle.width,
      height: !isOpenTimed ? triggerStyle?.height : dialogStyle.height,
    };

    useDialogScrollLock({ isOpen, onClose: handleClose });

    return (
      <>
        {/* Trigger */}
        {!isOpen && (
          <div
            className={
              triggerClassName ||
              "shadow-sm select-none transition-all duration-300 ease-out border-none hover:-translate-y-1 hover:shadow-lg"
            }
            onClick={handleOpen}
            role={"button"}
            tabIndex={0}
            style={triggerStyle}
            onKeyDown={handleTriggerKeyDown}
            onMouseEnter={() => setIsHovered?.(true)}
            onMouseLeave={() => setIsHovered?.(false)}
            ref={triggerRef}
          >
            {children}
          </div>
        )}

        {/* Trigger Placeholder - maintains layout space */}
        {isOpen && <div style={triggerStyle} aria-hidden="true" />}

        {/* Dialog */}
        {isOpen &&
          triggerFrame &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{
                backgroundColor: isOpenTimed ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0)",
                transition: `background-color ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
                touchAction: "none",
              }}
              onClick={handleBackdropClick}
            >
              <div
                ref={contentRef}
                className="shadow-2xl transition-all duration-300 ease-out absolute"
                role="dialog"
                aria-modal="true"
                tabIndex={0}
                style={contentStyle}
                onMouseDown={handleContentMouseDown}
              >
                {children}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

HeroDialog.displayName = "HeroDialog";

export default HeroDialog;
