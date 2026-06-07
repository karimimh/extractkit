import { ControlGroup, Param } from "@images/types/ui-types";

export const ADJUSTMENT_DEBOUNCE_TIME = 500;

export const ADJUSTMENTS: ControlGroup[] = [
  {
    title: "Basic Adjustments",
    controls: [
      {
        params: [
          {
            type: "slider",
            name: "brightness",
            label: "Brightness",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "contrast",
            label: "Contrast",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "exposure",
            label: "Exposure",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "highlights",
            label: "Highlights",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "shadows",
            label: "Shadows",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "vibrance",
            label: "Vibrance",
            min: 0,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
    ],
  },
  {
    title: "HSB Adjustments",
    controls: [
      {
        params: [
          {
            type: "slider",
            name: "hsb-hue",
            label: "Hue",
            min: -180,
            max: 180,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "hsb-saturation",
            label: "Saturation",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "hsb-brightness",
            label: "Brightness",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
    ],
  },
  {
    title: "White Balance",
    controls: [
      {
        params: [
          {
            type: "slider",
            name: "temperature",
            label: "Temperature",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
      {
        params: [
          {
            type: "slider",
            name: "tint",
            label: "Tint",
            min: -100,
            max: 100,
            defaultValue: 0,
            step: 1,
          },
        ],
      },
    ],
  },
];

// Helper to get all adjustment params flattened (for finding by name)
export const getAllAdjustmentParams = (): Param[] => {
  return ADJUSTMENTS.flatMap(group => group.controls.flatMap(control => control.params));
};

export const getAdjustmentsBySection = () => {
  return ADJUSTMENTS.map(group => ({
    title: group.title,
    adjustments: group.controls.flatMap(control => control.params),
  }));
};
