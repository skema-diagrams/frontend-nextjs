/**
 * CrowFootEdge Component
 *
 * Renders crow's foot notation edges for Entity-Relationship Diagrams.
 * Displays relationship cardinality using crow's foot symbols (ONE or MANY endpoints).
 *
 * @module CrowFootEdge
 */

import { BaseEdge, EdgeProps, Position, getSmoothStepPath, useReactFlow } from "reactflow";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

import { EndpointCardinality, ERDEdgeData, ThemeMode } from "@/lib/erd/types";
import { getERDTheme } from "../../lib/erd/theme";

/**
 * Determines the direction multiplier based on position
 * @param position - The position (Left or Right) from ReactFlow
 * @returns -1 for Left position, 1 for Right position
 */
function getDirection(position: Position | undefined) {
  return position === Position.Left ? -1 : 1;
}

/**
 * OneMarker Component
 *
 * Renders a single line marker representing "ONE" cardinality in crow's foot notation.
 * Displays a perpendicular line to indicate one-to-one relationship endpoint.
 *
 * @param x - X coordinate of the marker
 * @param y - Y coordinate of the marker
 * @param direction - Direction multiplier (-1 for left, 1 for right)
 * @param stroke - Color of the marker stroke
 */
function OneMarker({ x, y, direction, stroke }: { x: number; y: number; direction: number; stroke: string }) {
  // Calculate the horizontal position of the perpendicular bar
  const barX = x + direction * 8;

  return (
    <g stroke={stroke} strokeWidth={1.8} strokeLinecap="round">
      {/* Horizontal line connecting to the edge */}
      <line x1={barX} y1={y} x2={x} y2={y} />
      {/* Perpendicular bar indicating "ONE" cardinality */}
      <line x1={barX} y1={y - 7} x2={barX} y2={y + 7} />
    </g>
  );
}

/**
 * CrowMarker Component
 *
 * Renders a crow's foot marker representing "MANY" cardinality.
 * Displays three lines forming a crow's foot shape to indicate one-to-many relationship endpoint.
 *
 * @param x - X coordinate of the marker
 * @param y - Y coordinate of the marker
 * @param direction - Direction multiplier (-1 for left, 1 for right)
 * @param stroke - Color of the marker stroke
 */
function CrowMarker({
  x,
  y,
  direction,
  stroke,
}: {
  x: number;
  y: number;
  direction: number;
  stroke: string;
}) {
  // Calculate the base position for the crow's foot
  const baseX = x + direction * 14;

  return (
    <g stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Main horizontal line */}
      <line x1={baseX} y1={y} x2={x} y2={y} />
      {/* Upper diagonal line of the crow's foot */}
      <line x1={baseX} y1={y} x2={x} y2={y - 8} />
      {/* Lower diagonal line of the crow's foot */}
      <line x1={baseX} y1={y} x2={x} y2={y + 8} />
    </g>
  );
}

/**
 * EndpointMarker Component
 *
 * Renders the appropriate cardinality marker (ONE or MANY) at an edge endpoint.
 * Selects between OneMarker and CrowMarker based on cardinality type.
 *
 * @param x - X coordinate of the marker
 * @param y - Y coordinate of the marker
 * @param position - The position (Left or Right) from ReactFlow
 * @param type - The cardinality type ("ONE" or "MANY")
 * @param stroke - Color of the marker stroke
 */
function EndpointMarker({
  x,
  y,
  position,
  type,
  stroke,
}: {
  x: number;
  y: number;
  position: Position | undefined;
  type: EndpointCardinality;
  stroke: string;
}) {
  // Calculate direction based on position
  const direction = getDirection(position);

  // Render appropriate marker based on cardinality type
  return type === "ONE" ? (
    <OneMarker x={x} y={y} direction={direction} stroke={stroke} />
  ) : (
    <CrowMarker x={x} y={y} direction={direction} stroke={stroke} />
  );
}

/**
 * CrowFootEdge Component
 *
 * Main edge component that renders a smooth step path with crow's foot notation endpoints.
 * Displays relationship lines between entities with cardinality indicators.
 *
 * @param id - Unique identifier for the edge
 * @param sourceX - X coordinate of the source node
 * @param sourceY - Y coordinate of the source node
 * @param sourcePosition - Position of the source handle
 * @param targetX - X coordinate of the target node
 * @param targetY - Y coordinate of the target node
 * @param targetPosition - Position of the target handle
 * @param data - Edge data containing cardinality and stroke information
 * @returns SVG elements representing the edge with crow's foot markers
 */
