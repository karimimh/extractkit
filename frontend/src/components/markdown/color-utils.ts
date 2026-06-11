export const darkenColor = (color: string, amount = 0.1): string => {
  // Remove # if present
  const hex = color.replace("#", "");

  // Parse RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Darken each component
  const darkerR = Math.max(0, Math.floor(r * (1 - amount)));
  const darkerG = Math.max(0, Math.floor(g * (1 - amount)));
  const darkerB = Math.max(0, Math.floor(b * (1 - amount)));

  // Convert back to hex
  return `#${darkerR.toString(16).padStart(2, "0")}${darkerG.toString(16).padStart(2, "0")}${darkerB
    .toString(16)
    .padStart(2, "0")}`;
};

// Helper function to create a slightly different shade for backgrounds
export const getContrastBgColor = (baseColor?: string): string => {
  if (!baseColor) {
    return "rgba(0, 0, 0, 0.05)"; // Default light gray
  }

  // Handle hex colors
  if (baseColor.startsWith("#")) {
    const hex = baseColor.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // If light color, make it darker; if dark color, make it lighter
    if (brightness > 128) {
      return `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.3)`;
    } else {
      return `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(
        255,
        b + 50
      )}, 0.3)`;
    }
  }

  // Handle rgb/rgba colors
  if (baseColor.startsWith("rgb")) {
    const match = baseColor.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);

      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      if (brightness > 128) {
        return `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.3)`;
      } else {
        return `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(
          255,
          b + 50
        )}, 0.3)`;
      }
    }
  }

  // Handle named colors or fallback
  return "rgba(0, 0, 0, 0.05)";
};
