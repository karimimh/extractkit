import { clamp, round } from "@images/utils/math-utils";

export const applyDigitalNegative = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
  }
  ctx.putImageData(imageData, 0, 0);
};

export const applyThresholding = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  threshold: number
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const newIntensity = intensity < threshold ? 0 : 255;
    data[i] = newIntensity; // Red
    data[i + 1] = newIntensity; // Green
    data[i + 2] = newIntensity; // Blue
  }
  ctx.putImageData(imageData, 0, 0);
};

export const applyClipping = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  minIntensity: number,
  maxIntensity: number
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i], minIntensity, maxIntensity); // Red
    data[i + 1] = clamp(data[i + 1], minIntensity, maxIntensity); // Green
    data[i + 2] = clamp(data[i + 2], minIntensity, maxIntensity); // Blue
  }
  ctx.putImageData(imageData, 0, 0);
};

export const contrastStretch = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  s1: number,
  r1: number,
  s2: number,
  r2: number
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] =
      data[i] < r1 ? s1 * data[i] : data[i] > r2 ? s2 * data[i] : data[i]; // Red
    data[i + 1] =
      data[i + 1] < r1
        ? s1 * data[i + 1]
        : data[i + 1] > r2
        ? s2 * data[i + 1]
        : data[i + 1]; // Green
    data[i + 2] =
      data[i + 2] < r1
        ? s1 * data[i + 2]
        : data[i + 2] > r2
        ? s2 * data[i + 2]
        : data[i + 2]; // Blue
  }
  ctx.putImageData(imageData, 0, 0);
};

export const intensityLevelSlicing = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  rangeLow: number,
  rangeHigh: number,
  withBackground = false,
  _minIntensity = 0,
  maxIntensity = 255
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (intensity >= rangeLow && intensity <= rangeHigh) {
      data[i] = maxIntensity; // Red
      data[i + 1] = maxIntensity; // Green
      data[i + 2] = maxIntensity; // Blue
    } else if (withBackground) {
      data[i] = 0; // Red
      data[i + 1] = 0; // Green
      data[i + 2] = 0; // Blue
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

export const logarithmicTransform = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  c = 25,
  minIntensity = 0,
  maxIntensity = 255
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(
      round(c * Math.log(1 + data[i])),
      minIntensity,
      maxIntensity
    ); // Red
    data[i + 1] = clamp(
      round(c * Math.log(1 + data[i + 1])),
      minIntensity,
      maxIntensity
    ); // Green
    data[i + 2] = clamp(
      round(c * Math.log(1 + data[i + 2])),
      minIntensity,
      maxIntensity
    ); // Blue
  }
  ctx.putImageData(imageData, 0, 0);
};

export const powerLawTransform = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  c = 1,
  gamma = 1,
  minIntensity = 0,
  maxIntensity = 255
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(
      round(c * Math.pow(data[i], gamma)),
      minIntensity,
      maxIntensity
    ); // Red
    data[i + 1] = clamp(
      round(c * Math.pow(data[i + 1], gamma)),
      minIntensity,
      maxIntensity
    ); // Green
    data[i + 2] = clamp(
      round(c * Math.pow(data[i + 2], gamma)),
      minIntensity,
      maxIntensity
    ); // Blue
  }
  ctx.putImageData(imageData, 0, 0);
};

export const convertToGrayscale = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = intensity; // Red
    data[i + 1] = intensity; // Green
    data[i + 2] = intensity; // Blue
  }
  ctx.putImageData(imageData, 0, 0);
};
