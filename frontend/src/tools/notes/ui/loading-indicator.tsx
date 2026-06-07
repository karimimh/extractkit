import { cn } from "@notes/utils/css-utils";

type LoadingType = "dots" | "spinner" | "pulse" | "bars";

interface LoadingIndicatorProps {
  className?: string;
  type?: LoadingType;
}

export default function LoadingIndicator({
  className = "",
  type = "spinner",
}: LoadingIndicatorProps) {
  if (type === "dots") {
    return (
      <div className={cn("flex gap-1", className)}>
        <div className="w-2 h-2 bg-[#3498db] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-[#3498db] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-[#3498db] rounded-full animate-bounce"></div>
      </div>
    );
  }

  if (type === "pulse") {
    return (
      <div className={cn("relative w-10 h-10", className)}>
        <div className="absolute inset-0 bg-[#3498db] rounded-full opacity-75 animate-ping"></div>
        <div className="absolute inset-0 bg-[#3498db] rounded-full"></div>
      </div>
    );
  }

  if (type === "bars") {
    return (
      <div className={cn("flex gap-1 items-end h-8", className)}>
        <div className="w-1.5 bg-[#3498db] animate-pulse [animation-delay:-0.4s] h-full"></div>
        <div className="w-1.5 bg-[#3498db] animate-pulse [animation-delay:-0.2s] h-full"></div>
        <div className="w-1.5 bg-[#3498db] animate-pulse h-full"></div>
        <div className="w-1.5 bg-[#3498db] animate-pulse [animation-delay:-0.2s] h-full"></div>
        <div className="w-1.5 bg-[#3498db] animate-pulse [animation-delay:-0.4s] h-full"></div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-10 h-10", className)}>
      <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-[#3498db] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
