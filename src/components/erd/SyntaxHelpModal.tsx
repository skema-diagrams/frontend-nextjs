/**
 * SyntaxHelpModal Component
 *
 * A modal dialog displaying ERD DSL syntax help and reference documentation.
 * Provides comprehensive guide for DSL syntax including entity definitions,
 * relationships, properties, and available colors.
 *
 * @module SyntaxHelpModal
 */

"use client";

import { useEffect } from "react";
import { getERDTheme } from "@/lib/erd/theme";
import { ThemeMode } from "@/lib/erd/types";

/**
 * Props for SyntaxHelpModal component
 * @typedef {Object} Props
 * @property {boolean} isOpen - Whether the modal is visible
 * @property {() => void} onClose - Callback to close the modal
 * @property {ThemeMode} theme - Current theme mode (dark or light)
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
};

/**
 * SyntaxHelpModal Component
 *
 * Displays a modal with ERD DSL syntax documentation.
 * Supports keyboard navigation (Escape to close) and theme-aware styling.
 *
 * @param {Props} props - Component props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Handler to close the modal
 * @param {ThemeMode} props.theme - Current theme mode
 * @returns {JSX.Element | null} Modal dialog or null if not open
 */
export default function SyntaxHelpModal({ isOpen, onClose, theme }: Props) {
  // Get theme colors based on current theme mode
  const erdTheme = getERDTheme(theme);

  /**
   * Effect: Handle Escape key to close modal
   * Adds keyboard event listener when modal is open
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Close modal when Escape key is pressed
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  /**
   * Syntax rules and examples organized by category
   * Each section contains items with descriptions and code examples
   */
  const syntaxRules = [
    {
      section: "Entity Definition",
      items: [
        {
          description: "Create table",
          example: "users { ... }",
        },
        {
          description: "Table with properties",
          example: "users [icon: user, color: purple] { ... }",
        },
        {
          description: "Add field",
          example: "id string pk",
        },
        {
          description: "Field modifiers",
          example: "pk | fk | uq",
        },
      ],
    },
    {
      section: "Relationships",
      items: [
        {
          description: "One to One",
          example: "users.profile_id - profiles.id",
        },
        {
          description: "One to Many",
          example: "users.id < posts.user_id",
        },
        {
          description: "Many to One",
          example: "posts.user_id > users.id",
        },
        {
          description: "Many to Many",
          example: "teams.id <> users.id",
        },
      ],
    },
    {
      section: "Relationship Properties",
      items: [
        {
          description: "Colored relationship",
          example: "users.id < posts.user_id [color: green]",
        },
      ],
    },
    {
      section: "Comments",
      items: [
        {
          description: "Add a comment",
          example: "// This is a comment",
        },
      ],
    },
    {
      section: "Diagram Properties",
      items: [
        {
          description: "colorMode",
          example: "pastel | bold | outline",
        },
        {
          description: "styleMode",
          example: "shadow | plain | watercolor",
        },
        {
          description: "typeface",
          example: "rough | clean | mono",
        },
        {
          description: "notation",
          example: "crows-feet | chen",
        },
        {
          description: "title",
          example: "title My ERD Diagram",
        },
      ],
    },
    {
      section: "Available Colors",
      items: [
        {
          description: "Named colors",
          example: "blue, green, purple, red, orange, yellow, pink, teal, cyan, indigo, gray, slate",
        },
        {
          description: "Hex colors",
          example: "#4F8CFF",
        },
      ],
    },
  ];

  return (
    // Modal backdrop - click to close
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      {/* Modal container */}
      <div
        className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: erdTheme.panel,
          borderColor: erdTheme.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: erdTheme.border }}
        >
          <h2 className="text-xl font-semibold" style={{ color: erdTheme.text }}>
            Syntax Help
          </h2>
          {/* Close button with keyboard shortcut hint */}
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: erdTheme.panelMuted,
              color: erdTheme.muted,
            }}
          >
            Close <span className="ml-1 text-xs">Esc</span>
          </button>
        </div>

        {/* Modal Content - Scrollable syntax rules */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 80px)" }}>
          {/* Render each syntax rule section */}
          {syntaxRules.map((section, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              {/* Section title */}
              <h3
                className="mb-3 text-sm font-semibold uppercase tracking-wide"
                style={{ color: erdTheme.muted }}
              >
                {section.section}
              </h3>
              {/* Section items grid */}
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="grid grid-cols-[200px_1fr] gap-4 rounded-lg border px-4 py-3"
                    style={{
                      backgroundColor: erdTheme.panelMuted,
                      borderColor: erdTheme.border,
                    }}
                  >
                    {/* Item description */}
                    <div className="text-sm font-medium" style={{ color: erdTheme.text }}>
                      {item.description}
                    </div>
                    {/* Code example */}
                    <div className="font-mono text-sm" style={{ color: erdTheme.muted }}>
                      {item.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
