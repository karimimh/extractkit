
import {
  ColorFormats,
  getColorFormats,
  integerToHex,
} from "@images/utils/color-conversion-utils";
import { cn } from "@images/utils/css-utils";
import { useMemo } from "react";
import NumberInput from "../input/number-input";
import RGBColorInput from "./rgb-color-input";
import HSLColorInput from "./hsl-color-input";

interface ColorInputProps {
  onChange?: (color?: string) => void;
  inputType?: "hex" | "rgb" | "hsl";
  onInputTypeChange?: (type: "hex" | "rgb" | "hsl") => void;
  className?: string;
  colorFormats: ColorFormats;
}

const ColorInput = ({
  inputType = "hex",
  onInputTypeChange,
  onChange,
  className,
  colorFormats,
}: ColorInputProps) => {
  return (
    <div className={cn("flex flex-row items-center gap-1", className)}>
      <select
        className="text-xs bg-transparent uppercase shadow-none h-full text-gray-500 focus:outline-none"
        value={inputType}
        onChange={(e) => {
          onInputTypeChange?.(e.target.value as "hex" | "rgb" | "hsl");
        }}
      >
        {["hex", "rgb", "hsl"].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {inputType === "hex" && (
        <NumberInput
          className="w-full h-7"
          value={colorFormats.hex_integer_value}
          leadingLabel="#"
          base="16"
          min={0}
          max={0xffffff}
          onChange={(value) => onChange?.(integerToHex(value))}
          showTrailingClear
          zeroPadLength={6}
        />
      )}
      {inputType === "rgb" && (
        <RGBColorInput
          color={colorFormats.rgb}
          onChange={(rgb) => {
            if (!rgb) {
              onChange?.(undefined);
            } else {
              const { r, g, b } = rgb;
              onChange?.(`rgb(${r}, ${g}, ${b})`);
            }
          }}
        />
      )}
      {inputType === "hsl" && (
        <HSLColorInput
          color={colorFormats.hsl}
          onChange={(hsl) => {
            if (!hsl) {
              onChange?.(undefined);
            } else {
              const { h, s, l } = hsl;
              onChange?.(`hsl(${h}, ${s}%, ${l}%)`);
            }
          }}
        />
      )}
    </div>
  );
};

export default ColorInput;
