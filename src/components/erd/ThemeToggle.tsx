/**
 * ThemeToggle Component
 *
 * A button component for toggling between dark and light theme modes.
 * Displays the opposite theme name as button text and applies theme-specific styling.
 *
 * @module ThemeToggle
 */

"use client";

/**
 * Props for ThemeToggle component
 * @typedef {Object} Props
 * @property {"dark" | "light"} theme - Current theme mode
 * @property {() => void} onToggle - Callback fired when theme toggle button is clicked
 */
type Props = {
  theme: "dark" | "light";
  onToggle: () => void;
};

/**
 * ThemeToggle Component
 *
 * Renders a button that toggles between dark and light themes.
 * Button styling changes based on current theme mode.
 *
 * @param {Props} props - Component props
 * @param {"dark" | "light"} props.theme - Current theme mode
 * @param {Function} props.onToggle - Handler for theme toggle
 * @returns {JSX.Element} Styled theme toggle button
 */
export default function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
        // Apply theme-specific styling
        theme === "dark"
          ? "border-neutral-700 bg-[#1A1A1A] text-white hover:bg-[#222222]"
          : "border-neutral-300 bg-white text-black hover:bg-neutral-100"
      }`}
    >
      {/* Display opposite theme name as button text */}
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
