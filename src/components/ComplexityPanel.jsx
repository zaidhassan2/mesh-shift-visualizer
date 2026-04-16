// ============================================================
// ComplexityPanel.jsx
// Real-time complexity analysis panel.
// Shows ring vs mesh step counts with a bar chart comparison.
// ============================================================

import React from 'react';
import { getComplexity } from '../utils/shiftLogic';

const S = {
  panel: {
    background: '#11141c',
    border: '1px solid #1e2535',
    borderRadius: 10,
    padding: 20,
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
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 16,
  },
  metric: {
    background: '#0a0c10',
    border: '1px solid #1e2535',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
  },
  mLabel: {
    fontSize: '.62rem', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '.08em',
  },
  mVal: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.5rem', fontWeight: 800, marginTop: 4,
  },
  formulaRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
  },
  card: {
    background: '#0a0c10', border: '1px solid #1e2535',
    borderRadius: 8, padding: 12,
  },
  cardLabel: {
    fontSize: '.62rem', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6,
  },
  cardFormula: { fontSize: '.75rem', color: '#ffd740', marginBottom: 4 },
  barChart: {
    display: 'flex', gap: 20, alignItems: 'flex-end',
    height: 80, padding: '0 10px', marginBottom: 10,
  },
  barWrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end',
  },
  barLabel: { fontSize: '.65rem', color: '#64748b' },
  barNum:   { fontSize: '.8rem', fontWeight: 700, color: '#e2e8f0' },
  note: {
    fontSize: '.68rem', color: '#64748b', lineHeight: 1.8, marginTop: 10,
  },
};

export default function ComplexityPanel({ p, q, active }) {
  // active = false means no valid params yet
  const c = active ? getComplexity(p, q) : null;

  const maxS  = c ? Math.max(c.ringSteps, c.meshSteps, 1) : 1;
  const ringH = c ? Math.max(4, (c.ringSteps / maxS) * 70) : 4;
  const meshH = c ? Math.max(4, (c.meshSteps / maxS) * 70) : 4;

  return (
    <div style={S.panel}>
      {/* Title */}
      <div style={S.title}>
        Complexity Analysis
        <span style={{ flex: 1, height: 1, background: '#1e2535' }} />
      </div>

      {/* 3 metrics */}
      <div style={S.metricsRow}>
        <div style={S.metric}>
          <div style={S.mLabel}>Row Shift</div>
          <div style={{ ...S.mVal, color: '#00e5ff' }}>{c ? c.rowShift : '—'}</div>
        </div>
        <div style={S.metric}>
          <div style={S.mLabel}>Col Shift</div>
          <div style={{ ...S.mVal, color: '#7c3aed' }}>{c ? c.colShift : '—'}</div>
        </div>
        <div style={S.metric}>
          <div style={S.mLabel}>Total Steps</div>
          <div style={{ ...S.mVal, color: '#00ff9d' }}>{c ? c.meshSteps : '—'}</div>
        </div>
      </div>

      {/* Formula comparison */}
      <div style={S.formulaRow}>
        <div style={S.card}>
          <div style={S.cardLabel}>Ring Steps</div>
          <div style={S.cardFormula}>min(q, p − q)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Syne',sans-serif", color: '#ff7043' }}>
            {c ? c.ringSteps : '—'}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardLabel}>Mesh Steps</div>
          <div style={S.cardFormula}>(q mod √p) + ⌊q/√p⌋</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Syne',sans-serif", color: '#00ff9d' }}>
            {c ? c.meshSteps : '—'}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ ...S.title, marginBottom: 10, fontSize: '.65rem' }}>
        Step Count Comparison
        <span style={{ flex: 1, height: 1, background: '#1e2535' }} />
      </div>
      <div style={S.barChart}>
        {/* Ring bar */}
        <div style={S.barWrap}>
          <div style={S.barNum}>{c ? c.ringSteps : '—'}</div>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0', minHeight: 4,
            height: ringH,
            background: 'linear-gradient(180deg,#ff7043,#bf360c)',
            transition: 'height .5s cubic-bezier(.34,1.56,.64,1)',
          }} />
          <div style={S.barLabel}>Ring</div>
        </div>
        {/* Mesh bar */}
        <div style={S.barWrap}>
          <div style={S.barNum}>{c ? c.meshSteps : '—'}</div>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0', minHeight: 4,
            height: meshH,
            background: 'linear-gradient(180deg,#00ff9d,#00796b)',
            transition: 'height .5s cubic-bezier(.34,1.56,.64,1)',
          }} />
          <div style={S.barLabel}>Mesh</div>
        </div>
      </div>

      <div style={S.note}>
        The mesh decomposes the shift into at most{' '}
        <span style={{ color: '#00e5ff' }}>√p − 1</span> row steps +{' '}
        <span style={{ color: '#7c3aed' }}>√p − 1</span> column steps,
        vs up to <span style={{ color: '#ff7043' }}>p/2</span> steps on a ring.
        Mesh is significantly more efficient for large p.
      </div>
    </div>
  );
}
