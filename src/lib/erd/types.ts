/**
 * Types Module
 *
 * Defines TypeScript types and interfaces for the ERD system.
 * Includes entity, relationship, configuration, and ReactFlow node/edge types.
 *
 * @module types
 */

/**
 * Theme mode type
 * @typedef {"dark" | "light"} ThemeMode
 */
export type ThemeMode = "dark" | "light";

/**
 * Relationship cardinality type
 * Defines the type of relationship between entities
 * @typedef {"ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY"} RelationType
 */
export type RelationType = "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";

/**
 * Endpoint cardinality for crow's foot notation
 * Indicates whether an endpoint represents one or many entities
 * @typedef {"ONE" | "MANY"} EndpointCardinality
 */
export type EndpointCardinality = "ONE" | "MANY";

/**
 * Handle side for connection points
 * Indicates whether a handle is on the left or right side of a node
 * @typedef {"left" | "right"} HandleSide
 */
export type HandleSide = "left" | "right";

/**
 * Field definition in an entity
 * @typedef {Object} Field
 * @property {string} name - Field name
 * @property {string} type - Field data type
 * @property {boolean} [pk] - Primary key modifier
 * @property {boolean} [fk] - Foreign key modifier
 * @property {boolean} [uq] - Unique constraint modifier
 */
export type Field = {
  name: string;
  type: string;
  pk?: boolean; // Primary key
  fk?: boolean; // Foreign key
  uq?: boolean; // Unique constraint
};

/**
 * Entity definition
 * @typedef {Object} Entity
 * @property {string} name - Entity/table name
 * @property {string} [color] - Optional custom color
 * @property {string} [icon] - Optional icon identifier
 * @property {Field[]} fields - Array of fields in the entity
 */
export type Entity = {
  name: string;
  color?: string;
  icon?: string;
  fields: Field[];
};

/**
 * Relationship definition between entities
 * @typedef {Object} Relation
 * @property {string} sourceEntity - Source entity name
 * @property {string} [sourceField] - Optional source field name
 * @property {string} targetEntity - Target entity name
 * @property {string} [targetField] - Optional target field name
 * @property {RelationType} type - Type of relationship
 * @property {string} [color] - Optional custom color for the relationship
 */
export type Relation = {
  sourceEntity: string;
  sourceField?: string;
  targetEntity: string;
  targetField?: string;
  type: RelationType;
  color?: string;
};

/**
 * Diagram configuration settings
 * @typedef {Object} DiagramConfig
 * @property {string} [title] - Diagram title
 * @property {"crows-feet" | "chen"} [notation] - Relationship notation style
 * @property {"pastel" | "bold" | "outline"} [colorMode] - Color mode for entities
 * @property {"shadow" | "plain" | "watercolor"} [styleMode] - Visual style mode
 * @property {"rough" | "clean" | "mono"} [typeface] - Font style
 */
export type DiagramConfig = {
  title?: string;
  notation?: "crows-feet" | "chen";
  colorMode?: "pastel" | "bold" | "outline";
  styleMode?: "shadow" | "plain" | "watercolor";
  typeface?: "rough" | "clean" | "mono";
};

/**
 * Complete ERD schema
 * @typedef {Object} ERDSchema
 * @property {Entity[]} entities - Array of entities
 * @property {Relation[]} relations - Array of relationships
 * @property {DiagramConfig} config - Diagram configuration
 */
export type ERDSchema = {
  entities: Entity[];
  relations: Relation[];
  config: DiagramConfig;
};

/**
 * ReactFlow node data for entity/table nodes
 * Extends Entity with theme and config information
 * @typedef {Object} ERDNodeData
 */
export type ERDNodeData = Entity & {
  theme: ThemeMode;
  config: DiagramConfig;
};

/**
 * ReactFlow node data for title nodes
 * @typedef {Object} TitleNodeData
 * @property {string} title - Diagram title
 * @property {ThemeMode} theme - Current theme mode
 */
export type TitleNodeData = {
  title: string;
  theme: ThemeMode;
};

/**
 * ReactFlow edge data for relationship edges
 * @typedef {Object} ERDEdgeData
 * @property {EndpointCardinality} sourceCardinality - Source endpoint cardinality
 * @property {EndpointCardinality} targetCardinality - Target endpoint cardinality
 * @property {string} stroke - Edge color
 */
export type ERDEdgeData = {
  sourceCardinality: EndpointCardinality;
  targetCardinality: EndpointCardinality;
  stroke: string;
  strokeWidth?: number;
  theme?: ThemeMode;
};

/**
 * Generates a unique handle ID for a field connection point
 * Format: "field:{fieldName}:{side}"
 *
 * @param {string} fieldName - Name of the field
 * @param {HandleSide} side - Side of the handle (left or right)
 * @returns {string} Unique handle ID
 */
export function getFieldHandleId(fieldName: string, side: HandleSide) {
  return `field:${fieldName}:${side}`;
}

/**
 * Generates a unique handle ID for an entity connection point
 * Format: "entity:{side}"
 *
 * @param {HandleSide} side - Side of the handle (left or right)
 * @returns {string} Unique handle ID
 */
export function getEntityHandleId(side: HandleSide) {
  return `entity:${side}`;
}
