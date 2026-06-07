
import { WEB_NAMED_COLORS } from "@images/constants/color-constants";
import { cn } from "@images/utils/css-utils";
import { useState } from "react";

interface NamedWebColorsProps {
  onColorClick?: (color: string) => void;
  currentColor?: string;
  className?: string;
}

const NamedWebColors = ({
  onColorClick,
  className,
  currentColor,
}: NamedWebColorsProps) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "flex-wrap overflow-y-auto flex flex-row items-center justify-start gap-0.5",
        className
      )}
    >
      {WEB_NAMED_COLORS.map(({ name: colorName, label, hex }) => (
        <div
          className={cn(
            "cursor-pointer aspect-square border rounded-full",
            currentColor?.toLowerCase() === hex && "border-black shadow-lg"
          )}
          onClick={() => onColorClick?.(hex)}
          onMouseEnter={() => setHoveredColor(label)}
          onMouseLeave={() => setHoveredColor(null)}
          key={colorName}
          style={{
            backgroundColor: hex,
            width: "1.15rem",
            height: "1.15rem",
          }}
        />
      ))}
      {hoveredColor && (
        <div className="w-full pl-1 text-sm text-gray-500">{hoveredColor}</div>
      )}
    </div>
  );
};

export default NamedWebColors;
