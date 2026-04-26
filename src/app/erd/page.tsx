/**
 * Eraser Page Component
 *
 * Main page component for the ERD (Entity-Relationship Diagram) editor.
 * Renders the full-screen ERD canvas application.
 *
 * @module eraser/page
 */

"use client";

import ERDCanvas from "@/components/erd/ERDCanvas";

/**
 * HomePage Component
 *
 * Root page component for the ERD editor application.
 * Provides a full-screen container for the ERD canvas.
 *
 * @returns {JSX.Element} Full-screen ERD editor interface
 */
export default function HomePage() {
  return (
    // Full-screen main container with overflow hidden to prevent scrolling
    <main className="w-screen h-screen overflow-hidden bg-neutral-100">
      {/* ERD Canvas component - handles all diagram rendering and interaction */}
      <ERDCanvas />
    </main>
  );
}
