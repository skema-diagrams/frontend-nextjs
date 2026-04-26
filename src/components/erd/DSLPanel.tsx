/**
 * DSLPanel Component
 *
 * A textarea component for editing ERD DSL (Domain Specific Language) code.
 * Provides syntax highlighting support through theme-aware styling.
 *
 * @module DSLPanel
 */

"use client";

import { getERDTheme } from "@/lib/erd/theme";
import { ThemeMode } from "@/lib/erd/types";

/**
 * Props for DSLPanel component
 * @typedef {Object} Props
 * @property {string} value - The current DSL code content
 * @property {(value: string) => void} onChange - Callback fired when DSL content changes
 * @property {ThemeMode} theme - Current theme mode (dark or light)
 */
type Props = {
  value: string;
  onChange: (value: string) => void;
  theme: ThemeMode;
};

/**
 * DSLPanel Component
 *
 * Renders a textarea for editing ERD DSL with theme-aware styling.
 * Disables spell check and resize functionality for a clean editing experience.
 *
 * @param {Props} props - Component props
 * @param {string} props.value - Current DSL code
 * @param {Function} props.onChange - Handler for DSL content changes
 * @param {ThemeMode} props.theme - Current theme mode
 * @returns {JSX.Element} Styled textarea element
 */
export default function DSLPanel({ value, onChange, theme }: Props) {
  // Get theme colors based on current theme mode
  const erdTheme = getERDTheme(theme);

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="h-full w-full resize-none rounded-2xl border p-4 font-mono text-sm outline-none transition-colors"
      style={{
        borderColor: erdTheme.border,
        backgroundColor: erdTheme.panelMuted,
        color: erdTheme.text,
      }}
    />
  );
}
