import { RGB } from "../../types/color-types";

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((r << 16) + (g << 8) + b).toString(16).padStart(6, "0")}`;
}

export function rgbToHsl(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

export function hslToRgb(
  h: number,
  s: number,
  l: number
): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 3) return q;
      if (t < 1 / 2) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function hexToRgb(hex?: string): RGB | undefined {
  if (!hex) return undefined;
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const srgbToLinear = (value: number): number => {
    return value / 255 <= 0.04045
      ? value / 255 / 12.92
      : Math.pow((value / 255 + 0.055) / 1.055, 2.4);
  };

  r = srgbToLinear(r);
  g = srgbToLinear(g);
  b = srgbToLinear(b);

  // Convert to XYZ using the sRGB D65 conversion matrix
  return [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
    (r * 0.2126729 + g * 0.7151522 + b * 0.072175) * 100,
    (r * 0.0193339 + g * 0.119192 + b * 0.9503041) * 100,
  ];
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const whitePoint = [95.047, 100.0, 108.883];

  const xyzToLabHelper = (value: number): number => {
    return value > 0.008856 ? Math.pow(value, 1 / 3) : 7.787 * value + 16 / 116;
  };

  x = xyzToLabHelper(x / whitePoint[0]);
  y = xyzToLabHelper(y / whitePoint[1]);
  z = xyzToLabHelper(z / whitePoint[2]);

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return [l, a, b];
}

export function rgbToLab(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

function labToXyz(l: number, a: number, b: number): [number, number, number] {
  const whitePoint = [95.047, 100.0, 108.883];

  const labToXyzHelper = (value: number): number => {
    return Math.pow(value, 3) > 0.008856
      ? Math.pow(value, 3)
      : (value - 16 / 116) / 7.787;
  };

  const y = (l + 16) / 116;
  const x = a / 500 + y;
  const z = y - b / 200;

  return [
    labToXyzHelper(x) * whitePoint[0],
    labToXyzHelper(y) * whitePoint[1],
    labToXyzHelper(z) * whitePoint[2],
  ];
}

function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  x /= 100;
  y /= 100;
  z /= 100;

  const linearToSrgb = (value: number): number => {
    return value <= 0.0031308
      ? value * 12.92
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  };

  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  r = linearToSrgb(r) * 255;
  g = linearToSrgb(g) * 255;
  b = linearToSrgb(b) * 255;

  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b))),
  ];
}

export function labToRgb(
  l: number,
  a: number,
  b: number
): [number, number, number] {
  const [x, y, z] = labToXyz(l, a, b);
  return xyzToRgb(x, y, z);
}
