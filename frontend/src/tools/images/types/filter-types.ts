export type Filter = {
  category: "filter";
  id: string;
} & (
  | {
      type: "hdr";
    }
  | {
      type: "sepia";
    }
  | {
      type: "emboss";
    }
  | {
      type: "edge-detection";
    }
  | {
      type: "CRT";
    }
  | {
      type: "pixelate";
      pixelSize: number;
    }
  | {
      type: "blur";
      radius: number;
    }
  | {
      type: "mosaic";
      blockSize: number;
    }
  | {
      type: "halftone";
      dotSize: number;
    }
  | {
      type: "posterize";
      levels: number;
    }
  | {
      type: "vignette";
      radius: number;
      strength: number;
    }
  | {
      type: "glitch";
      intensity: number;
    }
  | {
      type: "kaleidoscope";
      slices: number;
    }
  | {
      type: "rainbow-shift";
      frequency: number;
    }
  | {
      type: "swirl";
      centerX: number;
      centerY: number;
      radius: number;
      angle: number;
    }
);

export type FilterType =
  | "hdr"
  | "sepia"
  | "emboss"
  | "pixelate"
  | "blur"
  | "edge-detection"
  | "posterize"
  | "vignette"
  | "mosaic"
  | "halftone"
  | "glitch"
  | "kaleidoscope"
  | "CRT"
  | "rainbow-shift"
  | "swirl";
