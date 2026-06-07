import { useState } from "react";

interface UseEditableTextAreaProps {
  value?: string;
  onValueChange?: (newValue?: string) => void;
}

export const useEditableTextArea = ({ value, onValueChange }: UseEditableTextAreaProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleClick = () => {
    setIsEditing(true);
    setEditedValue(value);
  };

  const handleSave = async () => {
    const newValue = editedValue?.trim();

    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    onValueChange?.(newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // For textarea, we want Ctrl+Enter or Cmd+Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return {
    isEditing,
    editedValue,
    setEditedValue,
    handleClick,
    handleSave,
    handleCancel,
    handleKeyDown,
  };
};
