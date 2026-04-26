// @ts-check
// Threshold parser. Compiles a threshold spec like { if: "< 0.3", class: "cold" }
// into a function that takes a numeric value and returns the class name (or null
// if no threshold matches). Per the protocol, thresholds are evaluated in order
// and the FIRST match wins.

/**
 * @typedef {Object} Threshold
 * @property {string} if   Comparison expression: "< 0.3", "<= 0.5", ">= 0.7", "> 0.4", "== 1", "!= 0"
 * @property {string} class Class token to apply when this threshold matches
 */

const OPS = {
  "<=": (a, b) => a <= b,
  ">=": (a, b) => a >= b,
  "==": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  "<":  (a, b) => a < b,
  ">":  (a, b) => a > b,
};

/**
 * Parse a single threshold expression like "< 0.3" into a predicate.
 * Returns null on parse failure (renderer should ignore unknown thresholds).
 * @param {string} expr
 * @returns {((value: number) => boolean) | null}
 */
export function parseThreshold(expr) {
  if (typeof expr !== "string") return null;
  const trimmed = expr.trim();

  // Try 2-char ops first (<=, >=, ==, !=), then 1-char (<, >).
  for (const op of ["<=", ">=", "==", "!=", "<", ">"]) {
    if (trimmed.startsWith(op)) {
      const rhs = parseFloat(trimmed.slice(op.length).trim());
      if (Number.isNaN(rhs)) return null;
      const fn = OPS[op];
      return (value) => fn(value, rhs);
    }
  }
  return null;
}

/**
 * Given a list of thresholds and a numeric value, return the matching class
 * (first match wins). Returns null if no threshold matches.
 * @param {Threshold[]} thresholds
 * @param {number} value
 * @returns {string | null}
 */
export function classFor(thresholds, value) {
  if (!Array.isArray(thresholds)) return null;
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  for (const t of thresholds) {
    const pred = parseThreshold(t.if);
    if (pred && pred(value)) return t.class;
  }
  return null;
}
