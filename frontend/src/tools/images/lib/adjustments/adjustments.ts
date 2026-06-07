import { clamp } from "@images/utils/math-utils";
import { Adjustment } from "../../types/adjustment-types";
import { RGB } from "../../types/color-types";
import { hexToRgb, hslToRgb, rgbToHsl } from "../cv/cv-color-conversion";

export const applyAdjustment = (
  adjustment: Adjustment,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  if (adjustment.type === "brightness") {
    imageData = applyBrightness(adjustment.value, imageData);
  } else if (adjustment.type === "contrast") {
    imageData = applyContrast(adjustment.value, imageData);
  } else if (adjustment.type === "exposure") {
    imageData = applyExposure(adjustment.value, imageData);
  } else if (adjustment.type === "highlights") {
    imageData = applyHighlights(adjustment.value, imageData);
  } else if (adjustment.type === "shadows") {
    imageData = applyShadows(adjustment.value, imageData);
  } else if (adjustment.type === "hsb-hue") {
    imageData = applyHueAdjustment(adjustment.value, imageData);
  } else if (adjustment.type === "hsb-saturation") {
    imageData = applySaturationAdjustment(adjustment.value, imageData);
  } else if (adjustment.type === "hsb-brightness") {
    imageData = applyBrightnessAdjustment(adjustment.value, imageData);
  } else if (adjustment.type === "temperature") {
    imageData = applyTemperature(imageData, adjustment.value);
  } else if (adjustment.type === "tint") {
    imageData = applyTint(imageData, adjustment.value, adjustment.value, adjustment.value);
  } else if (adjustment.type === "vibrance") {
    imageData = applyVibrance(imageData, adjustment.value);
  }
  ctx.putImageData(imageData, 0, 0);
};

export const applyBrightness = (brightnessLevel: number, imageData: ImageData) => {
  // const adjustment = (brightnessLevel / 100) * 255;
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(imageData.data[i] + brightnessLevel); // Red
    imageData.data[i + 1] = clamp(imageData.data[i + 1] + brightnessLevel); // Green
    imageData.data[i + 2] = clamp(imageData.data[i + 2] + brightnessLevel); // Blue
  }
  return imageData;
};

export const applyContrast = (contrastLevel: number, imageData: ImageData) => {
  const scaledContrast = (contrastLevel / 100) * 255;

  const factor = (259 * (scaledContrast + 255)) / (255 * (259 - scaledContrast));

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(factor * (imageData.data[i] - 128) + 128); // Red
    imageData.data[i + 1] = clamp(factor * (imageData.data[i + 1] - 128) + 128); // Green
    imageData.data[i + 2] = clamp(factor * (imageData.data[i + 2] - 128) + 128); // Blue
  }
  return imageData;
};

export const applySaturation = (saturationLevel: number, imageData: ImageData) => {
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];

    const hsl = rgbToHsl(r, g, b);
    hsl[1] = Math.min(1, Math.max(0, hsl[1] * saturationLevel));
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);

    imageData.data[i] = rgb[0];
    imageData.data[i + 1] = rgb[1];
    imageData.data[i + 2] = rgb[2];
  }
  return imageData;
};

export const applyExposure = (exposureLevel: number, imageData: ImageData) => {
  const exposureFactor = Math.pow(2, exposureLevel / 100);
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(imageData.data[i] * exposureFactor); // Red
    imageData.data[i + 1] = clamp(imageData.data[i + 1] * exposureFactor); // Green
    imageData.data[i + 2] = clamp(imageData.data[i + 2] * exposureFactor); // Blue
  }
  return imageData;
};

export const applyShadows = (shadowsLevel: number, imageData: ImageData) => {
  const factor = shadowsLevel / 100 + 1; // shadowsLevel in [-100, 100]

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(adjustShadow(imageData.data[i], factor)); // Red
    imageData.data[i + 1] = clamp(adjustShadow(imageData.data[i + 1], factor)); // Green
    imageData.data[i + 2] = clamp(adjustShadow(imageData.data[i + 2], factor)); // Blue
  }
  return imageData;
};

const adjustShadow = (value: number, factor: number) => {
  return value < 128 ? value * factor : value;
};

export const applyHighlights = (highlightsLevel: number, imageData: ImageData) => {
  const factor = 1 - highlightsLevel / 100; // highlightsLevel in [-100, 100]

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(adjustHighlight(imageData.data[i], factor)); // Red
    imageData.data[i + 1] = clamp(adjustHighlight(imageData.data[i + 1], factor)); // Green
    imageData.data[i + 2] = clamp(adjustHighlight(imageData.data[i + 2], factor)); // Blue
  }
  return imageData;
};

