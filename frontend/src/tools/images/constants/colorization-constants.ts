import { ControlGroup } from "@images/types/ui-types";
import { Colorization } from "../types/colorization-types";

// Mapping of colorization titles to their edit types
const COLORIZATION_EDIT_TYPES: Record<string, Colorization["type"]> = {
  "Grayscale Conversion": "convert-to-grayscale",
  "Invert Colors": "digital-negative",
  Thresholding: "thresholding",
  Clipping: "clipping",
  "Contrast Stretching": "contrast-stretching",
  "Intensity Level Slicing": "intensity-level-slicing",
  "Logarithmic Transformation": "logarithmic-transformation",
  "Power Law Transformation": "power-law-transformation",
  "Color Replacement": "color-replacement",
};

export const COLORIZATION_CONTENT: ControlGroup[] = [
  {
    title: "Grayscale Conversion",
    controls: [
      {
        applyLabel: "Convert to Grayscale",
        params: [],
      },
    ],
  },
  {
    title: "Invert Colors",
    controls: [
      {
        applyLabel: "Invert Colors",
        params: [],
      },
    ],
  },
  {
    title: "Thresholding",
    controls: [
      {
        applyLabel: "Apply Thresholding",
        params: [
          {
            type: "slider",
            label: "Threshold",
            name: "threshold",
            min: 0,
            max: 255,
            defaultValue: 255,
            step: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Clipping",
    controls: [
      {
        applyLabel: "Apply Clipping",
        params: [
          {
            type: "slider",
            label: "Min Intensity",
            name: "minIntensity",
            min: 0,
            max: 255,
            defaultValue: 0,
            step: 1,
          },
          {
            type: "slider",
            label: "Max Intensity",
            name: "maxIntensity",
            min: 0,
            max: 255,
            defaultValue: 255,
            step: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Contrast Stretching",
    controls: [
      {
        applyLabel: "Apply Contrast Stretching",
        params: [
          {
            type: "slider",
            label: "s1",
            name: "s1",
            min: 0,
            max: 255,
            defaultValue: 0,
            step: 1,
          },
          {
            type: "slider",
            label: "r1",
            name: "r1",
            min: 0,
            max: 255,
            defaultValue: 0,
            step: 1,
          },
          {
            type: "slider",
            label: "s2",
            name: "s2",
            min: 0,
            max: 255,
            defaultValue: 255,
            step: 1,
          },
          {
            type: "slider",
            label: "r2",
            name: "r2",
            min: 0,
            max: 255,
            defaultValue: 255,
            step: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Intensity Level Slicing",
    controls: [
      {
        applyLabel: "Apply Intensity Level Slicing",
        params: [
          {
            type: "slider",
            label: "Low Intensity",
            name: "minIntensity",
            min: 0,
            max: 255,
            defaultValue: 0,
            step: 1,
          },
          {
            type: "slider",
            label: "High Intensity",
            name: "maxIntensity",
            min: 0,
            max: 255,
            defaultValue: 255,
            step: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Logarithmic Transformation",
    controls: [
      {
        applyLabel: "Apply",
        params: [
          {
            type: "real-number",
            label: "C",
            name: "c",
            min: 0,
            max: 255,
            defaultValue: 25,
          },
        ],
      },
    ],
  },
  {
    title: "Power Law Transformation",
    controls: [
      {
        applyLabel: "Apply",
        params: [
          {
            type: "real-number",
            label: "C",
            name: "c",
            min: 0,
            max: 255,
            defaultValue: 1,
          },
          {
            type: "real-number",
            label: "Gamma",
            name: "gamma",
            min: 0,
            max: 255,
            defaultValue: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Color Replacement",
    controls: [
      {
        applyLabel: "Apply",
        params: [
          {
            type: "color",
            label: "Source Color",
            name: "sourceColor",
          },
          {
            type: "color",
            label: "Target Color",
            name: "targetColor",
          },
          {
            type: "slider",
            label: "Range",
            name: "range",
            min: 0,
            max: 100,
            defaultValue: 50,
            step: 1,
          },
        ],
      },
    ],
  },
];

// Helper to get editType by title
export const getColorizationEditType = (title: string): Colorization["type"] | undefined => {
  return COLORIZATION_EDIT_TYPES[title];
};

// Helper to get title by editType
export const getColorizationTitle = (editType: Colorization["type"]): string | undefined => {
  return Object.entries(COLORIZATION_EDIT_TYPES).find(([, type]) => type === editType)?.[0];
};

// Helper to get colorization by editType
export const getColorizationByEditType = (editType: Colorization["type"]) => {
  const title = getColorizationTitle(editType);
  return title ? COLORIZATION_CONTENT.find(c => c.title === title) : undefined;
};
