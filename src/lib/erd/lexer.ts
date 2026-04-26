/**
 * Lexer Module
 *
 * Provides tokenization utilities for ERD DSL input.
 * Converts raw DSL text into normalized lines for parsing.
 *
 * @module lexer
 */

/**
 * Tokenizes ERD DSL input into normalized lines
 * Splits input by newlines, trims whitespace, and filters empty lines
 *
 * @param {string} input - Raw ERD DSL text
 * @returns {string[]} Array of non-empty, trimmed lines
 */
export function tokenize(input: string) {
  return input
    .split("\n") // Split by newline characters
    .map((line) => line.trim()) // Remove leading/trailing whitespace from each line
    .filter(Boolean); // Remove empty lines
}
