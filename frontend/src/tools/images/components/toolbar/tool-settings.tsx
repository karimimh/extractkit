
import { useToolParams } from "@images/hooks/params/use-tool-params";
import { MenuType, Tool } from "@images/types/tool-types";
import { Fragment, useCallback, useMemo } from "react";
import ColorPickerPopover from "../ui/color/color-picker-popover";
import InputWithChevrons from "../ui/input/input-with-chevrons";
import InputWithPlusMinus from "../ui/input/input-with-plus-minus";
import Select from "../ui/select";
import Slider from "../ui/slider/slider";

interface ToolSettingsProps {
  menuType: MenuType;
  tool: Tool;
}

const ToolSettings = ({ menuType, tool }: ToolSettingsProps) => {
  const [getParameterValue, setParameterValue] = useToolParams(menuType, tool.name);

  const memoizedParams = useMemo(() => tool.params, [tool.params]);

  const handleSliderChange = useCallback(
    (name: string, value: number) => {
      setParameterValue(name, value);
    },
    [setParameterValue]
  );

  const handleColorChange = useCallback(
    (name: string, value: string | undefined) => {
      setParameterValue(name, value);
    },
    [setParameterValue]
  );

  return (
    <div className="grid grid-cols-2 p-4 items-center place-items-start w-full sm:w-[unset]">
      {memoizedParams?.map(param => (
        <Fragment key={`${param.name}-${param.type}-${param.label}`}>
          <div className="h-10 content-center">{param.label ?? param.name}</div>
          {param.type === "slider" && (
            <Slider
              max={param.max}
              min={param.min}
              value={getParameterValue(param.name) as number}
              onChange={value => handleSliderChange(param.name, value)}
            />
          )}
          {param.type === "color" && (
            <ColorPickerPopover
              className="w-full flex-1"
              value={getParameterValue(param.name) as string}
              onChange={value => handleColorChange(param.name, value)}
            />
          )}
          {param.type === "count" && (
            <InputWithChevrons
              className="w-full h-7"
              initialValue={
                getParameterValue(param.name) !== undefined
                  ? (getParameterValue(param.name) as number)
                  : undefined
              }
              onChange={value => setParameterValue(param.name, value)}
              min={param.min}
              max={param.max}
            />
          )}
          {param.type === "select" && (
            <Select
              trigger={getParameterValue(param.name)?.toString() ?? "Select ..."}
              items={param.options}
              onSelect={option => setParameterValue(param.name, option)}
              contentClassName="text-base"
              className="w-full"
              triggerClassName="w-full"
            />
          )}
          {param.type === "checkbox" && (
            <input
              type="checkbox"
              checked={!!getParameterValue(param.name)}
              onChange={e => setParameterValue(param.name, e.target.checked)}
            />
          )}
          {param.type === "number" && (
            <InputWithPlusMinus
              className="w-full h-7"
              initialValue={
                getParameterValue(param.name)?.toString()
                  ? Number(getParameterValue(param.name))
                  : undefined
              }
              onChange={value => setParameterValue(param.name, value)}
              min={param.min}
              max={param.max}
            />
          )}
          {param.type === "text" && (
            <input
              className="w-20"
              type="text"
              value={getParameterValue(param.name)?.toString() ?? ""}
              onChange={e => setParameterValue(param.name, e.target.value)}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default ToolSettings;
