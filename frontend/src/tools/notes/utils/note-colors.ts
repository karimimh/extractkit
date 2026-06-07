import type { Note } from "@notes/types/note-types";
import { NOTE_COLORS } from "@notes/components/notes/note-details/note-color-controls";

/**
 * Get the dark mode variant of a color
 * @param textColor - Text color in light mode
 * @param bgColor - Background color in light mode
 * @param type - Whether to get text or background color
 * @returns Dark mode color variant
 */
export const getDarkModeColor = (
  textColor: string,
  bgColor: string,
  type: "text" | "bg"
): string => {
  const colorScheme = NOTE_COLORS.find(c => c.textColor === textColor && c.bgColor === bgColor);

  if (!colorScheme) {
    // Fallback: return the original color if no matching scheme found
    return type === "text" ? textColor : bgColor;
  }

  return type === "text" ? colorScheme.darkTextColor : colorScheme.darkBgColor;
};

/**
 * Invert a hex color (deprecated - use getDarkModeColor instead)
 * @param hex - Hex color string (e.g., "#ffffff")
 * @returns Inverted hex color string
 * @deprecated Use getDarkModeColor for predefined color schemes
 */
export const invertColor = (hex: string): string => {
  if (!hex || !hex.startsWith("#")) return hex;

  // Remove the hash
  const hexWithoutHash = hex.slice(1);

  // Convert to RGB
  const r = parseInt(hexWithoutHash.substr(0, 2), 16);
  const g = parseInt(hexWithoutHash.substr(2, 2), 16);
  const b = parseInt(hexWithoutHash.substr(4, 2), 16);

  // Invert
  const invertedR = (255 - r).toString(16).padStart(2, "0");
  const invertedG = (255 - g).toString(16).padStart(2, "0");
  const invertedB = (255 - b).toString(16).padStart(2, "0");

  return `#${invertedR}${invertedG}${invertedB}`;
};

/**
 * Generate inline styles for note colors
 * @param note - The note object
 * @param isDarkMode - Whether dark mode is active
 * @returns React CSSProperties object with color and background color
 */
export const getNoteColorStyles = (note: Note, isDarkMode = false): React.CSSProperties => {
  if (isDarkMode) {
    return {
      color: getDarkModeColor(note.color, note.bg_color, "text"),
      backgroundColor: getDarkModeColor(note.color, note.bg_color, "bg"),
    };
  }

  return {
    color: note.color,
    backgroundColor: note.bg_color,
  };
};

/**
 * Check if a note has any custom colors
 * @param note - The note object
 * @returns boolean indicating if the note has custom colors
 */
export const hasCustomColors = (note: Note): boolean => {
  return note.color !== "#000000" || note.bg_color !== "#ffffff";
};

/**
 * Get text color that provides good contrast with the background
 * @param bgColor - Background color in hex format
 * @returns 'black' or 'white' based on contrast
 */
export const getContrastColor = (bgColor?: string): string => {
  if (!bgColor) return "inherit";

  // Remove # from hex color
  const hex = bgColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? "#000000" : "#ffffff";
};
