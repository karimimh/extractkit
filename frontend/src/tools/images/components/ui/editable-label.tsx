import InputXC from "@images/components/ui/input/input-xc";
import { cn } from "@images/utils/css-utils";
import { ReactPortal, useEffect, useRef } from "react";

interface EditableLabelProps {
  isEditing?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
  text?: string;
  onTextChange?: (text: string) => void;
  className?: string;
  onClick?: () => void;
  ContextMenu?: ReactPortal | null;
  handleContextMenu?: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
}

const EditableLabel = ({
  isEditing = false,
  setIsEditing,
  text,
  onTextChange,
  className,
  onClick,
  ContextMenu,
  handleContextMenu,
}: EditableLabelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleApply = (text?: string | number) => {
    const trimmedText = text?.toString().trim();
    if (trimmedText && trimmedText.length > 0) onTextChange?.(trimmedText);
    setIsEditing?.(false);
  };
  const handleCancel = () => setIsEditing?.(false);

  return isEditing ? (
    <InputXC
      initialText={text}
      onApply={handleApply}
      onCancel={handleCancel}
      ref={inputRef}
    />
  ) : (
    <>
      <div
        className={cn(className)}
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        {text}
      </div>
      {ContextMenu}
    </>
  );
};

export default EditableLabel;
