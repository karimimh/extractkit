import { Colorization } from "@images/types/colorization-types";
import {
  applyClipping,
  applyDigitalNegative,
  applyThresholding,
  contrastStretch,
  convertToGrayscale,
  intensityLevelSlicing,
  logarithmicTransform,
  powerLawTransform,
} from "../cv/cv-point-ops";
import { applyColorReplacement } from "../adjustments/adjustments";

export const applyColorization = (
  colorization: Colorization,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (colorization.type === "convert-to-grayscale") {
    convertToGrayscale(ctx, canvasWidth, canvasHeight);
  } else if (colorization.type === "digital-negative") {
    applyDigitalNegative(ctx, canvasWidth, canvasHeight);
  } else if (colorization.type === "clipping") {
    applyClipping(
      ctx,
      canvasWidth,
      canvasHeight,
      colorization.minIntensity,
      colorization.maxIntensity
    );
  } else if (colorization.type === "thresholding") {
    applyThresholding(ctx, canvasWidth, canvasHeight, colorization.threshold);
  } else if (colorization.type === "contrast-stretching") {
    contrastStretch(
      ctx,
      canvasWidth,
      canvasHeight,
      colorization.s1,
      colorization.r1,
      colorization.s2,
      colorization.r2
    );
  } else if (colorization.type === "intensity-level-slicing") {
    intensityLevelSlicing(
      ctx,
      canvasWidth,
      canvasHeight,
      colorization.minIntensity,
      colorization.maxIntensity,
      colorization.withBackground
    );
  } else if (colorization.type === "logarithmic-transformation") {
    logarithmicTransform(ctx, canvasWidth, canvasHeight, colorization.c);
  } else if (colorization.type === "power-law-transformation") {
    powerLawTransform(ctx, canvasWidth, canvasHeight, colorization.c, colorization.gamma);
  } else if (colorization.type === "color-replacement") {
    applyColorReplacement(
      colorization.sourceColor,
      colorization.targetColor,
      colorization.range,
      ctx,
      canvasWidth,
      canvasHeight
    );
  }
};
