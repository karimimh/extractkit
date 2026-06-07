export type ColorStyle = string | CanvasGradient | CanvasPattern;

export type Colorization = {
  category: "colorization";
  id: string;
} & (
  | {
      type: "digital-negative";
    }
  | {
      type: "thresholding";
      threshold: number;
    }
  | {
      type: "clipping";
      minIntensity: number;
      maxIntensity: number;
    }
  | {
      type: "contrast-stretching";
      s1: number;
      r1: number;
      s2: number;
      r2: number;
    }
  | {
      type: "intensity-level-slicing";
      minIntensity: number;
      maxIntensity: number;
      withBackground?: boolean;
    }
  | {
      type: "logarithmic-transformation";
      c?: number;
    }
  | {
      type: "power-law-transformation";
      c: number;
      gamma: number;
    }
  | {
      type: "convert-to-grayscale";
    }
  | {
      type: "color-replacement";
      sourceColor: string;
      targetColor: string;
      range: number;
    }
);
