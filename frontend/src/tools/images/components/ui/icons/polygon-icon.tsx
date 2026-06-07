
import { cn } from "@images/utils/css-utils";

interface PolygonIconProps {
  className?: string;
  selection?: boolean;
}

const PolygonIcon = ({
  className = "",
  selection = false,
}: PolygonIconProps) => {
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
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <text
        x="12"
        y="14"
        textAnchor="middle"
        fontWeight="lighter"
        fontSize="10"
      >
        n
      </text>
    </svg>
  );
};

export default PolygonIcon;
