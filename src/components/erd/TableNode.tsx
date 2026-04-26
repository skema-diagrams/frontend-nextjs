/**
 * TableNode Component
 *
 * Renders an entity/table node in the ERD diagram.
 * Displays table name, fields with types, and field modifiers (pk, fk, uq).
 * Supports custom colors, icons, and theme-aware styling.
 *
 * @module TableNode
 */

import { memo } from "react";

import { Handle, NodeProps, Position } from "reactflow";

import {
  getERDTheme,
  withAlpha,
  resolveDiagramColor,
  lightenForFieldName,
  ERD_TABLE_WIDTH,
} from "@/lib/erd/theme";
import { ERDNodeData, getEntityHandleId, getFieldHandleId } from "@/lib/erd/types";

/**
 * Style configuration for hidden connection handles
 * Handles are invisible but allow connections to the table node
 */
const hiddenHandleStyle = {
  width: 8,
  height: 8,
  background: "transparent",
  border: "none",
  top: "50%",
};

/**
 * TableGlyph Component
 *
 * Renders a small table icon (2x2 grid) for the table header.
 * Used as a visual indicator for entity/table nodes.
 *
 * @param {string} color - The color of the glyph stroke
 * @returns {JSX.Element} SVG table icon
 */
function TableGlyph({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {/* Render 2x2 grid of squares */}
      {[1, 9].flatMap((x) =>
        [1, 9].map((y) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="6"
            height="6"
            rx="1.5"
            stroke={color}
            strokeWidth="1.3"
          />
        )),
      )}
    </svg>
  );
}

/**
 * TableNode Component
 *
 * Renders a table/entity node with header, fields, and connection handles.
 * Applies theme colors and custom styling based on configuration.
 *
 * @param {NodeProps<ERDNodeData>} props - ReactFlow node props
 * @param {ERDNodeData} props.data - Node data containing entity information
 * @returns {JSX.Element} Styled table node component
 */
function TableNode({ data }: NodeProps<ERDNodeData>) {
  // Get theme colors based on current theme mode
  const theme = getERDTheme(data.theme);

  // Determine if table has custom color and resolve it
  const hasCustomColor = !!data.color;
  const accent = resolveDiagramColor(data.color, theme.edge) ?? theme.edge;

  // Calculate shadow based on style mode
  const shadow =
    data.config.styleMode === "plain"
      ? "none"
      : data.config.styleMode === "watercolor"
        ? `0 18px 48px ${withAlpha(accent, data.theme === "dark" ? 0.18 : 0.1)}`
        : theme.shadow;

  // Determine table background color based on color mode
  const tableBackground =
    data.config.colorMode === "outline" ? withAlpha(theme.tableBackground, 0.78) : theme.tableBackground;

  // Calculate header background color based on custom color and color mode
  const headerBackground = hasCustomColor
    ? data.config.colorMode === "bold"
      ? withAlpha(accent, data.theme === "dark" ? 0.18 : 0.12)
      : withAlpha(accent, data.theme === "dark" ? 0.08 : 0.05)
    : data.config.colorMode === "bold"
      ? withAlpha(accent, data.theme === "dark" ? 0.18 : 0.12)
      : theme.tableHeader;

  // Calculate icon styling colors
  const iconSurface = withAlpha(accent, data.theme === "dark" ? 0.14 : 0.1);
  const iconBorder = withAlpha(accent, data.theme === "dark" ? 0.4 : 0.28);

  // Determine table border color (custom or theme default)
  const tableBorderColor = hasCustomColor ? accent : theme.tableBorder;

  // Determine field text colors (custom or theme default)
  const fieldNameColor = hasCustomColor ? lightenForFieldName(accent, data.theme) : theme.text;
  const fieldTypeColor = hasCustomColor ? accent : theme.muted;

  return (
    <div
      className="relative overflow-hidden rounded-[14px] border-2"
      style={{
        width: ERD_TABLE_WIDTH,
        backgroundColor: tableBackground,
        borderColor: tableBorderColor,
        boxShadow: shadow,
      }}
    >
      {/* Left connection handle for incoming relationships */}
      <Handle
        id={getEntityHandleId("left")}
        type="target"
        position={Position.Left}
        className="!border-0 !bg-transparent"
        style={hiddenHandleStyle}
      />

      {/* Right connection handle for outgoing relationships */}
      <Handle
        id={getEntityHandleId("right")}
        type="source"
        position={Position.Right}
        className="!border-0 !bg-transparent"
        style={hiddenHandleStyle}
      />

      {/* Table Header: Entity name and optional icon */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{
          borderBottomColor: theme.tableDivider,
          backgroundColor: headerBackground,
        }}
      >
        {/* Entity/Table name */}
        <h3 className="truncate text-[15px] font-semibold tracking-[0.01em]" style={{ color: theme.text }}>
          {data.name}
        </h3>

        {/* Optional table icon indicator */}
        {data.icon ? (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[8px] border"
            style={{
              backgroundColor: iconSurface,
              borderColor: iconBorder,
            }}
          >
            <TableGlyph color={accent} />
          </span>
        ) : null}
      </div>

      {/* Table Fields Section */}
      <div>
        {/* Render each field as a row */}
        {data.fields.map((field) => (
          <div
            key={field.name}
            className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4"
            style={{
              minHeight: 40,
              borderBottomColor: theme.tableDivider,
            }}
          >
            {/* Left connection handle for field-level relationships */}
            <Handle
              id={getFieldHandleId(field.name, "left")}
              type="target"
              position={Position.Left}
              className="!border-0 !bg-transparent"
              style={hiddenHandleStyle}
            />

            {/* Right connection handle for field-level relationships */}
            <Handle
              id={getFieldHandleId(field.name, "right")}
              type="source"
              position={Position.Right}
              className="!border-0 !bg-transparent"
              style={hiddenHandleStyle}
            />

            {/* Field name */}
            <span className="truncate text-sm font-medium" style={{ color: fieldNameColor }}>
              {field.name}
            </span>

            {/* Field type and modifiers (pk, fk, uq) */}
            <span className="text-[12px] font-medium tracking-[0.01em]" style={{ color: fieldTypeColor }}>
              {[field.type, field.pk ? "pk" : null, field.fk ? "fk" : null, field.uq ? "uq" : null]
                .filter(Boolean)
                .join(" ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Memoized TableNode to prevent unnecessary re-renders
 * Only re-renders when data prop changes
 */
export default memo(TableNode);
