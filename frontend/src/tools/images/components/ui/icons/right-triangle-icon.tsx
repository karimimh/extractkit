
import { cn } from "@images/utils/css-utils";

interface RightTriangleIconProps {
  className?: string;
}

const RightTriangleIcon = ({
  className = "",
}: RightTriangleIconProps) => {
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
        d="M2.36612 2.00555L20.3202 9.06943C21.3477 9.47372 21.0583 11 19.954 11H2C1.44772 11 1 10.5523 1 10V2.93612C1 2.23107 1.71003 1.74741 2.36612 2.00555Z"
        transform="translate(1, 6)"
      />
    </svg>
  );
};

export default RightTriangleIcon;
