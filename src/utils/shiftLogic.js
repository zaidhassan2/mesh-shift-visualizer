// ============================================================
// shiftLogic.js
// Pure circular shift algorithm for a 2D mesh topology.
// No DOM / React dependencies — fully testable in isolation.
// ============================================================

/**
 * Check whether n is a perfect square.
 */
export function isPerfectSquare(n) {
  const s = Math.round(Math.sqrt(n));
  return s * s === n;
}

/**
 * Validate user inputs p and q.
 * Returns { valid: true } or { valid: false, pError, qError }
 */
export function validateInputs(p, q) {
  let pError = '';
  let qError = '';

  if (!p || p < 4 || p > 64 || !isPerfectSquare(p)) {
    pError = 'p must be a perfect square between 4 and 64 (e.g. 4, 9, 16, 25, 36, 49, 64)';
  }
  if (!pError) {
    if (!q || q < 1 || q >= p) {
      qError = `q must be between 1 and ${p - 1}`;
    }
  }

  return { valid: !pError && !qError, pError, qError };
}

/**
 * Core algorithm: compute all states for a circular q-shift on p nodes.
 *
 * A circular q-shift moves data from node i to node (i + q) mod p.
 * On a 2D sqrt(p) × sqrt(p) mesh this is done in TWO stages:
 *
 *   Stage 1 — Row Shift  : each row shifts RIGHT by (q mod √p) positions
 *   Stage 2 — Col Shift  : each col shifts DOWN  by ⌊q / √p⌋ positions
 *
 * @param {number} p - total nodes (perfect square)
 * @param {number} q - shift amount (1 to p-1)
 * @returns {object} - { initial, afterStage1, afterStage2, rowShift, colShift, side }
 */
export function computeShift(p, q) {
  const side     = Math.sqrt(p);
  const rowShift = q % side;            // horizontal positions to shift per row
  const colShift = Math.floor(q / side); // vertical positions to shift per column

  // Initial state: node i stores value i
  const initial = Array.from({ length: p }, (_, i) => i);

  // ── Stage 1: Row Shift ──
  // Position (r, c) receives data from (r, (c - rowShift + side) % side)
  const afterStage1 = new Array(p);
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      const srcC = ((c - rowShift) % side + side) % side;
      afterStage1[r * side + c] = initial[r * side + srcC];
    }
  }

  // ── Stage 2: Column Shift ──
  // Position (r, c) receives data from ((r - colShift + side) % side, c)
  const afterStage2 = new Array(p);
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      const srcR = ((r - colShift) % side + side) % side;
      afterStage2[r * side + c] = afterStage1[srcR * side + c];
    }
  }

  return { initial, afterStage1, afterStage2, rowShift, colShift, side };
}

/**
 * Complexity formulas.
 * @returns { ringSteps, meshSteps, rowShift, colShift }
 */
export function getComplexity(p, q) {
  const side     = Math.sqrt(p);
  const rowShift = q % side;
  const colShift = Math.floor(q / side);
  const meshSteps = rowShift + colShift;
  const ringSteps = Math.min(q, p - q);   // ring uses recursive doubling / shift
  return { ringSteps, meshSteps, rowShift, colShift };
}
