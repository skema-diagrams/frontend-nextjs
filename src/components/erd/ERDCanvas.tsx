/**
 * ERDCanvas Component
 *
 * Main canvas component for the Entity-Relationship Diagram editor.
 * Provides a complete ERD visualization and editing interface with:
 * - DSL code editor panel
 * - Interactive diagram canvas with ReactFlow
 * - Theme switching (dark/light mode)
 * - PNG export functionality
 * - Syntax help modal
 *
 * @module ERDCanvas
 */

"use client";

import { toPng } from "html-to-image";

import {
  Background,
  BackgroundVariant,
  Edge,
  Panel,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  useEdgesState,
  useNodesState,
  useReactFlow,
  Controls,
} from "reactflow";

import "reactflow/dist/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DSLPanel from "./DSLPanel";
import ThemeToggle from "./ThemeToggle";
import SyntaxHelpModal from "./SyntaxHelpModal";
import { nodeTypes, edgeTypes } from "./flowConfig";

import { sampleDSL } from "@/lib/erd/sample.dsl";
import { parseDSL } from "@/lib/erd/parser";
import { getLayoutedElements } from "@/lib/erd/layout";
// import { getLayoutedElements } from "@/lib/erd/layout-backup";
import { getERDTheme, resolveDiagramColor } from "@/lib/erd/theme";
import {
  EndpointCardinality,
  ERDEdgeData,
  ERDNodeData,
  TitleNodeData,
  RelationType,
  getEntityHandleId,
  getFieldHandleId,
} from "@/lib/erd/types";

/**
 * Maps relationship types to their source and target cardinality endpoints
 * Used to determine the crow's foot notation markers for each relationship
 */
const relationCardinalityMap: Record<RelationType, [EndpointCardinality, EndpointCardinality]> = {
  ONE_TO_ONE: ["ONE", "ONE"],
  ONE_TO_MANY: ["ONE", "MANY"],
  MANY_TO_ONE: ["MANY", "ONE"],
  MANY_TO_MANY: ["MANY", "MANY"],
};

/**
 * Converts a diagram title to a valid export filename
 * Normalizes the title by converting to lowercase, removing special characters,
 * and replacing spaces with hyphens. Falls back to "eraser-erd" if title is empty.
 *
 * @param {string} [title] - The diagram title to convert
 * @returns {string} A valid PNG filename with .png extension
 */
