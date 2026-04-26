export type ThemeMode = "dark" | "light";

export type Theme = {
  background: string;
  panel: string;
  panelMuted: string;
  border: string;
  text: string;
  muted: string;
  edgeSelected: string;
  shadow: string;
};

export type ThemeMap = Record<ThemeMode, Theme>;
