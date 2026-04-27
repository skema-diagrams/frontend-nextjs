"use client";

import Link from "next/link";
import Image from "next/image";

import { useTheme } from "@/providers/ThemeProvider";
import { ThemeMap } from "../types/theme-types";

const themes: ThemeMap = {
  dark: {
    background: "#171717",
    panel: "#101113",
    panelMuted: "#141518",
    border: "#2A2D31",
    text: "#F5F5F5",
    muted: "#A0A7B4",
    edgeSelected: "#00FFFF",
    shadow: "0 18px 48px rgba(0, 0, 0, 0.34)",
  },

  light: {
    background: "#F3F4F6",
    panel: "#FFFFFF",
    panelMuted: "#F8FAFC",
    border: "#D0D5DD",
    text: "#101828",
    muted: "#667085",
    edgeSelected: "#F97066",
    shadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
  },
};

export default function HomePage() {
  const { mode, toggleTheme } = useTheme();
  const theme = themes[mode];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          color: theme.text,
          padding: "8px 14px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {mode === "dark" ? "Light Mode" : "Dark Mode"}
      </button>

      {/* Logo */}
      <div style={{ marginBottom: "40px" }}>
        <Image src="/skema-logo.png" alt="Skema Logo" width={120} height={120} priority />
      </div>

      {/* Hero */}
      <section style={{ textAlign: "center", maxWidth: "720px" }}>
        <h1 style={{ fontSize: "44px", marginBottom: "16px" }}>Diagram Builder</h1>

        <p style={{ fontSize: "18px", color: theme.muted }}>
          Build diagrams effortlessly. Use a visual canvas or generate ERDs from structured data — all in one
          unified tool.
        </p>
      </section>

      {/* Cards */}
      <section
        style={{
          display: "flex",
          gap: "24px",
          marginTop: "60px",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "stretch", // ✅ ensures equal height
        }}
      >
        {/* DRAW */}
        <Link href="/draw" style={{ textDecoration: "none" }}>
          <div
            style={{
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              borderRadius: "16px",
              padding: "28px",
              width: "260px",
              height: "200px", // ✅ consistent height
              boxShadow: theme.shadow,
              transition: "0.2s",
              cursor: "pointer",

              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between", // ✅ balances content
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.edgeSelected)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
          >
            <div>
              <h2 style={{ marginBottom: "10px" }}>Draw Diagrams</h2>
              <p style={{ color: theme.muted }}>
                Freeform diagramming like draw.io. Perfect for flowcharts, system design, and whiteboarding.
              </p>
            </div>
          </div>
        </Link>

        {/* ERD */}
        <Link href="/erd" style={{ textDecoration: "none" }}>
          <div
            style={{
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              borderRadius: "16px",
              padding: "28px",
              width: "260px",
              height: "200px", // ✅ consistent height
              boxShadow: theme.shadow,
              transition: "0.2s",
              cursor: "pointer",

              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.edgeSelected)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
          >
            <div>
              <h2 style={{ marginBottom: "10px" }}>Generate ERD</h2>
              <p style={{ color: theme.muted }}>
                Instantly create entity-relationship diagrams from schemas or structured input.
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: "70px",
          fontSize: "14px",
          color: theme.muted,
        }}
      >
        Fast • Minimal • Developer-first
      </footer>
    </main>
  );
}
