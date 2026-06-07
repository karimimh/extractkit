
import { cn } from "@images/utils/css-utils";
import Popover from "../popover";
import ColorPicker from "./color-picker";
import { Ban } from "lucide-react";

interface ColorPickerPopoverProps {
  className?: string;
  value?: string;
  onChange?: (color?: string) => void;
}

const ColorPickerPopover = ({
  className,
  onChange,
  value,
}: ColorPickerPopoverProps) => {
  return (
    <Popover className={cn("", className)} horizontalContentAlignment="left">
      <Popover.Trigger
        className={cn(
          "border border-[#d4d4d8] rounded-md h-7 w-full flex justify-center items-center",
          "focus:outline focus:outline-[3] focus:outline-slate-200/70 focus:border-gray-400"
        )}
        icon={value === undefined ? Ban : undefined}
        iconClassName="text-gray-500"
        style={{
          backgroundColor: value,
        }}
      />
      <Popover.Content>
        <ColorPicker onChange={onChange} value={value} />
      </Popover.Content>
    </Popover>
  );
};

export default ColorPickerPopover;
