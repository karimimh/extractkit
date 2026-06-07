
import { cn } from "@images/utils/css-utils";
import { ReactNode, useState } from "react";
import Popover from "./popover";

interface DropdownProps {
  trigger: { id: string; node: ReactNode };
  items: { id: string; node: ReactNode }[];
  onSelect?: (id?: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  className?: string;
}

const Dropdown = ({
  items,
  trigger,
  onSelect,
  contentClassName,
  triggerClassName,
  itemClassName,
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover
      className={cn("", className)}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      horizontalContentAlignment="left"
    >
      <Popover.Trigger className={cn(triggerClassName)}>{trigger.node}</Popover.Trigger>
      <Popover.Content className={cn("rounded-md", contentClassName)}>
        {items.map(({ id, node }) => (
          <div
            className={cn(
              "bg-white text-sm px-2 py-1 cursor-pointer w-full hover:bg-slate-100 flex items-center border-b last:border-b-transparent first:rounded-t-md last:rounded-b-md",
              id === trigger.id && "bg-slate-100",
              itemClassName
            )}
            key={id}
            onClick={() => {
              setIsOpen(false);
              if (id === trigger.id) {
                onSelect?.(undefined);
              } else {
                onSelect?.(id);
              }
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
