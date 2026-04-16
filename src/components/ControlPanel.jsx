// ============================================================
// ControlPanel.jsx
// User input controls: p, q, speed, run/reset buttons.
// ============================================================

import React from 'react';
import { validateInputs, getComplexity, isPerfectSquare } from '../utils/shiftLogic';

// Inline styles (no external CSS file needed for single-file deploy)
const S = {
  panel: {
    background: '#11141c',
    border: '1px solid #1e2535',
    borderRadius: 10,
    padding: 20,
    position: 'sticky',
    top: 20,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '.72rem',
    fontWeight: 600,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: '#00e5ff',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    display: 'block',
    fontSize: '.72rem',
    color: '#64748b',
    marginBottom: 5,
    letterSpacing: '.04em',
  },
  input: {
    width: '100%',
    background: '#0a0c10',
    border: '1px solid #1e2535',
    borderRadius: 6,
    color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '.85rem',
    padding: '8px 12px',
    outline: 'none',
    marginBottom: 4,
    boxSizing: 'border-box',
  },
  inputError: { borderColor: '#ff7043' },
  errMsg: { fontSize: '.68rem', color: '#ff7043', minHeight: 14, marginBottom: 10 },
  btnPrimary: {
    display: 'block', width: '100%', padding: '10px',
    border: 'none', borderRadius: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '.78rem', fontWeight: 700,
    letterSpacing: '.06em', cursor: 'pointer',
    background: '#00e5ff', color: '#000',
    marginBottom: 8, transition: 'opacity .2s',
  },
  btnDisabled: { opacity: .4, cursor: 'not-allowed' },
  btnSecondary: {
    display: 'block', width: '100%', padding: '9px',
    border: '1px solid #1e2535', borderRadius: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '.78rem', fontWeight: 600,
    cursor: 'pointer', background: 'transparent',
    color: '#64748b', marginBottom: 16,
  },
  formulaBox: {
    background: '#0a0c10',
    border: '1px solid #1e2535',
    borderRadius: 6,
    padding: 12,
    fontSize: '.7rem',
    color: '#64748b',
    lineHeight: 1.9,
  },
  speedRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  range: { flex: 1, accentColor: '#00e5ff', cursor: 'pointer' },
  speedVal: { fontSize: '.75rem', color: '#00e5ff', minWidth: 28 },
};

export default function ControlPanel({ onRun, onReset, running }) {
  const [p, setP]         = React.useState(16);
  const [q, setQ]         = React.useState(6);
  const [speed, setSpeed] = React.useState(3);
  const [errors, setErrors] = React.useState({ pError: '', qError: '' });

  // Live preview of formula values
  const liveOk = isPerfectSquare(p) && p >= 4 && p <= 64 && q >= 1 && q < p;
  const complexity = liveOk ? getComplexity(p, q) : null;

  function handleRun() {
    const result = validateInputs(p, q);
    if (!result.valid) {
      setErrors({ pError: result.pError, qError: result.qError });
      return;
    }
    setErrors({ pError: '', qError: '' });
    onRun(p, q, speed);
  }

  return (
    <aside style={S.panel}>
      {/* Title */}
      <div style={S.title}>
        Controls
        <span style={{ flex: 1, height: 1, background: '#1e2535' }} />
      </div>

      {/* p input */}
      <label style={S.label}>Grid size p (perfect square, 4–64)</label>
      <input
        type="number" min="4" max="64" value={p}
        onChange={e => setP(parseInt(e.target.value) || '')}
        style={{ ...S.input, ...(errors.pError ? S.inputError : {}) }}
      />
      <div style={S.errMsg}>{errors.pError}</div>

      {/* q input */}
      <label style={S.label}>Shift amount q (1 to p−1)</label>
      <input
        type="number" min="1" value={q}
        onChange={e => setQ(parseInt(e.target.value) || '')}
        style={{ ...S.input, ...(errors.qError ? S.inputError : {}) }}
      />
      <div style={S.errMsg}>{errors.qError}</div>

      {/* Speed */}
      <div style={S.speedRow}>
        <label style={{ ...S.label, marginBottom: 0, whiteSpace: 'nowrap' }}>Speed</label>
        <input type="range" min="1" max="5" value={speed}
          onChange={e => setSpeed(parseInt(e.target.value))}
          style={S.range}
        />
        <span style={S.speedVal}>{speed}×</span>
      </div>

      {/* Buttons */}
      <button
        style={{ ...S.btnPrimary, ...(running ? S.btnDisabled : {}) }}
        onClick={handleRun}
        disabled={running}
      >
        ▶  Run Simulation
      </button>
      <button style={S.btnSecondary} onClick={onReset} disabled={running}>
        ↺  Reset
      </button>

      {/* Live formula preview */}
      <div style={S.formulaBox}>
        <div style={{ color: '#94a3b8', marginBottom: 4 }}>Stage 1 — Row Shift</div>
        <div>
          <span style={{ color: '#00e5ff' }}>q mod √p</span>
          {' = '}
          <span style={{ color: '#ffd740', fontWeight: 700 }}>
            {complexity ? complexity.rowShift : '—'}
          </span>
          {' positions'}
        </div>
        <br />
        <div style={{ color: '#94a3b8', marginBottom: 4 }}>Stage 2 — Column Shift</div>
        <div>
          <span style={{ color: '#7c3aed' }}>⌊q / √p⌋</span>
          {' = '}
          <span style={{ color: '#ffd740', fontWeight: 700 }}>
            {complexity ? complexity.colShift : '—'}
          </span>
          {' positions'}
        </div>
        <br />
        <div style={{ color: '#94a3b8' }}>
          Node <span style={{ color: '#00e5ff' }}>i</span>
          {' → '}
          Node <span style={{ color: '#00e5ff' }}>(i + q) mod p</span>
        </div>
      </div>
    </aside>
  );
}
