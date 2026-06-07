
import { cn } from "@images/utils/css-utils";

interface SquareIconProps {
  className?: string;
  selection?: boolean;
}

const SquareIcon = ({ className = "", selection = false }: SquareIconProps) => {
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
      strokeDasharray={selection ? "4 4" : undefined}
    >
      <rect width="20" height="20" x="2" y="2" />
    </svg>
  );
};

export default SquareIcon;
