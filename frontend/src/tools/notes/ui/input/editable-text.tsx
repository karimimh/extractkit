import { useEditableText } from "@notes/ui/input/useEditableText";
import React from "react";

interface EditableTextProps {
  value?: string;
  onValueChange?: (newValue?: string) => void;
  className?: string;
  editClassName?: string;
  placeholder?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  editDisabled?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({
  value,
  onValueChange,
  className = "text-2xl font-bold cursor-text rounded px-2 py-1 -mx-2 -my-1 min-h-10",
  editClassName = "text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0",
  placeholder = "",
  as: Component = "h2",
  editDisabled = false,
}) => {
  const { isEditing, editedValue, setEditedValue, handleClick, handleSave, handleKeyDown } =
    useEditableText({ value, onValueChange });

  if (isEditing) {
    return (
      <div className="flex-1 flex items-center gap-2">
        <input
          type="text"
          value={editedValue}
          onChange={e => setEditedValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          disabled={editDisabled}
          className={editClassName}
        />
      </div>
    );
  }

  return (
    <Component className={className} onClick={handleClick} title={placeholder}>
      {value || <span className="opacity-30">{placeholder}</span>}
    </Component>
  );
};

export default EditableText;
