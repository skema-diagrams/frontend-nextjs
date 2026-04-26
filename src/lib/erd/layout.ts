/**
 * Layout Module
 *
 * Handles automatic layout of ERD nodes using the ELK (Eclipse Layout Kernel) algorithm.
 * Positions entities and title node in a hierarchical left-to-right layout.
 *
 * Strategy for large diagrams (>15 nodes):
 *  - Phase 1: Compact node heights (60px) during ELK layout to prevent vertical stacking,
 *             then restore actual heights via a two-pass Y-adjustment.
 *  - Phase 2: Connected-component clustering via DFS — related tables are grouped into
 *             ELK sub-graphs so inter-cluster spacing can be widened independently.
 *  - Layout Option: GREEDY cycle-breaking + NETWORK_SIMPLEX layering + LAYER_SWEEP crossing
 *                   minimization + BRANDES_KOEPF (BALANCED) placement + aspectRatio 2.5.
 *
 * @module layout
 */

import ELK from "elkjs/lib/elk.bundled.js";
import { Edge, Node } from "reactflow";

import { getTableNodeHeight, ERD_TABLE_WIDTH, ERD_TITLE_HEIGHT } from "./theme";
import { ERDNodeData, TitleNodeData } from "./types";

// ─── Shared ELK instance ────────────────────────────────────────────────────
const elk = new ELK();

// Height used during ELK layout to prevent vertical over-stacking.
// Actual heights are restored after layout via two-pass Y adjustment.
const COMPACT_NODE_HEIGHT = 60;

// Threshold above which clustering and compact-height logic activates.
const LARGE_DIAGRAM_THRESHOLD = 15;

// ─── Cluster Detection ───────────────────────────────────────────────────────

/**
 * Detects connected components (clusters) in the ERD graph using DFS.
 * Nodes that share FK relationships end up in the same cluster.
 *
 * @param nodes  Valid table nodes (no titleNode)
 * @param edges  Valid edges connecting those nodes
 * @returns      Map of cluster-id → Set of node IDs in that cluster
 */
function detectClusters(nodes: Node<ERDNodeData>[], edges: Edge[]): Map<number, Set<string>> {
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Build undirected adjacency list
  const adjacency = new Map<string, Set<string>>();
  nodeIds.forEach((id) => adjacency.set(id, new Set()));
  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    }
  });

  // DFS to collect each connected component
  const visited = new Set<string>();
  const clusters = new Map<number, Set<string>>();
  let clusterId = 0;

  function dfs(nodeId: string, currentCluster: Set<string>) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    currentCluster.add(nodeId);
    adjacency.get(nodeId)?.forEach((neighbor) => {
      if (!visited.has(neighbor)) dfs(neighbor, currentCluster);
    });
  }

  nodeIds.forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      const cluster = new Set<string>();
      dfs(nodeId, cluster);
      clusters.set(clusterId++, cluster);
    }
  });

  return clusters;
}

// ─── Main Layout Function ────────────────────────────────────────────────────

/**
 * Calculates and applies automatic layout to ERD nodes and edges.
 *
 * For small diagrams (≤15 nodes): flat ELK layered graph with real node heights.
 * For large diagrams (>15 nodes): compact-height layout + clustering + two-pass
 * Y restoration to prevent overlap.
 *
 * @param nodes  All ReactFlow nodes (table nodes + optional title node)
 * @param edges  All ReactFlow edges
 * @returns      Laid-out nodes and filtered valid edges
 */
