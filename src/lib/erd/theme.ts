/**
 * Theme Module
 *
 * Defines color schemes, dimensions, and styling utilities for the ERD editor.
 * Provides theme-aware color resolution and color manipulation functions.
 *
 * @module theme
 */

import { ThemeMode } from "./types";

/**
 * Table node width in pixels
 * @constant {number}
 */
export const ERD_TABLE_WIDTH = 308;

/**
 * Table header height in pixels
 * @constant {number}
 */
export const ERD_HEADER_HEIGHT = 52;

/**
 * Height of each field row in pixels
 * @constant {number}
 */
export const ERD_ROW_HEIGHT = 40;

/**
 * Title node height in pixels
 * @constant {number}
 */
export const ERD_TITLE_HEIGHT = 64;

/**
 * Named color palette for ERD diagrams
 * Maps color names to hex values
 * @type {Record<string, string>}
 */
const colorMap: Record<string, string> = {
  blue: "#4F8CFF",
  green: "#32C76F",
  purple: "#9B7BFF",
  red: "#F97066",
  orange: "#F79009",
  yellow: "#F5C451",
  pink: "#EE46BC",
  teal: "#2ED3B7",
  cyan: "#00FFFF",
  indigo: "#6172F3",
  gray: "#98A2B3",
  slate: "#94A3B8",

  // Added colors
  lime: "#84CC16",
  emerald: "#10B981",
  violet: "#8B5CF6",
  fuchsia: "#D946EF",
  rose: "#F43F5E",
  amber: "#F59E0B",
  sky: "#0EA5E9",
  lightBlue: "#38BDF8",
  darkBlue: "#1D4ED8",
  darkGreen: "#166534",
  brown: "#A16207",
  beige: "#F5F5DC",
  cream: "#FFFDD0",
  black: "#000000",
  white: "#FFFFFF",
  zinc: "#71717A",
  neutral: "#737373",
  stone: "#78716C",
  charcoal: "#36454F",
};

/**
 * Theme color definitions for dark and light modes
 * Each theme includes colors for backgrounds, text, borders, and UI elements
 * @type {Object}
 */
export const themes = {
  dark: {
    background: "#171717",
    panel: "#101113",
    panelMuted: "#141518",
    border: "#2A2D31",
    text: "#F5F5F5",
    muted: "#A0A7B4",
    tableBackground: "#1D2025",
    tableHeader: "#22262C",
    tableBorder: "#8D9198",
    tableDivider: "#434851",
    edge: "#ECECEC",
    edgeSelected: "#00FFFF", // ← Add this (cyan for dark theme)
    shadow: "0 18px 48px rgba(0, 0, 0, 0.34)",
    minimapBackground: "#0F1114",
    minimapNode: "#2A2D31",
  },

  light: {
    background: "#F3F4F6",
    panel: "#FFFFFF",
    panelMuted: "#F8FAFC",
    border: "#D0D5DD",
    text: "#101828",
    muted: "#667085",
    tableBackground: "#FFFFFF",
    tableHeader: "#F8FAFC",
    tableBorder: "#B8C0CC",
    tableDivider: "#E4E7EC",
    edge: "#344054",
    edgeSelected: "#F97066", // ← Add this (red for light theme)
    shadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
    minimapBackground: "#FFFFFF",
    minimapNode: "#D0D5DD",
  },
};

/**
 * Gets the complete theme object for a given theme mode
 *
 * @param {ThemeMode} mode - Theme mode (dark or light)
 * @returns {typeof themes.dark} Theme color object
 */
export function getERDTheme(mode: ThemeMode) {
  return themes[mode];
}

/**
 * Calculates the total height of a table node based on field count
 * Height = header height + (field count * row height)
 * Minimum height is header + 1 row
 *
 * @param {number} fieldCount - Number of fields in the table
 * @returns {number} Total table node height in pixels
 */
export function getTableNodeHeight(fieldCount: number) {
  return ERD_HEADER_HEIGHT + Math.max(fieldCount, 1) * ERD_ROW_HEIGHT;
}

/**
 * Resolves a color name or hex value to a hex color string
 * Supports named colors from colorMap and direct hex values
 * Falls back to provided fallback color if resolution fails
 *
 * @param {string} [color] - Color name or hex value
 * @param {string} [fallback] - Fallback color if resolution fails
 * @returns {string | undefined} Resolved hex color or fallback
 */
export function resolveDiagramColor(color?: string, fallback?: string) {
  if (!color) return fallback;

  const normalized = color.trim().toLowerCase();

  // Return hex values as-is
  if (normalized.startsWith("#")) {
    return normalized;
  }

  // Look up named color or return fallback
  return colorMap[normalized] ?? fallback;
}

/**
 * Converts a hex color to RGBA format with specified alpha value
 * Handles both 3-digit and 6-digit hex colors
 *
 * @param {string} color - Hex color value
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function withAlpha(color: string, alpha: number) {
  const resolved = resolveDiagramColor(color, color);

  if (!resolved?.startsWith("#")) {
    return resolved;
  }

  const hex = resolved.slice(1);
  // Expand 3-digit hex to 6-digit (e.g., #ABC -> #AABBCC)
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((value) => value + value)
          .join("")
      : hex;

  // Parse RGB components from hex
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Adjusts a color for field names in tables based on theme mode
 * Dark mode: Lightens by mixing with white (~60% ratio)
 * Light mode: Darkens by mixing with black (~40% ratio)
 * This ensures good contrast in both themes
 *
 * @param {string} color - Hex color value
 * @param {ThemeMode} [mode="dark"] - Theme mode for adjustment
 * @returns {string} Adjusted hex color
 */
export function lightenForFieldName(color: string, mode: ThemeMode = "dark") {
  const resolved = resolveDiagramColor(color, color);

  if (!resolved?.startsWith("#")) {
    return resolved;
  }

  const hex = resolved.slice(1);
  // Expand 3-digit hex to 6-digit
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((value) => value + value)
          .join("")
      : hex;

  // Parse RGB components from hex
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  let newRed: number, newGreen: number, newBlue: number;

  if (mode === "dark") {
    // Dark mode: lighten by mixing with white at ~60% ratio
    const lighten = (value: number) => Math.round(value + (255 - value) * 0.6);
    newRed = lighten(red);
    newGreen = lighten(green);
    newBlue = lighten(blue);
  } else {
    // Light mode: darken by mixing with black at ~40% ratio
    const darken = (value: number) => Math.round(value * 0.6);
    newRed = darken(red);
    newGreen = darken(green);
    newBlue = darken(blue);
  }

  // Convert back to hex format
  return `#${newRed.toString(16).padStart(2, "0")}${newGreen.toString(16).padStart(2, "0")}${newBlue.toString(16).padStart(2, "0")}`;
}
