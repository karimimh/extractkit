"use client";

import { cn } from "@notes/utils/css-utils";

interface ChalkIconProps {
  className?: string;
}

const ChalkIcon = ({ className = "" }: ChalkIconProps) => {
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
      <g transform="rotate(45 12 12)">
        <path d="M7 3a5 4 0 0 1 10 0" />
        <line x1="7" y1="3" x2="7" y2="21" />
        <line x1="17" y1="3" x2="17" y2="21" />
        <ellipse cx="12" cy="21" rx="5" ry="4" />
      </g>
    </svg>
  );
};

export default ChalkIcon;
