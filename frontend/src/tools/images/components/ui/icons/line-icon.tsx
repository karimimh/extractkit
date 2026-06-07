
import { cn } from "@images/utils/css-utils";

interface LineIconProps {
  className?: string;
  selection?: boolean;
}

const LineIcon = ({ className = "", selection = false }: LineIconProps) => {
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
      <path d="M2 12L22 12" strokeLinecap="round" />
    </svg>
  );
};

export default LineIcon;
