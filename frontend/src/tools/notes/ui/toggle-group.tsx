"use client";

import { cn } from "@notes/utils/css-utils";
import { type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "./button";

interface ToggleGroupProps {
  items: { icon: LucideIcon }[];
  selectedIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
}

const ToggleGroup = ({ items, selectedIndex = 0, onChange, className }: ToggleGroupProps) => {
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);
  return (
    <div className={cn("rounded-md flex items-center bg-white h-9", className)}>
      {items.map((item, index) => (
        <Button
          key={index}
          className={cn(
            "min-w-5 flex-1 h-full border-t border-b border-r border-[#d4d4d8] flex items-center justify-center",
            index === 0 && "rounded-l-md border-l",
            index === items.length - 1 && "rounded-r-md",
            activeIndex === index ? "bg-slate-100 text-black" : "bg-transparent text-gray-400"
          )}
          icon={item.icon}
          iconSize="4"
          onClick={() => {
            setActiveIndex(index);
            onChange?.(index);
          }}
        />
      ))}
    </div>
  );
};

export default ToggleGroup;
