import Button from "@notes/ui/button";
import { cn } from "@notes/utils/css-utils";
import { XIcon, Maximize, Minimize } from "lucide-react";

export type DialogControlsProps = {
  children?: React.ReactNode;
  className?: string;
  onClose?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  showFullscreenButton?: boolean;
  extraControls?: React.ReactNode;
};

const DialogControls: React.FC<DialogControlsProps> = ({
  children,
  className,
  onClose,
  onToggleFullscreen,
  isFullscreen = false,
  showFullscreenButton = false,
  extraControls,
}) => {
  if (children) {
    return (
      <button
        className={cn(
          "p-0.5 rounded-full text-[var(--text-primary)] hover:opacity-70 cursor-pointer",
          className
        )}
        onClick={() => onClose?.()}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {extraControls}
      {showFullscreenButton && (
        <Button
          icon={isFullscreen ? Minimize : Maximize}
          className="p-1"
          iconSize="5"
          onClick={() => onToggleFullscreen?.()}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          variant="plain"
        />
      )}
      <Button
        icon={XIcon}
        className="p-1"
        iconSize="5"
        onClick={() => onClose?.()}
        title="Close"
        variant="plain"
      />
    </div>
  );
};

export default DialogControls;
