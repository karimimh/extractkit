"use client";

import { Fragment } from "react/jsx-runtime";
import H2SidebarItem from "../common-sidebar-items/h2-sidebar-item";
import SliderWithLabels from "@images/components/ui/slider/slider-with-labels";
import ColorPickerPopover from "@images/components/ui/color/color-picker-popover";
import Button from "@images/components/ui/button";
import { Colorization } from "@images/types/colorization-types";
import { getColorizationByEditType } from "@images/constants/colorization-constants";
import { useCallback, useState } from "react";

interface ColorizationListItemProps {
  object: Colorization;
}

const ColorizationListItem = ({ object }: ColorizationListItemProps) => {
  const colorization = getColorizationByEditType(object.type);
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [selectedColorization, setSelectedColorization] = useState<string | null>(null);

  // const handleApply = useCallback(() => {
  //   if (!selectedColorization) {
  //     onOpenChange(false);
  //     return;
  //   }

  //   const section = COLORIZATION_CONTENT.find(c => c.title === selectedColorization);
  //   if (!section) return;

  //   const edit: Partial<Colorization> = {
  //     category: "colorization",
  //     id: generateId(),
  //     type: section.editType,
  //   };

  //   for (const param of section.params) {
  //     const value = paramValues[`${section.title}-${param.name}`];
  //     if (value !== undefined) {
  //       (edit as any)[param.name] = value;
  //     }
  //   }

  //   addLayer({
  //     id: generateId(),
  //     name: `${section.title}-${Object.keys(layers).length + 1}`,
  //     type: "colorization",
  //     objects: { [(edit as Colorization).id]: edit as Colorization },
  //     objectOrders: [(edit as Colorization).id],
  //   });

  //   // Clear state and close dialog
  //   setParamValues({});
  //   setSelectedColorization(null);
  //   onOpenChange(false);
  // }, [selectedColorization, paramValues, addLayer, layers, onOpenChange]);

  const setParamValue = (sectionTitle: string, paramName: string, value: unknown): void => {
    setParamValues(prevValues => ({
      ...prevValues,
      [`${sectionTitle}-${paramName}`]: value,
    }));
  };
  if (!colorization) return null;
  const { title } = colorization;
  const params = colorization.controls[0].params;
  return (
    <Fragment key={title}>
      <H2SidebarItem title={title} />
      {params.map(param => {
        if (param.type === "slider") {
          const { defaultValue, label, max, min, name, step } = param;
          const paramValue = paramValues[`${title}-${name}`] as number | undefined;

          return (
            <SliderWithLabels
              key={label}
              className="self-stretch pl-6 my-1 pr-4"
              min={min}
              max={max}
              value={paramValue !== undefined ? paramValue : (defaultValue ?? 0)}
              step={step}
              label={label}
              onChange={val => {
                setSelectedColorization(title);
                setParamValue(title, name, val);
              }}
              resetValue={defaultValue ?? 0}
            />
          );
        } else if (param.type === "real-number" || param.type === "integer-number") {
          const { defaultValue, label, max, min, name } = param;
          const step = param.type === "integer-number" ? param.step : undefined;
          const paramValue = paramValues[`${title}-${name}`] as number | undefined;

          return (
            <label className="self-stretch pl-6 my-1 pr-4 flex gap-2" key={label}>
              {label}
              <input
                className="max-w-20"
                type="number"
                value={paramValue !== undefined ? paramValue : (defaultValue ?? 0)}
                min={min}
                max={max}
                step={step}
                onChange={e => {
                  setSelectedColorization(title);
                  setParamValue(title, name, parseFloat(e.target.value));
                }}
              />
            </label>
          );
        } else if (param.type === "color") {
          const { label, name } = param;
          const paramValue = paramValues[`${title}-${name}`] as string | undefined;
          return (
            <div className="flex self-stretch pl-6 text-sm my-1 gap-2 items-center" key={label}>
              <div>{label}</div>
              <ColorPickerPopover
                onChange={c => {
                  setSelectedColorization(title);
                  setParamValue(title, name, c);
                }}
                value={paramValue}
              />
            </div>
          );
        }
      })}
      {params.length === 0 && (
        <Button
          className="self-end mx-4 my-1 text-blue-600"
          text="Preview"
          onClick={() => setSelectedColorization(title)}
        />
      )}
    </Fragment>
  );
};

export default ColorizationListItem;
