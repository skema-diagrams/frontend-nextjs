/**
 * Parser Module
 *
 * Parses ERD DSL (Domain Specific Language) into structured schema objects.
 * Handles entity definitions, field declarations, relationships, and configuration directives.
 *
 * @module parser
 */

import { Entity, ERDSchema, Relation, RelationType } from "./types";

/**
 * Removes surrounding double quotes from a string
 * Returns the original string if it doesn't have matching quotes
 *
 * @param {string} value - String that may be quoted
 * @returns {string} Unquoted string
 */
function stripQuotes(value: string) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * Parses a comma-separated properties string into a key-value object
 * Properties format: "key1: value1, key2: value2"
 * Values can be quoted strings
 *
 * @param {string} rawProps - Raw properties string
 * @returns {Record<string, string>} Parsed properties object
 */
function parseProperties(rawProps: string) {
  return rawProps.split(",").reduce<Record<string, string>>((accumulator, prop) => {
    // Split by first colon to separate key and value
    const [rawKey, ...rawValue] = prop.split(":");
    const key = rawKey?.trim();
    const value = rawValue.join(":").trim(); // Rejoin in case value contains colons

    // Add to accumulator if both key and value exist
    if (key && value) {
      accumulator[key] = stripQuotes(value);
    }

    return accumulator;
  }, {});
}

/**
 * Normalizes notation type to valid values
 * Accepts "chen" or defaults to "crows-feet"
 *
 * @param {string} value - Notation type string
 * @returns {ERDSchema["config"]["notation"]} Normalized notation type
 */
function normalizeNotation(value: string): ERDSchema["config"]["notation"] {
  return value.trim() === "chen" ? "chen" : "crows-feet";
}

/**
 * Parses an entity or field reference (e.g., "users.id" or "users")
 * Extracts entity name and optional field name
 *
 * @param {string} reference - Reference string in format "entity" or "entity.field"
 * @returns {{entity: string, field?: string}} Parsed reference object
 */
function parseReference(reference: string) {
  // Split by first dot to separate entity and field
  const [rawEntity, ...rawField] = reference.split(".");

  return {
    entity: stripQuotes(rawEntity.trim()),
    field: rawField.length ? stripQuotes(rawField.join(".").trim()) : undefined,
  };
}

/**
 * Parses ERD DSL input into a structured schema
 * Handles:
 * - Entity definitions with fields and modifiers
 * - Relationship declarations with cardinality
 * - Configuration directives (title, notation, colors, etc.)
 *
 * @param {string} input - Raw ERD DSL text
 * @returns {ERDSchema} Parsed schema with entities, relations, and config
 */
export function parseDSL(input: string): ERDSchema {
  const lines = input.split("\n").map((line) => line.trim());

  const entities: Entity[] = [];
  const relations: Relation[] = [];

  // Initialize default configuration
  const config: ERDSchema["config"] = {
    notation: "crows-feet",
    colorMode: "pastel",
    styleMode: "shadow",
    typeface: "clean",
    title: undefined,
  };

  // Track current entity being parsed
  let currentEntity: Entity | null = null;

  // Parse each line
  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) continue;

    // Skip comments
    if (line.startsWith("//")) continue;

    // Handle entity block start (e.g., "users {" or "users [color: blue] {")
    if (line.endsWith("{")) {
      const entityLine = line.replace("{", "").trim();

      // Match entity name with optional properties: name [prop1: val1, prop2: val2]
      const propertyMatch = entityLine.match(/^(?:"([^"]+)"|([^\[\s]+))\s*\[(.*?)\]$/);

      let name = entityLine;
      let icon = undefined;
      let color = undefined;

      // Extract properties if present
      if (propertyMatch) {
        name = propertyMatch[1] ?? propertyMatch[2];

        const props = parseProperties(propertyMatch[3]);

        icon = props.icon;
        color = props.color;
      }

      // Create new entity
      currentEntity = {
        name: stripQuotes(name),
        icon,
        color,
        fields: [],
      };

      entities.push(currentEntity);

      continue;
    }

    // Handle entity block end
    if (line === "}") {
      currentEntity = null;
      continue;
    }

    // Handle fields inside entity blocks (e.g., "id string pk")
    if (currentEntity) {
      const parts = line.split(/\s+/);

      // Field format: name type [modifiers...]
      if (parts.length >= 2) {
        currentEntity.fields.push({
          name: parts[0],
          type: parts[1],
          pk: parts.includes("pk"), // Primary key modifier
          fk: parts.includes("fk"), // Foreign key modifier
          uq: parts.includes("uq"), // Unique modifier
        });
      }

      continue;
    }

    // Handle config directives (only when NOT inside an entity)
    if (line.startsWith("title ")) {
      config.title = stripQuotes(line.replace("title ", "").trim());
      continue;
    }

    if (line.startsWith("notation ")) {
      config.notation = normalizeNotation(line.replace("notation ", ""));
      continue;
    }

    if (line.startsWith("colorMode ")) {
      config.colorMode = line.replace("colorMode ", "") as any;
      continue;
    }

    if (line.startsWith("styleMode ")) {
      config.styleMode = line.replace("styleMode ", "") as any;
      continue;
    }

    if (line.startsWith("typeface ")) {
      config.typeface = line.replace("typeface ", "") as any;
      continue;
    }

    // Handle relationship declarations
    const relationOperators = ["<>", "<", ">", "-"];

    // Extract relationship properties if present (e.g., [color: red])
    const relationPropertyMatch = line.match(/\[(.*)\]\s*$/);

    const relationProperties = relationPropertyMatch ? parseProperties(relationPropertyMatch[1]) : {};

    // Remove properties from line for operator matching
    const relationLine = relationPropertyMatch ? line.slice(0, relationPropertyMatch.index).trim() : line;

    // Find relationship operator
    const operator = relationOperators.find((op) => relationLine.includes(op));

    if (operator) {
      // Split by operator to get source and target references
      const [left, right] = relationLine.split(operator).map((value) => value.trim());

      const source = parseReference(left);
      const target = parseReference(right);

      // Determine relationship type based on operator
      let type: RelationType = "ONE_TO_ONE";

      if (operator === "<") {
        type = "ONE_TO_MANY"; // One source to many targets
      }

      if (operator === ">") {
        type = "MANY_TO_ONE"; // Many sources to one target
      }

      if (operator === "<>") {
        type = "MANY_TO_MANY"; // Many to many relationship
      }

      if (operator === "-") {
        type = "ONE_TO_ONE"; // One to one relationship
      }

      // Add relationship to schema
      relations.push({
        sourceEntity: source.entity,
        sourceField: source.field,
        targetEntity: target.entity,
        targetField: target.field,
        type,
        color: relationProperties.color,
      });
    }
  }

  return {
    entities,
    relations,
    config,
  };
}
