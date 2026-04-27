"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { ThemeMode } from "../types/theme-types";
import { getDefaultThemeByTime, getUserTimezone, getStoredTheme, storeTheme } from "../utils/themeUtils";

type ThemeContextType = {
  mode: ThemeMode;
  toggleTheme: () => void;
  resetToDefault: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Check if user has a stored theme preference
    const storedTheme = getStoredTheme();

    if (storedTheme) {
      // Use stored preference if available
      setMode(storedTheme);
    } else {
      // Calculate default theme based on current time and timezone
      const userTimezone = getUserTimezone();
      const defaultTheme = getDefaultThemeByTime(userTimezone);
      setMode(defaultTheme);
    }

    setIsInitialized(true);
  }, []);

  const toggleTheme = () => {
    setMode((m) => {
      const newMode = m === "dark" ? "light" : "dark";
      // Store the user's manual preference
      storeTheme(newMode);
      return newMode;
    });
  };

  const resetToDefault = () => {
    const userTimezone = getUserTimezone();
    const defaultTheme = getDefaultThemeByTime(userTimezone);
    setMode(defaultTheme);
    // Clear stored preference to allow dynamic theme again
    localStorage.removeItem("theme-preference");
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, resetToDefault }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return ctx;
}
