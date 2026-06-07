
import { cn } from "@images/utils/css-utils";

interface EllipseIconProps {
  className?: string;
  selection?: boolean;
}

const EllipseIcon = ({
  className = "",
  selection = false,
}: EllipseIconProps) => {
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
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  );
};

export default EllipseIcon;
