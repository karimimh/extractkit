"use client";

import { cn } from "@notes/utils/css-utils";
import { useEffect, useState } from "react";

interface SwitchProps {
  onToggle?: (isOn: boolean) => void;
  isOn?: boolean;
}

const Switch = ({ onToggle, isOn: controlledIsOn = false }: SwitchProps) => {
  const [isOn, setIsOn] = useState(controlledIsOn);

  useEffect(() => {
    if (controlledIsOn !== undefined) {
      setIsOn(controlledIsOn);
    }
  }, [controlledIsOn]);

  const toggleSwitch = () => {
    setIsOn(!isOn);
    onToggle?.(!isOn);
  };

  return (
    <div
      onClick={toggleSwitch}
      className={`flex items-center w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${
        isOn ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <div
        className={cn(
          "size-5 bg-white shadow rounded-full transition-transform",
          isOn ? "transform translate-x-5" : ""
        )}
      />
    </div>
  );
};

export default Switch;
