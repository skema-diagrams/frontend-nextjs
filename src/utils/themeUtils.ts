/**
 * Utility functions for theme management with timezone support
 */

import { ThemeMode } from "../types/theme-types";

/**
 * Gets the default theme based on current time in user's timezone
 * Returns "light" theme between 7 AM and 5 PM (17:00)
 * Returns "dark" theme for all other hours
 *
 * @param timezone - Optional timezone string (e.g., "Asia/Calcutta"). If not provided, uses browser's local timezone
 * @returns "light" or "dark" based on current time
 */
export function getDefaultThemeByTime(timezone?: string): ThemeMode {
  try {
    // Get current time in the specified timezone
    const now = new Date();

    // Use Intl.DateTimeFormat to get the hour in the user's timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const hourString = formatter.format(now);
    const hour = parseInt(hourString, 10);

    // Day theme: 7 AM (7) to 5 PM (17) - inclusive of 7, exclusive of 17
    // Night theme: 5 PM (17) to 7 AM (7)
    if (hour >= 7 && hour < 17) {
      return "light";
    }

    return "dark";
  } catch (error) {
    // Fallback to dark theme if timezone calculation fails
    console.warn("Failed to calculate theme by time, defaulting to dark:", error);
    return "dark";
  }
}

/**
 * Gets the user's timezone from the browser
 * Uses Intl API to detect the system timezone
 *
 * @returns Timezone string (e.g., "Asia/Calcutta")
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback to UTC if detection fails
    return "UTC";
  }
}

/**
 * Checks if a theme preference is stored in localStorage
 *
 * @returns Stored theme mode or null if not found
 */
export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("theme-preference");
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return null;
}

/**
 * Stores theme preference in localStorage
 *
 * @param theme - Theme mode to store
 */
export function storeTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("theme-preference", theme);
}

/**
 * Clears stored theme preference from localStorage
 * This allows the app to use dynamic time-based theme again
 */
export function clearStoredTheme(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("theme-preference");
}
