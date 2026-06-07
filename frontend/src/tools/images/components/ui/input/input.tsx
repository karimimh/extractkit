
import { cn } from "@images/utils/css-utils";
import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface InputProps {
  className?: string;
  onChange?: (value?: string) => void;
  value?: string;
  mask?: string;
  showTrailingClear?: boolean;
  leadingOptions?: string[];
  leadingOption?: string;
  onLeadingOptionChange?: (option: string) => void;
  validateInput?: (value: string) => boolean;
}

const Input = ({
  className,
  value: initialValue,
  onChange,
  mask,
  showTrailingClear = false,
  leadingOptions,
  leadingOption: initialLeadingOption,
  onLeadingOptionChange,
  validateInput,
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [leadingOption, setLeadingOption] = useState<string | undefined>(
    initialLeadingOption
  );

  const handleValueChange = (newValue?: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (mask) {
      let formattedValue = "";
      let rawIndex = 0;

      for (let i = 0; i < mask.length; i++) {
        const maskChar = mask[i];
        if (rawIndex >= rawValue.length) break;

        if (maskChar === "9") {
          const ch = rawValue[rawIndex++];
          formattedValue += ch;
        } else {
          if (rawValue[rawIndex] === maskChar) rawIndex++;
          formattedValue += maskChar;
        }
      }
      handleValueChange(formattedValue);
    } else {
      handleValueChange(rawValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!validateInput) return;
    if (!validateInput(value ?? "")) {
      setValue("");
    }
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setLeadingOption(initialLeadingOption);
  }, [initialLeadingOption]);

  return (
    <div
      className={cn(
        "border border-[#d4d4d8] rounded-md flex items-center bg-white relative",
        isFocused && "outline outline-[3] outline-slate-200/70 border-gray-400",
        className
      )}
    >
      {leadingOptions && (
        <select
          className="text-xs bg-transparent uppercase shadow-none h-full text-gray-500 border-r focus:outline-none"
          value={leadingOption}
          onChange={(e) => {
            setLeadingOption(e.target.value);
            onLeadingOptionChange?.(e.target.value);
          }}
        >
          {leadingOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      <input
        className={cn(
          "flex-1 w-full h-full text-sm px-1 py-1 bg-transparent uppercase shadow-none border-none focus:outline-none"
        )}
        type="text"
        value={value ?? ""}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onChange={handleInputChange}
      />

      {showTrailingClear && (
        <XCircle
          className="size-4 mr-1 text-gray-500 cursor-pointer"
          onClick={() => handleValueChange(undefined)}
        />
      )}
    </div>
  );
};

export default Input;
