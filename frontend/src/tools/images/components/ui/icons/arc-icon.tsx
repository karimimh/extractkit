
import { cn } from "@images/utils/css-utils";

interface ArcIconProps {
  className?: string;
}

const ArcIcon = ({ className = "" }: ArcIconProps) => {
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
      <path d="M4 20A15 15 0 0 0 20 4" strokeLinecap="round" />
    </svg>
  );
};

export default ArcIcon;
