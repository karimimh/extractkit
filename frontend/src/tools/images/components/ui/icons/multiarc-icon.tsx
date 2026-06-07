
import { cn } from "@images/utils/css-utils";

interface MultiArcIconProps {
  className?: string;
}

const MultiArcIcon = ({
  className = "",
}: MultiArcIconProps) => {
  return (
    <svg
      className={cn("w-6 h-6", className)}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 1C20.9999 21 1.00013 1 1.00014 21" strokeLinecap="round" />
    </svg>
  );
};

export default MultiArcIcon;
