/**
 * Flow Configuration Module
 *
 * Defines node and edge type mappings for ReactFlow.
 * Keeps these objects in a separate module to ensure stable references
 * and prevent React Flow warnings about recreating these objects.
 *
 * @module flowConfig
 * @see https://reactflow.dev/learn/troubleshooting/common-errors#002
 */

import TableNode from "./TableNode";
import TitleNode from "./TitleNode";
import CrowFootEdge from "./CrowFootEdge";

/**
 * Node type mappings for ReactFlow
 * Maps node type strings to their corresponding React components
 *
 * @type {Object}
 * @property {React.ComponentType} tableNode - Entity/table node component
 * @property {React.ComponentType} titleNode - Diagram title node component
 */
export const nodeTypes = {
  tableNode: TableNode,
  titleNode: TitleNode,
};

/**
 * Edge type mappings for ReactFlow
 * Maps edge type strings to their corresponding React components
 *
 * @type {Object}
 * @property {React.ComponentType} crowFoot - Crow's foot notation edge component
 */
export const edgeTypes = {
  crowFoot: CrowFootEdge,
};
