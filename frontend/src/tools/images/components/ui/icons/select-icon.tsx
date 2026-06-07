
import { ColorStyle } from "@images/types/colorization-types";
import { cn } from "@images/utils/css-utils";

interface SelectIconProps {
  fillColor?: ColorStyle;
  className?: string;
}

const SelectIcon = ({ fillColor, className = "" }: SelectIconProps) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={"4 4"}
    >
      <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </svg>
  );
};

export default SelectIcon;
