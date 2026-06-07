
import { RGB } from "@images/types/color-types";
import { useEffect, useState } from "react";
import NumberInput from "../input/number-input";

interface RGBColorInputProps {
  color?: RGB;
  onChange?: (color?: RGB) => void;
}

const RGBColorInput = ({ color, onChange }: RGBColorInputProps) => {
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  useEffect(() => {
    setR(color?.r ?? 0);
    setG(color?.g ?? 0);
    setB(color?.b ?? 0);
  }, [color]);

  return (
    <div className="flex flex-1 gap-1">
      <NumberInput
        className="w-full h-7"
        value={r}
        onChange={(newR) => {
          setR(newR ?? 0);
          onChange?.({ r: newR ?? 0, g, b });
        }}
        min={0}
        max={255}
        zeroPadLength={3}
      />
      <NumberInput
        className="w-full h-7"
        value={g}
        onChange={(newG) => {
          setG(newG ?? 0);
          onChange?.({ r, g: newG ?? 0, b });
        }}
        min={0}
        max={255}
        zeroPadLength={3}
      />
      <NumberInput
        className="w-full h-7"
        value={b}
        onChange={(newB) => {
          setB(newB ?? 0);
          onChange?.({ r, g, b: newB ?? 0 });
        }}
        min={0}
        max={255}
        zeroPadLength={3}
      />
    </div>
  );
};

export default RGBColorInput;
