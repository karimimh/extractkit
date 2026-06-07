import React from "react";
import Dialog from "./dialog/dialog";
import Button from "./button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "warning" | "info";
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "danger",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconColor: "text-red-500",
          confirmVariant: "cancel" as const,
        };
      case "warning":
        return {
          iconColor: "text-yellow-500",
          confirmVariant: "apply" as const,
        };
      case "info":
        return {
          iconColor: "text-blue-500",
          confirmVariant: "main" as const,
        };
      default:
        return {
          iconColor: "text-red-500",
          confirmVariant: "cancel" as const,
        };
    }
  };

  const { iconColor, confirmVariant } = getVariantStyles();

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} mobileVariant="modal">
      <Dialog.Content className="mx-2 max-w-md h-fit sm:h-fit">
        <Dialog.Content.Header>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </Dialog.Content.Header>

        <div className="py-4 px-4">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        <Dialog.Content.Footer>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" text={cancelText} onClick={handleCancel} />
            <Button variant={confirmVariant} text={confirmText} onClick={handleConfirm} />
          </div>
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ConfirmationDialog;
