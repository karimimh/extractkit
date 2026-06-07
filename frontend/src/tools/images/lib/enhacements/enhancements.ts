import { round } from "@images/utils/math-utils";
import { Enhancement } from "../../types/enhancement-types";
import { getRGBChannels } from "../../utils/color-utils";
import { histogramEqualization } from "../cv/cv-enhancement-ops";

export const applyEnhancement = (
  enhancement: Enhancement,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (enhancement.type === "color-enhancement") {
    enhanceImageColors(ctx, canvasWidth, canvasHeight);
  }
};

export async function enhanceImageColors(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  let data = imageData.data;

  const [r, g, b, a] = getRGBChannels(data);

  const equalizedR = histogramEqualization(r);
  const equalizedG = histogramEqualization(g);
  const equalizedB = histogramEqualization(b);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = equalizedR[round(data[i])];
    data[i + 1] = equalizedG[round(data[i + 1])];
    data[i + 2] = equalizedB[round(data[i + 2])];
  }

  ctx.putImageData(imageData, 0, 0);
}
