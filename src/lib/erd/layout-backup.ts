/**
 * Layout Module
 *
 * Handles automatic layout of ERD nodes using the ELK (Eclipse Layout Kernel) algorithm.
 * Positions entities and title node in a hierarchical left-to-right layout.
 *
 * @module layout
 */

import ELK from "elkjs/lib/elk.bundled.js";
import { Edge, Node } from "reactflow";

import { getTableNodeHeight, ERD_TABLE_WIDTH, ERD_TITLE_HEIGHT } from "./theme";
import { ERDNodeData, TitleNodeData } from "./types";

/**
 * ELK instance for layout calculations
 * Shared instance to avoid recreating the layout engine
 */
const elk = new ELK();

/**
 * Detects clusters (connected components) in the graph
 * Groups nodes that are connected by edges
 *
 * @param {Node<ERDNodeData>[]} nodes - Array of table nodes
 * @param {Edge[]} edges - Array of edges
 * @returns {Map<number, Set<string>>} Map of cluster ID to set of node IDs
 */
function detectClusters(nodes: Node<ERDNodeData>[], edges: Edge[]): Map<number, Set<string>> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adjacency = new Map<string, Set<string>>();

  // Build adjacency list
  nodeIds.forEach((id) => adjacency.set(id, new Set()));
  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    }
  });

  // Find connected components using DFS
  const visited = new Set<string>();
  const clusters = new Map<number, Set<string>>();
  let clusterId = 0;

  function dfs(nodeId: string, currentCluster: Set<string>) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    currentCluster.add(nodeId);

    adjacency.get(nodeId)?.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        dfs(neighbor, currentCluster);
      }
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

/**
 * Calculates and applies automatic layout to ERD nodes and edges
 * Uses ELK layered algorithm to position entities left-to-right
 * Positions title node at the top center if present
 * For large diagrams (>15 nodes), uses clustering for better distribution
 *
 * @async
 * @param {Node<ERDNodeData | TitleNodeData>[]} nodes - Array of ReactFlow nodes
 * @param {Edge[]} edges - Array of ReactFlow edges
 * @returns {Promise<{nodes: Node<ERDNodeData | TitleNodeData>[], edges: Edge[]}>} Layouted nodes and edges
 */
