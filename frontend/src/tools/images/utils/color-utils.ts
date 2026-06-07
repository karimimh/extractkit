export function getRGBChannels(data: Uint8ClampedArray) {
  const r = [];
  const g = [];
  const b = [];
  const a = [];
  for (let i = 0; i < data.length; i += 4) {
    r.push(data[i]);
    g.push(data[i + 1]);
    b.push(data[i + 2]);
    a.push(data[i + 3]);
  }
  return [r, g, b, a];
}

export function getInverseColor(hexColor: string): string {
  if (!hexColor.startsWith("#")) {
    hexColor = `#${hexColor}`;
  }

  const hexRegex = /^#([A-Fa-f0-9]{6})$/;
  if (!hexRegex.test(hexColor)) {
    throw new Error(
      "Invalid hex color format. Expected format is '#RRGGBB' or 'RRGGBB'."
    );
  }

  const color = hexColor.slice(1);

  const invertedColor = color
    .match(/.{2}/g)
    ?.map((component) => {
      const value = parseInt(component, 16);
      const inverseValue = 255 - value;
      return inverseValue.toString(16).padStart(2, "0");
    })
    .join("");

  if (!invertedColor) {
    throw new Error("An error occurred while calculating the inverse color.");
  }

  return `#${invertedColor}`;
}

export function generateColorWithOpacity(
  color: string | undefined,
  opacity: number
) {
  if (!color) return undefined;
  if (opacity < 0 || opacity > 100) {
    return undefined;
  }

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      color = `#${hex[0].repeat(2)}${hex[1].repeat(2)}${hex[2].repeat(2)}`;
    }
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100.0})`;
  } else if (color.startsWith("rgb(")) {
    const values = color.match(/\d+/g);
    if (!values || values.length !== 3) {
      return undefined;
    }
    const [r, g, b] = values;
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100.0})`;
  } else if (color.startsWith("hsl(")) {
    const values = color.match(/\d+\.?\d*%?/g);
    if (!values || values.length !== 3) {
      return undefined;
    }
    const [h, s, l] = values;
    return `hsla(${h}, ${s}, ${l}, ${opacity / 100.0})`;
  }
  return undefined;
}
