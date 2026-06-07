import { useState } from "react";

interface UseEditableTextProps {
  value?: string;
  onValueChange?: (newValue?: string) => void;
}

export const useEditableText = ({ value, onValueChange }: UseEditableTextProps) => {
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
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
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