export async function getLayoutedElements(nodes: Node<ERDNodeData | TitleNodeData>[], edges: Edge[]) {
  // Separate title node from table nodes for independent handling
  const titleNode = nodes.find((node) => node.type === "titleNode");
  const tableNodes = nodes.filter((node) => node.type !== "titleNode");

  // Filter out nodes with invalid IDs (empty or whitespace) to prevent layout errors
  const validTableNodes = tableNodes.filter((node) => node.id && node.id.trim().length > 0);

  // Create a Set of valid node IDs for O(1) lookup performance
  const validNodeIds = new Set(validTableNodes.map((node) => node.id));

  // Filter edges to only include those connecting valid nodes
  const validEdges = edges.filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));

  // Early return if no valid table nodes exist
  if (validTableNodes.length === 0) {
    return {
      nodes: titleNode ? [titleNode] : [],
      edges: [],
    };
  }

  // 🔥 PHASE 1: Collapse nodes during layout to prevent vertical stacking
  // Store actual node heights for restoration after layout
  const nodeHeightMap = new Map<string, number>();
  validTableNodes.forEach((node) => {
    const tableData = node.data as ERDNodeData;
    const actualHeight = getTableNodeHeight(tableData.fields?.length || 0);
    nodeHeightMap.set(node.id, actualHeight);
  });

  // Use compact height (60px) during ELK layout to reduce vertical stacking
  const COMPACT_NODE_HEIGHT = 60;

  // 🔥 PHASE 1: Edge importance filtering
  // Calculate edge importance based on connectivity (FK relationships are stronger)
  const edgeImportance = new Map<string, number>();
  validEdges.forEach((edge) => {
    // Higher weight for edges (default 1.0)
    // In future, can weight by FK density or relationship type
    edgeImportance.set(edge.id, 1.0);
  });

  // For now, keep all edges (future: filter weak edges temporarily)
  // const importantEdges = validEdges.filter((edge) => edgeImportance.get(edge.id)! >= 0.5);
  const layoutEdges = validEdges;

  // 🔥 PHASE 2: Clustering for large diagrams
  const nodeCount = validTableNodes.length;
  const useClustering = nodeCount > 15;

  let clusters: Map<number, Set<string>> | null = null;
  if (useClustering) {
    clusters = detectClusters(validTableNodes as Node<ERDNodeData>[], layoutEdges);
    console.log(`📊 Detected ${clusters.size} clusters for ${nodeCount} nodes`);
  }

  // // Calculate optimal spacing based on number of nodes
  // const nodeCount = validTableNodes.length;
  // const isLargeDiagram = nodeCount > 20;

  // // Reduce spacing for large diagrams to improve density
  // const nodeSpacing = isLargeDiagram ? "60" : "96";
  // const layerSpacing = isLargeDiagram ? "100" : "140";

  // // For very large diagrams, switch to a more compact direction
  // const direction = nodeCount > 30 ? "DOWN" : "RIGHT";

  // // Build ELK graph structure for layout calculation
  // const graph = {
  //   id: "root",
  //   layoutOptions: {
  //     // "elk.algorithm": "layered",
  //     "elk.algorithm": nodeCount > 40 ? "force" : "layered",
  //     "elk.force.repulsion": "200",
  //     "elk.spacing.nodeNode": "80",
  //     "elk.direction": direction,
  //     // "elk.spacing.nodeNode": nodeSpacing,
  //     "elk.layered.spacing.nodeNodeBetweenLayers": layerSpacing,
  //     // Add aspect ratio control
  //     "elk.aspectRatio": nodeCount > 30 ? "1.5" : "2.0",
  //   },
  //   // Convert ReactFlow nodes to ELK format with dimensions
  //   children: validTableNodes.map((node) => {
  //     const tableData = node.data as ERDNodeData;
  //     return {
  //       id: node.id,
  //       width: ERD_TABLE_WIDTH,
  //       height: getTableNodeHeight(tableData.fields?.length || 0),
  //     };
  //   }),
  //   // Convert ReactFlow edges to ELK format
  //   edges: validEdges.map((edge) => ({
  //     id: edge.id,
  //     sources: [edge.source],
  //     targets: [edge.target],
  //   })),
  // };

  // OLD CONFIGS
  // https://eclipse.dev/elk/reference/options.html
  const graph = {
    id: "root",
    // layoutOptions: {
    //   "elk.algorithm": "layered", // Use layered (hierarchical) layout algorithm
    //   "elk.direction": "RIGHT", // Layout direction: left to right
    //   "elk.spacing.nodeNode": "96", // Horizontal spacing between nodes
    //   "elk.layered.spacing.nodeNodeBetweenLayers": "140", // Vertical spacing between layers
    // },

    // layoutOptions: {
    //   "elk.algorithm": "layered",
    //   "elk.direction": "RIGHT",

    //   // 🔥 KEY: force more layers (less vertical stacking)
    //   "elk.layered.layering.strategy": "LONGEST_PATH",

    //   // Encourage wider layout
    //   "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",

    //   // Prevent over-stacking in one layer
    //   "elk.layered.nodePlacement.bk.fixedAlignment": "NONE",

    //   // Increase spacing to encourage spreading
    //   "elk.spacing.nodeNode": "50",
    //   "elk.layered.spacing.nodeNodeBetweenLayers": "200",

    //   // Control aspect ratio (VERY IMPORTANT)
    //   "elk.aspectRatio": "2.5",

    //   // Edge handling
    //   "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    //   "elk.layered.edgeRouting": "ORTHOGONAL",

    //   // Performance
    //   "elk.layered.thoroughness": "2",
    // },

    // layoutOptions: {
    //   "elk.algorithm": "layered",
    //   "elk.direction": "RIGHT",

    //   // Handle ERD cycles
    //   "elk.layered.cycleBreaking.strategy": "GREEDY",

    //   // Better distribution
    //   "elk.layered.layering.strategy": "NETWORK_SIMPLEX",

    //   // Reduce crossings
    //   "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",

    //   // Node placement
    //   "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",

    //   // Prevent vertical stacking
    //   "elk.aspectRatio": "2.0",

    //   // Edge style
    //   "elk.layered.edgeRouting": "ORTHOGONAL",

    //   // Performance
    //   "elk.layered.thoroughness": "2",

    //   // Spacing
    //   "elk.spacing.nodeNode": "80",
    //   "elk.layered.spacing.nodeNodeBetweenLayers": "250",
    // },

    layoutOptions: {
      // 🔥 PHASE 2: Use different algorithm for clustered layouts
      "elk.algorithm": useClustering && clusters && clusters.size > 1 ? "mrtree" : "layered",
      "elk.direction": "RIGHT",

      // ✅ Keep strong structure
      "elk.layered.cycleBreaking.strategy": "GREEDY",
      "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",

      // 🔥 Add controlled spreading
      "elk.aspectRatio": "2.5", // slightly wide, not extreme
      "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",

      // Spacing (balanced, increased for clustered layouts)
      "elk.spacing.nodeNode": useClustering ? "120" : "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": useClustering ? "300" : "250",

      // Edge routing
      "elk.layered.edgeRouting": "ORTHOGONAL",

      // Performance
      "elk.layered.thoroughness": "2",

      // 🔥 PHASE 2: MRTree specific options for clustered layouts
      ...(useClustering && clusters && clusters.size > 1
        ? {
            "elk.mrtree.searchDepth": "3",
          }
        : {}),
    },

    // Convert ReactFlow nodes to ELK format with dimensions
    // 🔥 Use compact height during layout to prevent vertical stacking
    // 🔥 PHASE 2: Group nodes into clusters if enabled
    children:
      useClustering && clusters && clusters.size > 1
        ? Array.from(clusters.entries()).map(([clusterId, nodeIds]) => ({
            id: `cluster_${clusterId}`,
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
            edges: layoutEdges
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
            height: COMPACT_NODE_HEIGHT, // Collapsed height for better layout distribution
          })),
    // Convert ReactFlow edges to ELK format
    // 🔥 Use filtered edges for better layout (currently all edges, can be optimized)
    // 🔥 PHASE 2: For clustered layouts, inter-cluster edges are at root level
    edges:
      useClustering && clusters && clusters.size > 1
        ? layoutEdges
            .filter((edge) => {
              // Find which clusters the source and target belong to
              let sourceCluster = -1;
              let targetCluster = -1;
              clusters.forEach((nodeIds, clusterId) => {
                if (nodeIds.has(edge.source)) sourceCluster = clusterId;
                if (nodeIds.has(edge.target)) targetCluster = clusterId;
              });
              // Only include inter-cluster edges at root level
              return sourceCluster !== targetCluster;
            })
            .map((edge) => ({
              id: edge.id,
              sources: [edge.source],
              targets: [edge.target],
            }))
        : layoutEdges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
          })),
  };

  // Calculate layout using ELK algorithm
  const layout = await elk.layout(graph);

  // Apply calculated positions to table nodes
  // 🔥 Restore actual node heights and adjust Y positions to prevent overlap
  // 🔥 PHASE 2: Extract positions from hierarchical cluster layout

  // Helper function to find node position in hierarchical layout
  const findNodePosition = (nodeId: string): { x: number; y: number } => {
    if (useClustering && clusters && clusters.size > 1) {
      // Search in cluster children
      for (const cluster of layout.children || []) {
        const clusterX = cluster.x || 0;
        const clusterY = cluster.y || 0;

        const childNode = cluster.children?.find((n) => n.id === nodeId);
        if (childNode) {
          return {
            x: clusterX + (childNode.x || 0),
            y: clusterY + (childNode.y || 0),
          };
        }
      }
    } else {
      // Flat layout
      const elkNode = layout.children?.find((n) => n.id === nodeId);
      if (elkNode) {
        return { x: elkNode.x || 0, y: elkNode.y || 0 };
      }
    }
    return { x: 0, y: 0 };
  };

  // First pass: Create nodes with ELK positions and actual heights
  const nodesWithHeights = validTableNodes.map((node) => {
    const position = findNodePosition(node.id);
    const actualHeight =
      nodeHeightMap.get(node.id) || getTableNodeHeight((node.data as ERDNodeData).fields?.length || 0);

    return {
      ...node,
      position,
      data: {
        ...(node.data as ERDNodeData),
        _actualHeight: actualHeight,
      },
      _elkY: position.y,
      _actualHeight: actualHeight,
    };
  });

  // Second pass: Adjust Y positions to account for height differences
  // Group nodes by X position (same layer) and adjust Y spacing
  const xGroups = new Map<number, typeof nodesWithHeights>();
  nodesWithHeights.forEach((node) => {
    const xKey = Math.round(node.position.x / 10) * 10; // Group by ~10px tolerance
    if (!xGroups.has(xKey)) {
      xGroups.set(xKey, []);
    }
    xGroups.get(xKey)!.push(node);
  });

  // Sort each group by Y position and adjust spacing
  xGroups.forEach((group) => {
    group.sort((a, b) => a._elkY - b._elkY);

    let cumulativeOffset = 0;
    group.forEach((node, idx) => {
      if (idx > 0) {
        const prevNode = group[idx - 1];
        const prevBottom = prevNode.position.y + prevNode._actualHeight;
        const currentTop = node._elkY;
        const gap = currentTop - (prevNode._elkY + COMPACT_NODE_HEIGHT);

        // Adjust Y to maintain gap but account for actual height
        node.position.y = prevBottom + gap;
      } else {
        // First node in group keeps its Y position
        node.position.y = node._elkY;
      }
    });
  });

  // Clean up temporary properties
  const layoutedTableNodes = nodesWithHeights.map(({ _elkY, _actualHeight, ...node }) => node);

  // Calculate bounds of all table nodes for title positioning
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;

  layoutedTableNodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x + ERD_TABLE_WIDTH);
    minY = Math.min(minY, node.position.y);
  });

  const layoutedNodes: Node<ERDNodeData | TitleNodeData>[] = [...layoutedTableNodes];

  // Position title node at the top center above all table nodes
  if (titleNode) {
    const titleWidth = 280;
    // Center title horizontally relative to all nodes
    const centerX = (minX + maxX) / 2 - titleWidth / 2;
    // Position title above the topmost node with 80px gap
    const titleY = minY - ERD_TITLE_HEIGHT - 80;

    layoutedNodes.unshift({
      ...titleNode,
      position: {
        x: centerX,
        y: titleY,
      },
    });
  }

  return {
    nodes: layoutedNodes,
    edges: validEdges,
  };
}
