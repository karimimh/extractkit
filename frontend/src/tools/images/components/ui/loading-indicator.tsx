import { cn } from "@images/utils/css-utils";

interface LoadingIndicatorProps {
  className?: string;
}

export default function LoadingIndicator({
  className = "",
}: LoadingIndicatorProps) {
  return (
    <div
      className={cn(
        "rounded-full border-8 border-[rgba(0,0,0,0.1)] animate-spin border-t-8 border-t-[#3498db]",
        className
      )}
    ></div>
  );
}
