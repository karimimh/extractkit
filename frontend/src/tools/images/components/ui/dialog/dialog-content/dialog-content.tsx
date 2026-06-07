"use client";

import { cn } from "@images/utils/css-utils";
import React, { useMemo } from "react";
import DialogContentFooter, { type DialogContentFooterProps } from "./dialog-footer";
import DialogContentHeader, { type DialogContentHeaderProps } from "./dialog-header";
import { useIsMobile } from "@images/hooks/common/use-is-mobile";
import DialogControls from "./dialog-controls";
import DialogExtraControls from "./dialog-extra-controls";

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  mobileVariant?: "drawer" | "fullscreen" | "modal";
  allowFullscreen?: boolean;
}

export interface DialogContentComp extends React.FC<DialogContentProps> {
  Header: React.FC<DialogContentHeaderProps>;
  Footer: React.FC<DialogContentFooterProps>;
  ExtraControls: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

const DialogContent: DialogContentComp = ({
  children,
  className,
  style,
  isOpen,
  onOpenChange,
  mobileVariant = "drawer",
  allowFullscreen = false,
}: DialogContentProps) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const header = useMemo(() => {
    const h = React.Children.toArray(children).find(
      child => React.isValidElement(child) && child.type === DialogContent.Header
    );
    if (!h) return null;
    return h;
  }, [children]);

  const footer = useMemo(() => {
    return React.Children.toArray(children).find(
      child => React.isValidElement(child) && child.type === DialogContent.Footer
    );
  }, [children]);

  const extraControls = useMemo(() => {
    return React.Children.toArray(children).find(
      child => React.isValidElement(child) && child.type === DialogContent.ExtraControls
    );
  }, [children]);

  const body = useMemo(() => {
    // return all children except header, footer and extra controls inside a jsx fragment
    return React.Children.toArray(children).filter(
      child =>
        typeof child === "string" ||
        (React.isValidElement(child) &&
          child.type !== DialogContent.Header &&
          child.type !== DialogContent.Footer &&
          child.type !== DialogContent.ExtraControls)
    );
  }, [children]);
  const isMobile = useIsMobile();

  const [shouldOpen, setShouldOpen] = React.useState(false);
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setShouldOpen(isOpen);
      }, 0);
    } else {
      setShouldOpen(false);
    }
  }, [isOpen]);

  if (isMobile && mobileVariant === "fullscreen") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 bg-white flex flex-col transition-opacity duration-300 dialog-content",
          shouldOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={style}
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <DialogControls
          onClose={() => onOpenChange?.(false)}
          extraControls={extraControls}
          className="absolute top-8 right-4 z-30 -translate-y-1/2"
        />
        <div
          className={cn("overflow-hidden relative flex flex-col items-stretch h-full", className)}
          onClick={e => e.stopPropagation()}
        >
          {header}
          <div className="flex-1 overflow-auto">{body}</div>
          {footer}
        </div>
      </div>
    );
  } else if (isMobile && mobileVariant === "drawer") {
    return (
      <div
        className={cn(
          "w-full absolute max-h-[100vh] overflow-auto top-full left-0 right-0 bg-[var(--bg-secondary)] rounded-t-xl shadow-lg transition-transform transform dialog-content",
          shouldOpen ? "-translate-y-full" : "translate-y-0"
        )}
        style={style}
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <DialogControls
          onClose={() => onOpenChange?.(false)}
          extraControls={extraControls}
          className="absolute top-8 right-4 z-30 -translate-y-1/2"
        />
        <div
          className={cn(
            "overflow-hidden relative rounded-lg flex flex-col items-stretch",
            className
          )}
          onClick={e => e.stopPropagation()}
        >
          {header}
          <div>{body}</div>
          {footer}
        </div>
      </div>
    );
  }

  // desktop layout or mobile modal:
  return (
    <div
      className={cn(
        "bg-white overflow-hidden relative flex flex-col items-stretch dialog-content transition-all duration-300",
        isFullscreen
          ? "z-50 rounded-none sm:h-full sm:w-full md:w-full lg:w-full xl:w-full"
          : "rounded-2xl sm:h-[80vh] w-full sm:w-[38rem] md:w-[46rem] lg:w-[62rem] xl:w-[78rem]",
        isOpen ? "animate-show-scaled" : "animate-hide-scaled",
        className
      )}
      style={style}
      onClick={e => e.stopPropagation()}
      role="dialog"
    >
      <DialogControls
        onClose={() => onOpenChange?.(false)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        showFullscreenButton={allowFullscreen}
        extraControls={extraControls}
        className="absolute top-8 right-4 z-30 -translate-y-1/2"
      />
      <div className="overflow-y-auto flex flex-col items-stretch h-full">
        {header}
        {body}
        {footer}
      </div>
    </div>
  );
};

DialogContent.Header = DialogContentHeader;
DialogContent.Footer = DialogContentFooter;
DialogContent.ExtraControls = DialogExtraControls;
export default DialogContent;
