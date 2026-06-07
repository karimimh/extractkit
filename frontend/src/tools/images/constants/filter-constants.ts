import { ControlGroup } from "@images/types/ui-types";
import { FilterType } from "../types/filter-types";

// Mapping of filter titles to their types
const FILTER_TYPES: Record<string, FilterType> = {
  HDR: "hdr",
  Sepia: "sepia",
  Emboss: "emboss",
  "Edge Detection": "edge-detection",
  CRT: "CRT",
  Pixelate: "pixelate",
  Blur: "blur",
  Mosaic: "mosaic",
  Halftone: "halftone",
  Posterize: "posterize",
  Vignette: "vignette",
  Glitch: "glitch",
  Kaleidoscope: "kaleidoscope",
  "Rainbow Shift": "rainbow-shift",
  Swirl: "swirl",
};

export const ALL_FILTERS: ControlGroup[] = [
  {
    title: "Basic Filters",
    controls: [
      {
        title: "HDR",
        params: [],
      },
      {
        title: "Sepia",
        params: [],
      },
      {
        title: "Emboss",
        params: [],
      },
      {
        title: "Edge Detection",
        params: [],
      },
      {
        title: "CRT",
        params: [],
      },
    ],
  },
  {
    title: "Blur & Distortion",
    controls: [
      {
        title: "Pixelate",
        params: [
          {
            type: "slider",
            name: "pixelSize",
            label: "Pixel Size",
            min: 1,
            max: 50,
            defaultValue: 10,
            step: 1,
          },
        ],
      },
      {
        title: "Blur",
        params: [
          {
            type: "slider",
            name: "radius",
            label: "Radius",
            min: 0,
            max: 50,
            defaultValue: 5,
            step: 1,
          },
        ],
      },
      {
        title: "Mosaic",
        params: [
          {
            type: "slider",
            name: "blockSize",
            label: "Block Size",
            min: 1,
            max: 50,
            defaultValue: 10,
            step: 1,
          },
        ],
      },
      {
        title: "Halftone",
        params: [
          {
            type: "slider",
            name: "dotSize",
            label: "Dot Size",
            min: 1,
            max: 20,
            defaultValue: 5,
            step: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Creative Effects",
    controls: [
      {
        title: "Posterize",
        params: [
          {
            type: "slider",
            name: "levels",
            label: "Levels",
            min: 2,
            max: 20,
            defaultValue: 5,
            step: 1,
          },
        ],
      },
      {
        title: "Vignette",
        params: [
          {
            type: "slider",
            name: "radius",
            label: "Radius",
            min: 0,
            max: 1,
            defaultValue: 0.5,
            step: 0.01,
          },
          {
            type: "slider",
            name: "strength",
            label: "Strength",
            min: 0,
            max: 1,
            defaultValue: 0.5,
            step: 0.01,
          },
        ],
      },
      {
        title: "Glitch",
        params: [
          {
            type: "slider",
            name: "intensity",
            label: "Intensity",
            min: 0,
            max: 100,
            defaultValue: 50,
            step: 1,
          },
        ],
      },
      {
        title: "Kaleidoscope",
        params: [
          {
            type: "slider",
            name: "slices",
            label: "Slices",
            min: 2,
            max: 16,
            defaultValue: 6,
            step: 1,
          },
        ],
      },
      {
        title: "Rainbow Shift",
        params: [
          {
            type: "slider",
            name: "frequency",
            label: "Frequency",
            min: 0,
            max: 100,
            defaultValue: 50,
            step: 1,
          },
        ],
      },
      {
        title: "Swirl",
        params: [
          {
            type: "slider",
            name: "centerX",
            label: "Center X",
            min: 0,
            max: 1,
            defaultValue: 0.5,
            step: 0.01,
          },
          {
            type: "slider",
            name: "centerY",
            label: "Center Y",
            min: 0,
            max: 1,
            defaultValue: 0.5,
            step: 0.01,
          },
          {
            type: "slider",
            name: "radius",
            label: "Radius",
            min: 0,
            max: 1,
            defaultValue: 0.5,
            step: 0.01,
          },
          {
            type: "slider",
            name: "angle",
            label: "Angle",
            min: -10,
            max: 10,
            defaultValue: 2,
            step: 0.1,
          },
        ],
      },
    ],
  },
];

// Helper to get filter type by title
export const getFilterType = (title: string): FilterType | undefined => {
  return FILTER_TYPES[title];
};

// Helper to get title by filter type
export const getFilterTitle = (type: FilterType): string | undefined => {
  return Object.entries(FILTER_TYPES).find(([, filterType]) => filterType === type)?.[0];
};

// Helper to get all filters flattened (for backward compatibility)
export const getAllFilters = (): Array<{
  title: string;
  type: FilterType;
  control: (typeof ALL_FILTERS)[number]["controls"][number];
}> => {
  return ALL_FILTERS.flatMap(group =>
    group.controls.map(control => {
      const type = getFilterType(control.title!);
      if (!type) throw new Error(`Filter type not found for title: ${control.title}`);
      return {
        title: control.title!,
        type,
        control,
      };
    })
  );
};

// Helper to get filter by type
export const getFilterByType = (type: FilterType) => {
  return getAllFilters().find(f => f.type === type);
};