const adjustHighlight = (value: number, factor: number) => {
  return value > 128 ? value * factor : value;
};

export const applySepia = (imageData: ImageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b); // Red
    data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b); // Green
    data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b); // Blue
  }
  return imageData;
};

const applyHueAdjustment = (hue: number, imageData: ImageData) => {
  if (hue === 0) return imageData;
  for (let i = 0; i < imageData.data.length; i += 4) {
    let [H, S, B] = rgbToHsl(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
    H = (H * 360 + hue) % 360;
    const [r, g, b] = hslToRgb((hue + H) / 360, S, B);
    imageData.data[i] = r;
    imageData.data[i + 1] = g;
    imageData.data[i + 2] = b;
  }
  return imageData;
};

const applySaturationAdjustment = (saturation: number, imageData: ImageData) => {
  if (saturation === 0) return imageData;
  for (let i = 0; i < imageData.data.length; i += 4) {
    let [H, S, B] = rgbToHsl(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
    S = clamp(S * 100 + saturation, 0, 100) / 100;
    const [r, g, b] = hslToRgb(H, S, B);
    imageData.data[i] = r;
    imageData.data[i + 1] = g;
    imageData.data[i + 2] = b;
  }
  return imageData;
};

const applyBrightnessAdjustment = (brightness: number, imageData: ImageData) => {
  if (brightness === 0) return imageData;
  for (let i = 0; i < imageData.data.length; i += 4) {
    let [H, S, B] = rgbToHsl(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
    B = clamp(B * 100 + brightness, 0, 100) / 100;
    const [r, g, b] = hslToRgb(H, S, B);
    imageData.data[i] = r;
    imageData.data[i + 1] = g;
    imageData.data[i + 2] = b;
  }
  return imageData;
};

export const applyTemperature = (imageData: ImageData, temperatureAdjust: number) => {
  const temperatureScale = temperatureAdjust / 100;
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(imageData.data[i] + 255 * temperatureScale);
    imageData.data[i + 1] = imageData.data[i + 1];
    imageData.data[i + 2] = clamp(imageData.data[i + 2] - 255 * temperatureScale);
  }
  return imageData;
};

export const applyTint = (
  imageData: ImageData,
  tintR: number,
  tintG: number,
  tintB: number,
  tintFactor = 0.5 // 0..1
) => {
  for (let i = 0; i < imageData.data.length; i += 4) {
    let r = imageData.data[i];
    let g = imageData.data[i + 1];
    let b = imageData.data[i + 2];

    r = clamp(r * (1 - tintFactor) + tintR * tintFactor);
    g = clamp(g * (1 - tintFactor) + tintG * tintFactor);
    b = clamp(b * (1 - tintFactor) + tintB * tintFactor);

    imageData.data[i] = r;
    imageData.data[i + 1] = g;
    imageData.data[i + 2] = b;
  }

  return imageData;
};

const applyRGBBalance = (
  redAdjust: number,
  greenAdjust: number,
  blueAdjust: number,
  imageData: ImageData
) => {
  if (redAdjust === 0 && greenAdjust === 0 && blueAdjust === 0) return imageData;
  const red = (redAdjust + 100) / 100;
  const green = (greenAdjust + 100) / 100;
  const blue = (blueAdjust + 100) / 100;
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(imageData.data[i] * red);
    imageData.data[i + 1] = clamp(imageData.data[i + 1] * green);
    imageData.data[i + 2] = clamp(imageData.data[i + 2] * blue);
  }

  return imageData;
};

export const applyDuoTone = (imageData: ImageData, darkColor: string, lightColor: string) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    data[i] = parseInt(darkColor.slice(1, 3), 16); // Red
    data[i + 1] = parseInt(lightColor.slice(1, 3), 16); // Green
    data[i + 2] = parseInt(darkColor.slice(3, 5), 16); // Blue
    data[i + 3] = luminance; // Alpha (transparency)
  }
  return imageData;
};

export const applyCrossProcess = (imageData: ImageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b); // Red
    data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b); // Green
    data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b); // Blue
  }
  return imageData;
};

export const applyVibrance = (imageData: ImageData, vibrance: number) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const avg = (r + g + b) / 3;
    const amt = (((Math.abs(max - avg) * 2) / 255) * vibrance) / 100;

    data[i] = Math.min(255, Math.max(0, r + (r - avg) * amt));
    data[i + 1] = Math.min(255, Math.max(0, g + (g - avg) * amt));
    data[i + 2] = Math.min(255, Math.max(0, b + (b - avg) * amt));
  }
  return imageData;
};

