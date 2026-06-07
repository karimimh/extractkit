import { LayersAction, LayersActionTypes } from "@images/types/layers-context-types";

function formatEditName(edit: any): string {
  if (!edit) return "Unknown edit";

  // Handle adjustments
  if (edit.category === "adjustment") {
    const typeMap: Record<string, string> = {
      brightness: "Brightness",
      contrast: "Contrast",
      exposure: "Exposure",
      highlights: "Highlights",
      shadows: "Shadows",
      "hsb-hue": "Hue",
      "hsb-saturation": "Saturation",
      "hsb-brightness": "HSB Brightness",
      temperature: "Temperature",
      tint: "Tint",
      vibrance: "Vibrance",
    };
    return typeMap[edit.type] || edit.type;
  }

  // Handle filters
  if (edit.category === "filter") {
    const typeMap: Record<string, string> = {
      "black-and-white": "Black & White",
      hdr: "HDR",
      sepia: "Sepia",
      "invert-colors": "Invert Colors",
      emboss: "Emboss",
      pixelate: "Pixelate",
      blur: "Blur",
      "edge-detection": "Edge Detection",
      posterize: "Posterize",
      vignette: "Vignette",
      mosaic: "Mosaic",
      halftone: "Halftone",
      glitch: "Glitch",
      kaleidoscope: "Kaleidoscope",
      CRT: "CRT",
      "rainbow-shift": "Rainbow Shift",
      swirl: "Swirl",
    };
    return typeMap[edit.type] || edit.type;
  }

  // Handle enhancements
  if (edit.category === "enhancement") {
    if (edit.type === "histogram-equalization") {
      return "Histogram Equalization";
    }
    return edit.type;
  }

  // Handle colorizations
  if (edit.category === "colorization") {
    const typeMap: Record<string, string> = {
      "digital-negative": "Digital Negative",
      thresholding: "Thresholding",
      clipping: "Clipping",
      "contrast-stretching": "Contrast Stretching",
      "intensity-level-slicing": "Intensity Level Slicing",
      "logarithmic-transformation": "Logarithmic Transform",
      "power-law-transformation": "Power Law Transform",
      "convert-to-grayscale": "Convert to Grayscale",
      "color-replacement": "Color Replacement",
    };
    return typeMap[edit.type] || edit.type;
  }

  return "Edit";
}

export function getActionDescription(action: LayersAction): string {
  switch (action.type) {
    case LayersActionTypes.ADD_LAYER:
      return `Created layer: ${action.payload.name}`;

    case LayersActionTypes.RENAME_LAYER:
      return `Renamed layer to: ${action.payload.name}`;

    case LayersActionTypes.DELETE_LAYER:
      return "Deleted layer";

    case LayersActionTypes.MODIFY_OBJECT:
      return `Modified ${action.payload.object.type}`;

    case LayersActionTypes.SWAP_LAYERS:
      return "Reordered layers";

    default:
      return "Unknown action";
  }
}
