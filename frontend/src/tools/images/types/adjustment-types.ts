import { BaseLayerObject } from "./layer-types";

export type AdjustmentType =
  | "brightness"
  | "contrast"
  | "exposure"
  | "highlights"
  | "shadows"
  | "hsb-hue"
  | "hsb-saturation"
  | "hsb-brightness"
  | "temperature"
  | "tint"
  | "vibrance";

export interface Adjustment extends BaseLayerObject {
  category: "adjustment";
  type: AdjustmentType;
  value: number;
}
