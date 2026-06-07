import useDragging from "@images/hooks/common/use-dragging";
import useElementFrame from "@images/hooks/common/use-element-frame";
import { HSL } from "@images/types/color-types";
import { Point } from "@images/types/geometry-types";
import { hslToHex } from "@images/utils/color-conversion-utils";
import { cn } from "@images/utils/css-utils";
import React, { useEffect, useRef, useState } from "react";

interface ColorPickerProps {
  onChange?: (color?: string) => void;
  className?: string;
  currentColor?: HSL;
}

const HSBColorPicker: React.FC<ColorPickerProps> = ({
  onChange,
  className,
  currentColor,
}) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelFrame = useElementFrame(wheelRef);

  useEffect(() => {
    if (currentColor) {
      setHue(currentColor.h);
      setSaturation(currentColor.s);
      setBrightness(currentColor.l);
    }
  }, [currentColor]);

  const handleWheelClick = (point: Point) => {
    if (!wheelFrame) return;
    const centerX = wheelFrame.width / 2;
    const centerY = wheelFrame.height / 2;

    const x = point.x - wheelFrame.x - centerX;
    const y = centerY - (point.y - wheelFrame.y);

    const distance = Math.sqrt(x * x + y * y);
    const radius = Math.min(centerX, centerY);

    if (distance <= radius) {
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      const newHue = Math.round(-(angle - 90) + 360) % 360;
      const newBrightness = Math.min(
        100,
        100 - Math.round((distance / radius) * 50)
      );

      setHue(newHue);
      setBrightness(newBrightness);
      onChange?.(hslToHex({ h: newHue, s: saturation, l: newBrightness }));
    }
  };

  const { handleMouseDown } = useDragging({
    onMove: handleWheelClick,
    onDragStart: handleWheelClick,
  });

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseInt(e.target.value, 10);
    setSaturation(newSaturation);
    onChange?.(hslToHex({ h: hue, s: newSaturation, l: brightness }));
  };

  return (
    <div className={cn("p-1", className)}>
      <div
        className="relative w-full aspect-square rounded-full"
        draggable={false}
        style={{
          background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
        }}
        onClick={(e) => handleWheelClick({ x: e.clientX, y: e.clientY })}
        onMouseDown={handleMouseDown}
        ref={wheelRef}
      >
        <div className="absolute w-full h-full rounded-full inset-0 bg-[radial-gradient(circle_closest-side,_#fff,_transparent)]" />
        <div
          className="absolute w-4 h-4 bg-white rounded-full border border-black"
          style={{
            left: `${
              50 -
              (Math.abs(brightness - 50) - 50) *
                Math.cos((hue - 90) * (Math.PI / 180))
            }%`,
            top: `${
              50 -
              (Math.abs(brightness - 50) - 50) *
                Math.sin((hue - 90) * (Math.PI / 180))
            }%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={saturation}
        onChange={handleSaturationChange}
        className="w-full appearance-none h-2 rounded border"
        style={{
          background: `linear-gradient(to right, hsl(${hue}, 0%, ${brightness}%), hsl(${hue}, 100%, ${brightness}%)`,
        }}
      />
    </div>
  );
};

export default HSBColorPicker;