export const applyColorBalance = (
  imageData: ImageData,
  redBalance: number,
  greenBalance: number,
  blueBalance: number
) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + redBalance)); // Red
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + greenBalance)); // Green
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + blueBalance)); // Blue
  }
  return imageData;
};

export const applyShadowAndHighlight = (
  imageData: ImageData,
  shadows: number, // Adjusts the dark areas
  highlights: number // Adjusts the bright areas
) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const avg = (r + g + b) / 3;

    if (avg < 128) {
      // Shadows
      r = r + r * (shadows / 100);
      g = g + g * (shadows / 100);
      b = b + b * (shadows / 100);
    } else {
      // Highlights
      r = r + (255 - r) * (highlights / 100);
      g = g + (255 - g) * (highlights / 100);
      b = b + (255 - b) * (highlights / 100);
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
  return imageData;
};

export const applySimpleOilPainting = (imageData: ImageData) => {
  const data = imageData.data;
  const radius = 3; // Brush radius
  const intensityLevels = 256;
  const intensityBins = new Uint8Array(intensityLevels);
  const redBins = new Uint8Array(intensityLevels);
  const greenBins = new Uint8Array(intensityLevels);
  const blueBins = new Uint8Array(intensityLevels);

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      intensityBins.fill(0);
      redBins.fill(0);
      greenBins.fill(0);
      blueBins.fill(0);

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < imageData.width && ny >= 0 && ny < imageData.height) {
            const index = (ny * imageData.width + nx) * 4;
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const intensity = (red + green + blue) / 3;
            const bin = Math.floor(intensity / intensityLevels);

            intensityBins[bin]++;
            redBins[bin] += red;
            greenBins[bin] += green;
            blueBins[bin] += blue;
          }
        }
      }

      let maxBin = 0;
      for (let i = 1; i < intensityLevels; i++) {
        if (intensityBins[i] > intensityBins[maxBin]) {
          maxBin = i;
        }
      }

      const index = (y * imageData.width + x) * 4;
      data[index] = redBins[maxBin] / intensityBins[maxBin];
      data[index + 1] = greenBins[maxBin] / intensityBins[maxBin];
      data[index + 2] = blueBins[maxBin] / intensityBins[maxBin];
    }
  }
  return imageData;
};

export const applyGaussianBlur = (imageData: ImageData) => {
  const data = imageData.data;
  const radius = 5;
  const kernelSize = (radius * 2 + 1) ** 2;
  const kernel = new Float32Array(kernelSize);

  // Create Gaussian kernel
  const sigma = radius / 3;
  const twoSigmaSq = 2 * sigma * sigma;
  let kernelSum = 0;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const value = Math.exp(-(x * x + y * y) / twoSigmaSq) / (Math.PI * twoSigmaSq);
      kernel[(y + radius) * (2 * radius + 1) + (x + radius)] = value;
      kernelSum += value;
    }
  }
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }

  // Apply kernel to image
  const blurredData = new Uint8ClampedArray(data.length);
  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      let red = 0,
        green = 0,
        blue = 0,
        alpha = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          if (ny >= 0 && ny < imageData.height && nx >= 0 && nx < imageData.width) {
            const index = (ny * imageData.width + nx) * 4;
            const weight = kernel[(ky + radius) * (2 * radius + 1) + (kx + radius)];
            red += data[index] * weight;
            green += data[index + 1] * weight;
            blue += data[index + 2] * weight;
            alpha += data[index + 3] * weight;
          }
        }
      }
      const index = (y * imageData.width + x) * 4;
      blurredData[index] = red;
      blurredData[index + 1] = green;
      blurredData[index + 2] = blue;
      blurredData[index + 3] = alpha;
    }
  }

  imageData.data.set(blurredData);
  return imageData;
};

export const applyEdgeDetection = (imageData: ImageData) => {
  const data = imageData.data;

  // Simple Sobel edge detection kernel
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  const edgeData = new Uint8ClampedArray(data.length);
  for (let y = 1; y < imageData.height - 1; y++) {
    for (let x = 1; x < imageData.width - 1; x++) {
      let gxRed = 0,
        gxGreen = 0,
        gxBlue = 0;
      let gyRed = 0,
        gyGreen = 0,
        gyBlue = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          const index = (ny * imageData.width + nx) * 4;
          const weightX = sobelX[(ky + 1) * 3 + (kx + 1)];
          const weightY = sobelY[(ky + 1) * 3 + (kx + 1)];

          gxRed += data[index] * weightX;
          gxGreen += data[index + 1] * weightX;
          gxBlue += data[index + 2] * weightX;

          gyRed += data[index] * weightY;
          gyGreen += data[index + 1] * weightY;
          gyBlue += data[index + 2] * weightY;
        }
      }

      const red = Math.sqrt(gxRed * gxRed + gyRed * gyRed);
      const green = Math.sqrt(gxGreen * gxGreen + gyGreen * gyGreen);
      const blue = Math.sqrt(gxBlue * gxBlue + gyBlue * gyBlue);

      const index = (y * imageData.width + x) * 4;
      edgeData[index] = red;
      edgeData[index + 1] = green;
      edgeData[index + 2] = blue;
      edgeData[index + 3] = data[index + 3];
    }
  }

  imageData.data.set(edgeData);
  return imageData;
};

