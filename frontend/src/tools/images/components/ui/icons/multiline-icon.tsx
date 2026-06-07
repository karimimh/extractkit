
import { cn } from "@images/utils/css-utils";

interface MultiLineIconProps {
  className?: string;
}

const MultiLineIcon = ({
  className = "",
}: MultiLineIconProps) => {
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
      <path
        d="M1 1L7.5 20L13 1L20.5 20"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(2, 2)"
      />
    </svg>
  );
};

export default MultiLineIcon;
