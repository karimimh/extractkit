import { cn } from "@images/utils/css-utils";
import React from "react";

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-white rounded-md shadow-md", className)}>
      {children}
    </div>
  );
}