export const applyWatercolor = (imageData: ImageData) => {
  return applyEdgeDetection(applyGaussianBlur(imageData));
};

export const applysketch = (imageData: ImageData) => {
  return applyEdgeDetection(applyBlackAndWhite(imageData));
};

export const applyMedian = (imageData: ImageData) => {
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);
  const radius = 1; // Median filter radius

  function getPixel(x: number, y: number, c: number) {
    return data[(y * imageData.width + x) * 4 + c];
  }

  function setPixel(x: number, y: number, c: number, value: number) {
    result[(y * imageData.width + x) * 4 + c] = value;
  }

  for (let y = radius; y < imageData.height - radius; y++) {
    for (let x = radius; x < imageData.width - radius; x++) {
      for (let c = 0; c < 3; c++) {
        const values = [];
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            values.push(getPixel(x + kx, y + ky, c));
          }
        }
        values.sort((a, b) => a - b);
        const median = values[Math.floor(values.length / 2)];
        setPixel(x, y, c, median);
      }
      setPixel(x, y, 3, getPixel(x, y, 3)); // Copy alpha
    }
  }

  imageData.data.set(result);
  return imageData;
};

export const applyColorQuantization = (imageData: ImageData) => {
  const data = imageData.data;
  const levels = 8; // Number of color levels per channel

  function quantize(value: number) {
    return Math.floor((value / 256) * levels) * (256 / levels);
  }

  for (let i = 0; i < data.length; i += 4) {
    data[i] = quantize(data[i]);
    data[i + 1] = quantize(data[i + 1]);
    data[i + 2] = quantize(data[i + 2]);
  }
  return imageData;
};

export const applyCartoon = (imageData: ImageData) => {
  return applyColorQuantization(applyEdgeDetection(applyMedian(imageData)));
};

export const applyBrushStrokes = (imageData: ImageData) => {
  const data = imageData.data;

  function getPixel(x: number, y: number) {
    const index = (y * imageData.width + x) * 4;
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3],
    };
  }

  function setPixel(x: number, y: number, color: { r: number; g: number; b: number; a: number }) {
    const index = (y * imageData.width + x) * 4;
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = color.a;
  }

  const brushSize = 5; // Size of the brush strokes
  for (let y = 0; y < imageData.height; y += brushSize) {
    for (let x = 0; x < imageData.width; x += brushSize) {
      const color = getPixel(x, y);
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < imageData.width && ny >= 0 && ny < imageData.height) {
            setPixel(nx, ny, color);
          }
        }
      }
    }
  }
  return imageData;
};

export const applyImpressionist = (imageData: ImageData) => {
  return applyBrushStrokes(imageData);
};

const colorDistance = (color1: RGB, color2: RGB) => {
  const { r: r1, g: g1, b: b1 } = color1;
  const { r: r2, g: g2, b: b2 } = color2;
  return Math.sqrt((r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2));
};

export const applyColorReplacement = (
  sourceColor: string,
  targetColor: string,
  threshold: number,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  // const scaledThreshold = (threshold / 100) * 255;
  const { r: newR, g: newG, b: newB } = hexToRgb(targetColor) as RGB;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const currentColor: RGB = { r, g, b };
    if (colorDistance(currentColor, hexToRgb(sourceColor) as RGB) < threshold) {
      imageData.data[i] = clamp(newR);
      imageData.data[i + 1] = clamp(newG);
      imageData.data[i + 2] = clamp(newB);
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

/**
 * The black point of an image is the darkest pixel value in the image,
 * which represents the point at which pixels are considered "true black."
 *  Adjusting the black point can deepen the shadows and increase contrast
 * by bringing lower brightness values closer to black, often enhancing detail in dark areas.
 * This is commonly adjusted in image editing software to improve tonal balance and overall contrast.
 */
export const adjustBlackPoint = (blackPoint: number, imageData: ImageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, data[i] - blackPoint);
    data[i + 1] = Math.max(0, data[i + 1] - blackPoint);
    data[i + 2] = Math.max(0, data[i + 2] - blackPoint);
    // Alpha channel remains unchanged
  }
  return imageData;
};
