import { cn } from "@notes/utils/css-utils";
import React, { useEffect, useRef } from "react";
import { useEditableTextArea } from "./useEditableTextArea";

interface EditableTextAreaProps {
  value?: string;
  onValueChange?: (newValue?: string) => void;
  className?: string;
  textareaClassName?: string;
  placeholder?: string;
  editDisabled?: boolean;
  renderContent?: (content: string) => React.ReactNode;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  value,
  onValueChange,
  className,
  textareaClassName,
  placeholder = "Click to edit content",
  editDisabled = false,
  renderContent,
}) => {
  const { isEditing, editedValue, setEditedValue, handleClick, handleSave, handleKeyDown } =
    useEditableTextArea({ value, onValueChange });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = "auto";

      const style = window.getComputedStyle(textarea);
      const borderHeight = parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);

      const newHeight = textarea.scrollHeight + borderHeight;
      textareaRef.current.style.height = `${Math.max(newHeight, 20)}px`;
    }
  }, [editedValue, isEditing]);

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editedValue}
        onChange={e => setEditedValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        autoFocus
        disabled={editDisabled}
        className={cn(
          "block text-base leading-relaxed rounded w-full resize-none border-0 outline-none focus:ring-0 focus:outline-none focus:border-0 space-y-0",
          textareaClassName
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      className={cn(
        "cursor-text rounded text-base leading-relaxed whitespace-pre-wrap block",
        className
      )}
      onClick={handleClick}
      title={placeholder}
    >
      {renderContent ? renderContent(value || "") : value}
    </div>
  );
};

export default EditableTextArea;
