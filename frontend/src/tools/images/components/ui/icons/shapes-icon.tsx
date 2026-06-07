import { cn } from "@images/utils/css-utils";

interface ShapesIconProps {
  className?: string;
  selection?: boolean;
}

const ShapesIcon = ({ className = "", selection = false }: ShapesIconProps) => {
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
      strokeDasharray={selection ? "3 3" : undefined}
    >
      <rect x="2" y="2" width="8" height="8" rx="2" />
      <circle cx="18" cy="6" r="4" />
      <path d="M13 21L15.5716 14L19.4286 21L22 14" strokeLinecap="round" strokeLinejoin="round" />
      <path
        transform="translate(-1, 0)"
        d="M6.5 13.2361L10.5552 16.1824L9.00628 20.9496H3.99372L2.44476 16.1824L6.5 13.2361Z"
      />
    </svg>
  );
};

export default ShapesIcon;
