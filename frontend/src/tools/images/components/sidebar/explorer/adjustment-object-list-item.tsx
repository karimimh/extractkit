"use client";

import SliderWithLabels from "@images/components/ui/slider/slider-with-labels";
import { getAllAdjustmentParams } from "@images/constants/adjustment-constants";
import { Adjustment } from "@images/types/adjustment-types";

interface AdjustmentObjectListItemProps {
  object: Adjustment;
  onValueChange: (value: number) => void;
}

const AdjustmentObjectListItem = ({ object, onValueChange }: AdjustmentObjectListItemProps) => {
  const adj = getAllAdjustmentParams().find(adj => adj.name === object.type);
  if (!adj || adj.type !== "slider") return null;
  return (
    <SliderWithLabels
      key={adj.name}
      className="w-full pl-6 my-1 pr-2"
      min={adj.min ?? 0}
      max={adj.max ?? 100}
      value={object.value}
      step={adj.step ?? 1}
      label={adj.label}
      onChange={onValueChange}
      resetValue={adj.defaultValue ?? 0}
    />
  );
};

export default AdjustmentObjectListItem;
