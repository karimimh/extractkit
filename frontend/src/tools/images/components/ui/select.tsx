
import { cn } from "@images/utils/css-utils";
import { ChevronDown } from "lucide-react";
import { ReactNode, useState } from "react";
import Popover from "./popover";

interface SelectProps {
  trigger: string | ReactNode;
  items: string[];
  onSelect?: (value?: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
  className?: string;
}

const Select = ({
  items,
  trigger,
  onSelect,
  contentClassName,
  triggerClassName,
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover
      className={cn("", className)}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      horizontalContentAlignment="left"
    >
      <Popover.Trigger
        className={cn(
          "border border-[#d4d4d8] rounded-md h-7 w-full bg-white gap-1 flex justify-between items-center pl-2 pr-1",
          "focus:outline focus:outline-[3] focus:outline-slate-200/70 focus:border-gray-400",
          triggerClassName
        )}
      >
        <div className="max-w-[calc(100%-1rem)] truncate">{trigger}</div>
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-150 transform",
            isOpen && "rotate-180",
            !isOpen && "rotate-0"
          )}
        />
      </Popover.Trigger>
      <Popover.Content className={cn("border border-[#d4d4d8] rounded-md", contentClassName)}>
        {items.map(item => (
          <div
            className={cn(
              "bg-white text-sm h-7 px-2 py-1 cursor-pointer w-full hover:bg-slate-100 flex items-center border-b last:border-b-transparent first:rounded-t-md last:rounded-b-md",
              item === trigger && "bg-slate-100"
            )}
            key={item}
            onClick={() => {
              setIsOpen(false);
              if (item === trigger) {
                onSelect?.(undefined);
              } else {
                onSelect?.(item);
              }
            }}
          >
            {item}
          </div>
        ))}
      </Popover.Content>
    </Popover>
  );
};

export default Select;