export default function CrowFootEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
}: EdgeProps<ERDEdgeData>) {
  const theme = (data?.theme as ThemeMode) ?? "dark";
  const themeColors = getERDTheme(theme);
  const baseStroke = data?.stroke ?? themeColors.edge;
  const stroke = selected ? themeColors.edgeSelected : baseStroke;
  const reactFlowInstance = useReactFlow();

  const isHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;

  const [centerDelta, setCenterDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ screenPos: 0, startDelta: 0 });

  const naturalCenterX = (sourceX + targetX) / 2;
  const naturalCenterY = (sourceY + targetY) / 2;
  const centerX = isHorizontal ? naturalCenterX + centerDelta : naturalCenterX;
  const centerY = isHorizontal ? naturalCenterY : naturalCenterY + centerDelta;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
    centerX,
    centerY,
  });

  const middleSegment = useMemo(() => {
    try {
      const commands = path.match(/[MLCQZ][^MLCQZ]*/gi) ?? [];
      const pts: Array<{ x: number; y: number }> = [];
      for (const cmd of commands) {
        const type = cmd[0].toUpperCase();
        const nums =
          cmd
            .slice(1)
            .trim()
            .match(/-?[\d.]+/g)
            ?.map(Number) ?? [];
        if (type === "M" && nums.length >= 2) pts.push({ x: nums[0], y: nums[1] });
        else if (type === "L" && nums.length >= 2) pts.push({ x: nums[0], y: nums[1] });
        else if (type === "C" && nums.length >= 6) pts.push({ x: nums[4], y: nums[5] });
        else if (type === "Q" && nums.length >= 4) pts.push({ x: nums[2], y: nums[3] });
      }

      let best: { x1: number; y1: number; x2: number; y2: number } | null = null;
      let bestLen = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        if (Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) > 4) {
          const len = Math.abs(a.y - b.y);
          if (len > bestLen) {
            best = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
            bestLen = len;
          }
        }
      }

      // Fallback: if no vertical segment found, synthesise one at labelX
      if (!best) {
        const ys = pts.map((p) => p.y);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        if (maxY - minY > 4) {
          return { x1: labelX, y1: minY, x2: labelX, y2: maxY };
        }
        return { x1: labelX, y1: labelY - 20, x2: labelX, y2: labelY + 20 };
      }

      return best;
    } catch {
      return null;
    }
  }, [path, labelX, labelY]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!selected) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStartRef.current = {
        screenPos: e.clientX,
        startDelta: centerDelta,
      };
    },
    [selected, centerDelta],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const viewport = reactFlowInstance.getViewport();
      const canvasDelta = (e.clientX - dragStartRef.current.screenPos) / viewport.zoom;
      setCenterDelta(dragStartRef.current.startDelta + canvasDelta);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, reactFlowInstance]);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke,
          strokeWidth: selected ? 3.6 : 1.8,
          transition: isDragging ? "none" : "stroke 0.2s ease, stroke-width 0.2s ease",
        }}
        interactionWidth={24}
      />

      <EndpointMarker
        x={sourceX}
        y={sourceY}
        position={sourcePosition}
        type={data?.sourceCardinality ?? "ONE"}
        stroke={stroke}
      />

      <EndpointMarker
        x={targetX}
        y={targetY}
        position={targetPosition}
        type={data?.targetCardinality ?? "ONE"}
        stroke={stroke}
      />

      {selected && (
        <>
          {middleSegment ? (
            <rect
              x={Math.min(middleSegment.x1, middleSegment.x2) - 10}
              y={Math.min(middleSegment.y1, middleSegment.y2) - 10}
              width={Math.abs(middleSegment.x2 - middleSegment.x1) + 20}
              height={Math.abs(middleSegment.y2 - middleSegment.y1) + 20}
              fill="transparent"
              style={{ cursor: "ew-resize", pointerEvents: "all" }}
              onMouseDown={handleMouseDown}
            />
          ) : (
            <circle
              cx={labelX}
              cy={labelY}
              r={12}
              fill="transparent"
              style={{ cursor: "ew-resize", pointerEvents: "all" }}
              onMouseDown={handleMouseDown}
            />
          )}

          <circle
            cx={labelX}
            cy={labelY}
            r={5}
            fill={themeColors.edgeSelected}
            stroke={themeColors.background}
            strokeWidth={2}
            style={{ pointerEvents: "none" }}
          />
        </>
      )}
    </>
  );
}
