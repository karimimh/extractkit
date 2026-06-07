"use client";

import { cn } from "@notes/utils/css-utils";
import { type ReactNode, useState } from "react";
import Popover from "./popover";

interface DropdownProps {
  trigger: ReactNode;
  items: { id: string; node: ReactNode }[];
  onSelect?: (id?: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  className?: string;
  horizontalContentAlignment?: "left" | "center" | "right";
}

const Dropdown = ({
  items,
  trigger,
  onSelect,
  contentClassName,
  triggerClassName,
  itemClassName,
  className,
  horizontalContentAlignment = "left",
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover
      className={cn(className)}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      horizontalContentAlignment={horizontalContentAlignment}
    >
      <Popover.Trigger className={cn("rounded-md", isOpen && "bg-slate-100", triggerClassName)}>
        {trigger}
      </Popover.Trigger>
      <Popover.Content
        className={cn(
          "rounded-md shadow-md border border-slate-100 -translate-y-1",
          contentClassName
        )}
      >
        {items.map(({ id, node }) => (
          <div
            className={cn(
              "bg-white text-sm px-2 py-1 cursor-pointer w-full hover:bg-gray-50 flex items-center first:rounded-t-md last:rounded-b-md",
              itemClassName
            )}
            key={id}
            onClick={() => {
              setIsOpen(false);
              onSelect?.(id);
            }}
          >
            {node}
          </div>
        ))}
      </Popover.Content>
    </Popover>
  );
};

export default Dropdown;
