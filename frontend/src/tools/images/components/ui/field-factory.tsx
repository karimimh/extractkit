
import { ToolParam } from "@images/types/tool-types";
import ColorPickerPopover from "./color/color-picker-popover";
import CountInput from "./count-input";
import AutogrowingTextarea from "./input/auto-growing-text-area";
import InputWithChevrons from "./input/input-with-chevrons";
import InputWithPlusMinus from "./input/input-with-plus-minus";
import Select from "./select";
import SliderWithLabels from "./slider/slider-with-labels";
import ToggleGroup from "./toggle-group";

interface FieldFactoryProps {
  param: ToolParam;
  value: any;
  onValueChange?: (value: any) => void;
  className?: string;
}

const FieldFactory = ({ param, onValueChange, value, className }: FieldFactoryProps) => {
  if (param.type === "slider") {
    return (
      <SliderWithLabels
        className={className}
        max={param.max}
        min={param.min}
        label={param.label}
        value={value as number}
        onChange={onValueChange}
        step={param.step}
      />
    );
  } else if (param.type === "color") {
    return (
      <ColorPickerPopover value={value as string} onChange={onValueChange} className={className} />
    );
  } else if (param.type === "count") {
    return (
      <CountInput
        className={className}
        max={param.max}
        min={param.min}
        value={(value as number | undefined) ?? 1}
        onChange={onValueChange}
      />
    );
  } else if (param.type === "select" && param.inputType === "toggle-group" && param.icons) {
    return (
      <ToggleGroup
        items={param.icons.map(icon => ({ icon }))}
        selectedIndex={param.options.indexOf(value?.toString() ?? param.defaultValue ?? "")}
        onChange={index => onValueChange?.(param.options[index])}
        className={className}
      />
    );
  } else if (param.type === "select") {
    return (
      <Select
        trigger={(value as string) ?? "select ..."}
        items={param.options}
        onSelect={onValueChange}
        contentClassName="text-base"
        triggerClassName="w-full text-sm"
        className={className}
      />
    );
  } else if (param.type === "checkbox") {
    return (
      <input type="checkbox" checked={!!value} onChange={e => onValueChange?.(e.target.checked)} />
    );
  } else if (param.type === "number" && param.inputType !== "plus-minus") {
    return (
      <InputWithChevrons
        className={className}
        initialValue={value?.toString() ? Number(value) : undefined}
        onChange={onValueChange}
        min={param.min}
        max={param.max}
      />
    );
  } else if (param.type === "number" && param.inputType === "plus-minus") {
    return (
      <InputWithPlusMinus
        className={className}
        initialValue={value?.toString() ? Number(value) : undefined}
        onChange={onValueChange}
        min={param.min}
        max={param.max}
      />
    );
  } else if (param.type === "text") {
    return (
      <AutogrowingTextarea
        className={className}
        onChange={text => onValueChange?.(text)}
        placeholder="Enter text"
        value={value?.toString() ?? ""}
      />
    );
  }
  return null;
};

export default FieldFactory;