function toExportFileName(title?: string) {
  const fallback = "eraser-erd";
  // Normalize title: lowercase, remove special chars, replace spaces with hyphens
  const normalized = (title ?? fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalized || fallback}.png`;
}

/**
 * ERDContent Component
 *
 * Internal component that manages the ERD editor state and rendering.
 * Handles DSL parsing, graph building, theme management, and export functionality.
 *
 * @returns {JSX.Element} The complete ERD editor interface
 */
function ERDContent() {
  // Theme state management
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const canvasTheme = useMemo(() => getERDTheme(theme), [theme]);

  // DOM reference for export functionality
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // UI state management
  const [isExporting, setIsExporting] = useState(false);
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);

  // DSL editor state
  const [dsl, setDsl] = useState(sampleDSL);
  const { getNodes } = useReactFlow<ERDNodeData | TitleNodeData, ERDEdgeData>();

  // Parse DSL into structured schema
  const parsed = useMemo(() => {
    return parseDSL(dsl);
  }, [dsl]);

  // ReactFlow node and edge state management
  const [nodes, setNodes, onNodesChange] = useNodesState<ERDNodeData | TitleNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ERDEdgeData>([]);

  /**
   * Effect: Build and layout the graph whenever DSL or theme changes
   * Converts parsed DSL into ReactFlow nodes and edges with proper layout
   */
  useEffect(() => {
    async function buildGraph() {
      const graphNodes: Node<ERDNodeData | TitleNodeData>[] = [];

      // Add title node if title exists in config
      if (parsed.config.title) {
        graphNodes.push({
          id: "__title__",
          type: "titleNode",
          position: { x: 0, y: 0 },
          draggable: true,
          selectable: true,
          data: {
            title: parsed.config.title,
            theme,
          },
        });
      }

      // Convert parsed entities to ReactFlow table nodes
      const entityNodes: Node<ERDNodeData>[] = parsed.entities.map((entity) => ({
        id: entity.name,
        type: "tableNode",
        position: {
          x: 0,
          y: 0,
        },
        data: {
          ...entity,
          theme,
          config: parsed.config,
        },
      }));

      graphNodes.push(...entityNodes);

      // Convert parsed relations to ReactFlow edges with crow's foot notation
      const graphEdges: Edge<ERDEdgeData>[] = parsed.relations.map((relation, index) => {
        // Get cardinality for source and target endpoints
        const [sourceCardinality, targetCardinality] = relationCardinalityMap[relation.type];
        // Resolve edge color from relation or use theme default
        const stroke = resolveDiagramColor(relation.color, canvasTheme.edge) ?? canvasTheme.edge;

        return {
          id: `edge-${index}`,
          source: relation.sourceEntity,
          // Connect to specific field handle if specified, otherwise to entity handle
          sourceHandle: relation.sourceField
            ? getFieldHandleId(relation.sourceField, "right")
            : getEntityHandleId("right"),
          target: relation.targetEntity,
          // Connect to specific field handle if specified, otherwise to entity handle
          targetHandle: relation.targetField
            ? getFieldHandleId(relation.targetField, "left")
            : getEntityHandleId("left"),
          type: "crowFoot",
          animated: false,
          data: {
            sourceCardinality,
            targetCardinality,
            stroke,
            strokeWidth: 1.8,
            theme,
          },
        };
      });

      // Apply ELK layout algorithm to position nodes
      const layouted = await getLayoutedElements(graphNodes, graphEdges);

      setNodes(layouted.nodes as Node<ERDNodeData | TitleNodeData>[]);
      setEdges(layouted.edges);
    }

    buildGraph();
  }, [canvasTheme.edge, parsed, setEdges, setNodes, theme]);

  /**
   * Handles PNG export of the current diagram
   * Captures the ReactFlow viewport and converts it to a PNG image
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleExportPng = useCallback(async () => {
    // Get the ReactFlow viewport element
    const viewportElement = reactFlowWrapper.current?.querySelector(
      ".react-flow__viewport",
    ) as HTMLElement | null;

    // Get all nodes from ReactFlow
    const flowNodes = getNodes();

    // Validate that we have both viewport and nodes
    if (!viewportElement || flowNodes.length === 0) {
      return;
    }

    // Calculate bounds of all nodes
    const bounds = getNodesBounds(flowNodes);
    const padding = 80;
    const imageWidth = Math.max(Math.ceil(bounds.width + padding * 2), 1200);
    const imageHeight = Math.max(Math.ceil(bounds.height + padding * 2), 800);
    // Calculate viewport transformation for proper positioning
    const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.1, 2, 0.12);

    try {
      setIsExporting(true);

      // Convert viewport to PNG using html-to-image
      const dataUrl = await toPng(viewportElement, {
        backgroundColor: canvasTheme.background,
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 2,
        cacheBust: true,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        },
      });

      // Trigger download of the PNG file
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = toExportFileName(parsed.config.title);
      anchor.click();
    } catch (error) {
      console.error("Failed to export ERD PNG", error);
    } finally {
      setIsExporting(false);
    }
  }, [canvasTheme.background, getNodes, parsed.config.title]);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden transition-colors"
      style={{ backgroundColor: canvasTheme.background }}
    >
      {/* LEFT SIDEBAR: DSL Editor Panel */}
      <div
        className="w-105 border-r p-4 transition-colors"
        style={{
          borderColor: canvasTheme.border,
          backgroundColor: canvasTheme.panel,
        }}
      >
        {/* Header with title and theme toggle */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: canvasTheme.text }}>
            ERD Generator using DSL
          </h2>

          {/* Theme toggle button (dark/light mode) */}
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          />
        </div>

        {/* DSL code editor textarea */}
        <div className="mb-4 h-[calc(90vh-60px)]">
          <DSLPanel value={dsl} onChange={setDsl} theme={theme} />
        </div>

        {/* Syntax help button */}
        <button
          type="button"
          onClick={() => setShowSyntaxHelp(true)}
          className="w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
          style={{
            borderColor: canvasTheme.border,
            backgroundColor: canvasTheme.panelMuted,
            color: canvasTheme.text,
          }}
        >
          <span className="mr-2">&lt;?&gt;</span>
          Syntax Help
        </button>
      </div>

      {/* RIGHT SECTION: Interactive ReactFlow Canvas */}
      <div ref={reactFlowWrapper} className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          defaultEdgeOptions={{ type: "crowFoot" }}
          fitView
          // Add these properties:
          minZoom={0.01} // Allow zooming out to 1% (see entire diagram)
          maxZoom={4} // Allow zooming in to 400%
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          fitViewOptions={{
            padding: 0.2, // 20% padding around content
            includeHiddenNodes: false,
            minZoom: 0.01,
            maxZoom: 1.5,
          }}
          // Remove pan restrictions (infinite canvas)
          translateExtent={[
            [-Infinity, -Infinity],
            [Infinity, Infinity],
          ]}
          // Smooth zoom behavior
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          panOnScroll={true}
          panOnDrag={true}
          preventScrolling={true}
        >
          {/* Dotted background grid */}
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color={canvasTheme.border} />

          <Controls
            showZoom={true}
            showFitView={true}
            showInteractive={true}
            style={{
              backgroundColor: canvasTheme.panel,
              borderColor: canvasTheme.border,
            }}
          />

          {/* Top-right panel with export button */}
          <Panel position="top-right">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExporting || nodes.length === 0}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: canvasTheme.border,
                backgroundColor: canvasTheme.panel,
                color: canvasTheme.text,
              }}
            >
              {isExporting ? "Exporting..." : "Export PNG"}
            </button>
          </Panel>

          {/* Minimap for navigation */}
          <MiniMap
            pannable
            zoomable
            zoomStep={12}
            ariaLabel="ERD minimap"
            style={{ backgroundColor: canvasTheme.minimapBackground }}
            nodeColor={canvasTheme.minimapNode}
            nodeStrokeColor={canvasTheme.border}
            maskColor={theme === "dark" ? "rgba(10, 10, 10, 0.72)" : "rgba(243, 244, 246, 0.72)"}
            maskStrokeColor={canvasTheme.edge}
          />
        </ReactFlow>
      </div>

      {/* Syntax help modal dialog */}
      <SyntaxHelpModal isOpen={showSyntaxHelp} onClose={() => setShowSyntaxHelp(false)} theme={theme} />
    </div>
  );
}

/**
 * ERDCanvas Component
 *
 * Main wrapper component that provides ReactFlow context to the ERD editor.
 * Wraps ERDContent with ReactFlowProvider for proper ReactFlow functionality.
 *
 * @returns {JSX.Element} The ERD canvas wrapped with ReactFlow provider
 */
export default function ERDCanvas() {
  return (
    <ReactFlowProvider>
      <ERDContent />
    </ReactFlowProvider>
  );
}
