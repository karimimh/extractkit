import { HSL, RGB } from "@images/types/color-types";

export function hexToRgb(hex?: string): RGB | undefined {
  if (!hex) return undefined;
  let match = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/.exec(hex);
  if (!match) {
    match = /^#?([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])$/.exec(hex);
    if (!match) return undefined;
    return {
      r: parseInt(match[1] + match[1], 16),
      g: parseInt(match[2] + match[2], 16),
      b: parseInt(match[3] + match[3], 16),
    };
  }
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

export function rgbToHex(rgb?: RGB): string | undefined {
  if (!rgb) return undefined;
  const { r, g, b }: RGB = rgb;
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function integerToHex(value?: number): string {
  if (value === undefined) return "";
  return `#${value.toString(16).padStart(6, "0")}`;
}

export function rgbToHsl(rgb?: RGB): HSL | undefined {
  if (!rgb) return undefined;
  let { r, g, b }: RGB = rgb;
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(hsl?: HSL): RGB | undefined {
  if (!hsl) return undefined;
  let { h, s, l }: HSL = hsl;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hexToHsl(hex?: string): HSL | undefined {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

export function hslToHex(hsl?: HSL): string | undefined {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

export function getColorFormats(color?: string, opacity?: number) {
  let rgb: RGB | undefined;
  let hsl: HSL | undefined;

  if (color?.startsWith("#")) {
    rgb = hexToRgb(color);
    hsl = rgbToHsl(rgb);
  } else if (color?.startsWith("rgb")) {
    const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/.exec(
      color
    );
    if (match) {
      rgb = {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
      opacity = match[4] !== undefined ? parseFloat(match[4]) : opacity;
      hsl = rgbToHsl(rgb);
    }
  } else if (color?.startsWith("hsl")) {
    const match =
      /hsla?\((\d+),\s*(\d+)%,\s*(\d+)%\s*(?:,\s*(\d*\.?\d+))?\)/.exec(color);
    if (match) {
      hsl = {
        h: parseInt(match[1]),
        s: parseInt(match[2]),
        l: parseInt(match[3]),
      };
      opacity = match[4] !== undefined ? parseFloat(match[4]) : opacity;
      rgb = hslToRgb(hsl);
    }
  }

  const hex = rgbToHex(rgb);
  const rgba = rgb
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
    : undefined;
  const hexWithAlpha =
    hex !== undefined && opacity !== undefined
      ? `${hex}${Math.round(opacity * 2.55)
          .toString(16)
          .padStart(2, "0")}`
      : undefined;
  const hsla = hsl
    ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${opacity})`
    : undefined;

  return {
    hex,
    hex_with_alpha: hexWithAlpha,
    hex_integer_value: rgb
      ? rgb.r * 256 * 256 + rgb.g * 256 + rgb.b
      : undefined,
    rgb_string: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : undefined,
    rgba_string: rgba,
    rgb: rgb ? { ...rgb, a: opacity } : undefined,
    hsl_string: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : undefined,
    hsla_string: hsla,
    hsl: hsl ? { ...hsl, a: opacity } : undefined,
  };
}

export type ColorFormats = ReturnType<typeof getColorFormats>;