export async function getLayoutedElements(nodes: Node<ERDNodeData | TitleNodeData>[], edges: Edge[]) {
  // ── Separate title node ───────────────────────────────────────────────────
  const titleNode = nodes.find((node) => node.type === "titleNode");
  const tableNodes = nodes.filter((node) => node.type !== "titleNode");

  // Filter out nodes with invalid/empty IDs
  const validTableNodes = tableNodes.filter((node) => node.id && node.id.trim().length > 0);

  // O(1) membership check
  const validNodeIds = new Set(validTableNodes.map((node) => node.id));

  // Only edges where both endpoints are valid
  const validEdges = edges.filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));

  // Early return for empty diagrams
  if (validTableNodes.length === 0) {
    return { nodes: titleNode ? [titleNode] : [], edges: [] };
  }

  // ── Phase 1: Store actual heights ─────────────────────────────────────────
  const nodeHeightMap = new Map<string, number>();
  validTableNodes.forEach((node) => {
    const tableData = node.data as ERDNodeData;
    nodeHeightMap.set(node.id, getTableNodeHeight(tableData.fields?.length || 0));
  });

  // ── Phase 2: Clustering for large diagrams ────────────────────────────────
  const nodeCount = validTableNodes.length;
  console.log(nodeCount);
  const useClustering = nodeCount > LARGE_DIAGRAM_THRESHOLD;
  console.log(useClustering);

  let clusters: Map<number, Set<string>> | null = null;
  if (useClustering) {
    clusters = detectClusters(validTableNodes as Node<ERDNodeData>[], validEdges);
    console.log(`📊 Detected ${clusters.size} cluster(s) for ${nodeCount} nodes`);
  }

  const hasMultipleClusters = useClustering && clusters != null && clusters.size > 1;
  console.log("HAS", hasMultipleClusters);

  // ── Build ELK graph ───────────────────────────────────────────────────────
  //
  // Layout Option 3 (the strongest option):
  //   • GREEDY cycle breaking   → handles FK reference cycles in ERDs
  //   • NETWORK_SIMPLEX layering → balanced, minimum-width layer assignment
  //   • LAYER_SWEEP crossing min → reduces visual edge crossings
  //   • BRANDES_KOEPF placement  → stable, readable node placement
  //   • BALANCED alignment       → symmetric vertical alignment within layers
  //   • aspectRatio 2.5          → discourages vertical stacking algorithmically
  //
  // When multiple clusters exist the root algorithm switches to "layered"
  // (safer than mrtree which assumes tree topology) and spacing is widened.
  //
  const graph = {
    id: "root",
    layoutOptions: {
      // Core algorithm — keep "layered" even for clustered layouts for safety
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",

      // Cycle handling (essential for ERD FK cycles)
      "elk.layered.cycleBreaking.strategy": "GREEDY",

      // Layer assignment
      "elk.layered.layering.strategy": "NETWORK_SIMPLEX",

      // Crossing minimisation
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",

      // Node placement
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",

      // Aspect ratio — key to preventing the "tall tower" anti-pattern
      "elk.aspectRatio": "2.5",

      // Spacing — widened when clustering is active for visible group separation
      "elk.spacing.nodeNode": hasMultipleClusters ? "120" : "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": hasMultipleClusters ? "300" : "250",

      // Edge routing
      "elk.layered.edgeRouting": "ORTHOGONAL",

      // Performance (2 = fast; raise to 5–7 for higher quality on small diagrams)
      "elk.layered.thoroughness": "2",
    },

    // ── Children ────────────────────────────────────────────────────────────
    // Clustered: each cluster becomes a sub-graph with its own inner layout.
    // Flat:      every node is a direct child of root.
    // Either way, we pass COMPACT_NODE_HEIGHT (60px) to ELK so it does not
    // over-space rows based on real table heights.
    children: hasMultipleClusters
      ? Array.from(clusters!.entries()).map(([cId, nodeIds]) => ({
          id: `cluster_${cId}`,
          layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": "RIGHT",
            "elk.spacing.nodeNode": "60",
            "elk.layered.spacing.nodeNodeBetweenLayers": "150",
          },
          children: validTableNodes
            .filter((node) => nodeIds.has(node.id))
            .map((node) => ({
              id: node.id,
              width: ERD_TABLE_WIDTH,
              height: COMPACT_NODE_HEIGHT,
            })),
          edges: validEdges
            .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
            .map((edge) => ({
              id: edge.id,
              sources: [edge.source],
              targets: [edge.target],
            })),
        }))
      : validTableNodes.map((node) => ({
          id: node.id,
          width: ERD_TABLE_WIDTH,
          height: COMPACT_NODE_HEIGHT,
        })),

    // ── Root-level edges ────────────────────────────────────────────────────
    // For clustered layouts, only inter-cluster edges live at root level.
    // Intra-cluster edges are already embedded in each cluster sub-graph above.
    edges: hasMultipleClusters
      ? validEdges
          .filter((edge) => {
            let srcCluster = -1;
            let tgtCluster = -1;
            clusters!.forEach((nodeIds, cId) => {
              if (nodeIds.has(edge.source)) srcCluster = cId;
              if (nodeIds.has(edge.target)) tgtCluster = cId;
            });
            return srcCluster !== tgtCluster;
          })
          .map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
          }))
      : validEdges.map((edge) => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
  };

  // ── Run ELK ───────────────────────────────────────────────────────────────
  const layout = await elk.layout(graph);

  // ── Extract positions (handles both flat and hierarchical output) ─────────
  const findNodePosition = (nodeId: string): { x: number; y: number } => {
    if (hasMultipleClusters) {
      for (const cluster of layout.children || []) {
        const childNode = cluster.children?.find((n) => n.id === nodeId);
        if (childNode) {
          return {
            x: (cluster.x || 0) + (childNode.x || 0),
            y: (cluster.y || 0) + (childNode.y || 0),
          };
        }
      }
    } else {
      const elkNode = layout.children?.find((n) => n.id === nodeId);
      if (elkNode) return { x: elkNode.x || 0, y: elkNode.y || 0 };
    }
    return { x: 0, y: 0 };
  };

  // ── Two-pass Y restoration ────────────────────────────────────────────────
  // Pass 1: attach ELK positions and actual heights to each node.
  const nodesWithHeights = validTableNodes.map((node) => {
    const position = findNodePosition(node.id);
    const actualHeight =
      nodeHeightMap.get(node.id) || getTableNodeHeight((node.data as ERDNodeData).fields?.length || 0);

    return {
      ...node,
      position,
      _elkY: position.y,
      _actualHeight: actualHeight,
    };
  });

  // Pass 2: group nodes that share the same X layer, sort by ELK Y, then
  // recompute Y so that actual (taller) nodes do not overlap the next node.
  const xGroups = new Map<number, typeof nodesWithHeights>();
  nodesWithHeights.forEach((node) => {
    // Bucket by ~10px to handle floating-point layer positions
    const xKey = Math.round(node.position.x / 10) * 10;
    if (!xGroups.has(xKey)) xGroups.set(xKey, []);
    xGroups.get(xKey)!.push(node);
  });

  xGroups.forEach((group) => {
    group.sort((a, b) => a._elkY - b._elkY);

    group.forEach((node, idx) => {
      if (idx === 0) {
        // First node in the layer keeps its ELK Y
        node.position.y = node._elkY;
      } else {
        const prev = group[idx - 1];
        // Gap ELK originally left between compact nodes
        const elkGap = node._elkY - (prev._elkY + COMPACT_NODE_HEIGHT);
        // Restore gap relative to the bottom of the actual previous node
        node.position.y = prev.position.y + prev._actualHeight + elkGap;
      }
    });
  });

  // Strip temporary internal properties
  const layoutedTableNodes = nodesWithHeights.map(({ _elkY, _actualHeight, ...node }) => node);

  // ── Title node positioning ────────────────────────────────────────────────
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;

  layoutedTableNodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x + ERD_TABLE_WIDTH);
    minY = Math.min(minY, node.position.y);
  });

  const layoutedNodes: Node<ERDNodeData | TitleNodeData>[] = [...layoutedTableNodes];

  if (titleNode) {
    const titleWidth = 280;
    const centerX = (minX + maxX) / 2 - titleWidth / 2;
    const titleY = minY - ERD_TITLE_HEIGHT - 80;

    layoutedNodes.unshift({
      ...titleNode,
      position: { x: centerX, y: titleY },
    });
  }

  return { nodes: layoutedNodes, edges: validEdges };
}
