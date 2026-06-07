
import { HSL } from "@images/types/color-types";
import { useEffect, useState } from "react";
import NumberInput from "../input/number-input";

interface HSLColorInputProps {
  color?: HSL;
  onChange?: (color?: HSL) => void;
}

const HSLColorInput = ({ color, onChange }: HSLColorInputProps) => {
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(0);
  const [br, setBr] = useState(0);

  useEffect(() => {
    setHue(color?.h ?? 0);
    setSat(color?.s ?? 0);
    setBr(color?.l ?? 0);
  }, [color]);

  return (
    <div className="flex flex-1 gap-1">
      <NumberInput
        className="w-full h-7"
        value={hue}
        onChange={(v) => {
          const newH = v ?? 0;
          setHue(newH);
          onChange?.({ h: newH, s: sat, l: br });
        }}
        min={0}
        max={359}
      />
      <NumberInput
        className="w-full h-7"
        value={sat}
        onChange={(v) => {
          const newS = v ?? 0;
          setSat(newS);
          onChange?.({ h: hue, s: newS, l: br });
        }}
        min={0}
        max={100}
      />
      <NumberInput
        className="w-full h-7"
        value={br}
        onChange={(v) => {
          const newB = v ?? 0;
          setBr(newB);
          onChange?.({ h: hue, s: sat, l: newB });
        }}
        min={0}
        max={100}
      />
    </div>
  );
};

export default HSLColorInput;
