import { cn } from "@notes/utils/css-utils";
import React from "react";

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className, onClick }: CardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-lg", className)} onClick={onClick}>
      {children}
    </div>
  );
}
