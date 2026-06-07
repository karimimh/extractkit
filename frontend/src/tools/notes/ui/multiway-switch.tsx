import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@notes/utils/css-utils";

export interface MultiwayItem {
  value: string;
  icon?: LucideIcon;
  title?: string;
}

export interface MultiwaySwitchProps {
  items: MultiwayItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  itemClassName?: string;
}

const MultiwaySwitch: React.FC<MultiwaySwitchProps> = ({
  items,
  value,
  onChange,
  className,
  size = "md",
  itemClassName,
}) => {
  const sizeStyles = {
    sm: {
      container: "h-7",
      button: "px-2 py-1 text-xs",
      icon: "h-3 w-3",
    },
    md: {
      container: "h-8",
      button: "px-3 py-1.5 text-sm",
      icon: "h-4 w-4",
    },
    lg: {
      container: "h-10",
      button: "px-2 py-2 text-base",
      icon: "h-5 w-5",
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <div className={cn("inline-flex rounded-md p-0.5", className)}>
      {items.map((item, index) => {
        const isSelected = value === item.value;
        const Icon = item.icon;

        // Validate that at least one of icon or title is provided
        if (!Icon && !item.title) {
          console.warn(`MultiwaySwitch: Item at index ${index} has neither icon nor title`);
          return null;
        }

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 transition-all duration-200 font-medium cursor-pointer rounded-md",
              currentSize.button,
              isSelected ? "bg-blue-100 text-blue-600" : "text-gray-600",
              itemClassName
            )}
            title={item.title || item.value}
          >
            {Icon && <Icon className={cn(currentSize.icon, "flex-shrink-0")} />}
            {item.title && <span className="whitespace-nowrap">{item.title}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default MultiwaySwitch;
