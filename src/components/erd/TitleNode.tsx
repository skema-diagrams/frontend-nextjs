/**
 * TitleNode Component
 *
 * Renders a title/heading node displayed at the top of the ERD diagram.
 * Shows the diagram title with theme-aware styling.
 *
 * @module TitleNode
 */

import { memo } from "react";
import { NodeProps } from "reactflow";
import { getERDTheme } from "@/lib/erd/theme";
import { TitleNodeData } from "@/lib/erd/types";

/**
 * TitleNode Component
 *
 * Displays the ERD diagram title as a centered node.
 * Positioned at the top of the diagram by the layout algorithm.
 *
 * @param {NodeProps<TitleNodeData>} props - ReactFlow node props
 * @param {TitleNodeData} props.data - Node data containing title and theme
 * @returns {JSX.Element} Styled title node component
 */
function TitleNode({ data }: NodeProps<TitleNodeData>) {
  // Get theme colors based on current theme mode
  const theme = getERDTheme(data.theme);

  return (
    <div
      className="flex items-center justify-center rounded-2xl border px-8 py-4"
      style={{
        backgroundColor: theme.tableBackground,
        borderColor: theme.tableBorder,
        boxShadow: theme.shadow,
        minWidth: 280,
      }}
    >
      {/* Diagram title heading */}
      <h1 className="text-4xl font-bold tracking-tight" style={{ color: theme.text }}>
        {data.title}
      </h1>
    </div>
  );
}

/**
 * Memoized TitleNode to prevent unnecessary re-renders
 * Only re-renders when data prop changes
 */
export default memo(TitleNode);
