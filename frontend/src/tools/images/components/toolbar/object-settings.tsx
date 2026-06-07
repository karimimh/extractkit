import { OBJECT_PARAMS } from "@images/constants/layer-constants";
import { ContentObject, Layer, LayerObject } from "@images/types/layer-types";
import { cn } from "@images/utils/css-utils";
import { Fragment } from "react";
import ColorPickerPopover from "../ui/color/color-picker-popover";
import CountInput from "../ui/count-input";
import AutogrowingTextarea from "../ui/input/auto-growing-text-area";
import InputWithChevrons from "../ui/input/input-with-chevrons";
import InputWithPlusMinus from "../ui/input/input-with-plus-minus";
import Select from "../ui/select";
import SliderWithLabels from "../ui/slider/slider-with-labels";
import ToggleGroup from "../ui/toggle-group";

interface ObjectSettingsProps<T extends LayerObject> {
  object: T;
  modifyObject?: (object: LayerObject) => void;
  objectType: keyof typeof OBJECT_PARAMS;
}

const ObjectSettings = <T extends LayerObject>({
  object,
  modifyObject,
  objectType,
}: ObjectSettingsProps<T>) => {
  const KEY_VALUE_PAIRS = Object.entries(object);
  const getParameterValue = (key: string) => {
    const param = OBJECT_PARAMS[objectType].find(param => param.name === key);
    if (param?.getValue) {
      return param.getValue(KEY_VALUE_PAIRS);
    }
    return KEY_VALUE_PAIRS.find(param => param[0] === key)?.[1];
  };

  const setParameterValue = (key: string, value: any) => {
    const param = OBJECT_PARAMS[objectType].find(param => param.name === key);
    if (param?.setValue) {
      const keyvalue = param.setValue(KEY_VALUE_PAIRS, value);
      const k = keyvalue[0];
      const v = keyvalue[1];
      modifyObject?.({ ...object, [k]: v } as LayerObject);
      return;
    }
    modifyObject?.({ ...object, [key]: value } as LayerObject);
  };

  return (
    <div className="grid grid-cols-2 p-4 gap-y-2 items-center place-items-start w-full h-full pb-80">
      {OBJECT_PARAMS[objectType].map(param => (
        <Fragment key={`${object.id}${param.name}`}>
          {param.type !== "slider" && (
            <div className={cn("h-7 content-center", param.type === "text" && "col-span-2")}>
              {param.label ?? param.name}
            </div>
          )}
          {param.type === "slider" && (
            <SliderWithLabels
              max={param.max}
              min={param.min}
              label={param.label}
              value={getParameterValue(param.name) as number}
              onChange={value => setParameterValue(param.name, value)}
              step={param.step}
              className="w-full col-span-2 py-2"
            />
          )}
          {param.type === "color" && (
            <ColorPickerPopover
              className="w-full flex-1"
              value={getParameterValue(param.name) as string}
              onChange={value => setParameterValue(param.name, value)}
            />
          )}
          {param.type === "count" && (
            <CountInput
              className="flex-1"
              max={param.max}
              min={param.min}
              value={(getParameterValue(param.name) as number | undefined) ?? 1}
              onChange={value => setParameterValue(param.name, value)}
            />
          )}
          {param.type === "select" && param.inputType !== "toggle-group" && (
            <Select
              trigger={getParameterValue(param.name)?.toString() ?? "select ..."}
              items={param.options}
              onSelect={option => setParameterValue(param.name, option)}
              contentClassName="text-base"
              className="w-full"
              triggerClassName="w-full text-sm"
            />
          )}
          {param.type === "select" && param.inputType === "toggle-group" && param.icons && (
            <ToggleGroup
              items={param.icons.map(icon => ({ icon }))}
              className="h-7 w-full"
              selectedIndex={param.options.indexOf(
                getParameterValue(param.name)?.toString() ?? param.defaultValue ?? ""
              )}
              onChange={index => setParameterValue(param.name, param.options[index])}
            />
          )}
          {param.type === "checkbox" && (
            <input
              type="checkbox"
              checked={!!getParameterValue(param.name)}
              onChange={e => setParameterValue(param.name, e.target.checked)}
            />
          )}
          {param.type === "number" && param.inputType !== "plus-minus" && (
            <InputWithChevrons
              className="w-full"
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
          {param.type === "number" && param.inputType === "plus-minus" && (
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
            <AutogrowingTextarea
              className="w-full min-h-7 col-span-2"
              minRows={3}
              maxRows={10}
              onChange={text => setParameterValue(param.name, text)}
              placeholder="Enter text"
              value={getParameterValue(param.name)?.toString() ?? ""}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default ObjectSettings;
