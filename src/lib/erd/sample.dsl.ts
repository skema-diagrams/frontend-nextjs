/**
 * Sample DSL Module
 *
 * Provides a sample ERD DSL document demonstrating all features of the DSL syntax.
 * Used as the default content when the ERD editor loads.
 *
 * @module sample.dsl
 */

/**
 * Sample ERD DSL demonstrating:
 * - Diagram configuration (title, notation, colors, style)
 * - Entity definitions with fields and modifiers
 * - Field modifiers (pk: primary key, fk: foreign key, uq: unique)
 * - Entity properties (color, icon)
 * - Relationship declarations with different cardinalities
 * - Relationship operators: - (one-to-one), < (one-to-many), > (many-to-one), <> (many-to-many)
 *
 * @type {string}
 */
export const sampleDSL = `title My ERD Diagram Generator
notation crows-feet
colorMode pastel
styleMode shadow

typeface clean

// Users entity with custom color and icon
users [icon: user, color: blue] {
  id string pk
  email string uq
  profile_id string fk
}

// Profiles entity with custom color
profiles [color: red] {
  id string pk
  bio text
}

// Posts entity with custom color
posts [color: green] {
  id string pk
  user_id string fk
  title string
}

// Comments entity without custom color
comments {
  id string pk
  user_id string fk
  post_id string fk
  content text
}

// Teams entity
teams {
  id string pk
  name string
}

// Audit log entity
audit_log {
  id string pk
  event string
}

// Relationships
users.profile_id - profiles.id
users.id < posts.user_id
users.id < comments.user_id
posts.id < comments.post_id
teams.id <> users.id
`;
