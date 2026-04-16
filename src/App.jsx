// ============================================================
// App.jsx
// Main application — wires ControlPanel, MeshGrid, ComplexityPanel.
// Owns all animation state and the simulation loop.
// ============================================================

import React, { useState, useCallback } from 'react';
import ControlPanel   from './components/ControlPanel';
import MeshGrid       from './components/MeshGrid';
import ComplexityPanel from './components/ComplexityPanel';
import { computeShift } from './utils/shiftLogic';

// ── Styles ──────────────────────────────────────────────────

const cssVars = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0a0c10;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    min-height: 100vh;
  }
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(0,229,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 2px; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  .fade-in { animation: fadeIn .4s ease forwards; }
`;

const S = {
  wrapper: {
    position: 'relative', zIndex: 1,
    maxWidth: 1200, margin: '0 auto', padding: '24px 20px',
  },
  header: {
    textAlign: 'center', marginBottom: 28,
    paddingBottom: 22,
    borderBottom: '1px solid #1e2535',
  },
  h1: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(1.3rem, 3vw, 2rem)',
    fontWeight: 800, letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg,#00e5ff,#7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  sub: { color: '#64748b', fontSize: '.78rem', marginTop: 6 },
  layout: {
    display: 'grid',
    gridTemplateColumns: '270px 1fr',
    gap: 18,
    alignItems: 'start',
  },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  // Stage indicator
  stages: {
    display: 'flex', gap: 0,
    border: '1px solid #1e2535', borderRadius: 10, overflow: 'hidden',
  },
  meshPanel: {
    background: '#11141c', border: '1px solid #1e2535',
    borderRadius: 10, padding: 20, minHeight: 340,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  panelTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '.72rem', fontWeight: 600,
    letterSpacing: '.12em', textTransform: 'uppercase',
    color: '#00e5ff', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
  },
  statesRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
  },
  stateBox: {
    background: '#11141c', border: '1px solid #1e2535',
    borderRadius: 10, padding: 14,
  },
  logBox: {
    background: '#0a0c10', border: '1px solid #1e2535',
    borderRadius: 8, padding: 12,
    maxHeight: 110, overflowY: 'auto',
    fontSize: '.7rem', lineHeight: 1.8, color: '#64748b',
  },
};

// Tiny helper: pause execution for ms milliseconds
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Speed → delay mapping
const SPEED_DELAY = [0, 1100, 750, 480, 280, 130];

// ── Stage indicator ──────────────────────────────────────────
function StageBar({ current }) {
  const stages = ['Initial', 'Stage 1 — Row', 'Stage 2 — Col', 'Complete'];
  return (
    <div style={S.stages}>
      {stages.map((label, i) => {
        const isDone   = i < current;
        const isActive = i === current;
        return (
          <div key={i} style={{
            flex: 1, padding: '11px 8px', textAlign: 'center',
            fontSize: '.68rem', letterSpacing: '.06em', fontWeight: 600,
            textTransform: 'uppercase',
            borderRight: i < 3 ? '1px solid #1e2535' : 'none',
            transition: 'all .3s',
            background: isActive ? 'rgba(0,229,255,.07)'  : isDone ? 'rgba(0,255,157,.05)' : '#11141c',
            color:      isActive ? '#00e5ff' : isDone ? '#00ff9d' : '#475569',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              display: 'inline-block', marginRight: 5,
              background: isActive ? '#00e5ff' : isDone ? '#00ff9d' : '#1e2535',
              verticalAlign: 'middle',
            }} />
            {label}
          </div>
        );
      })}
    </div>
  );
}

// ── Mini grid (before/after state boxes) ─────────────────────
function MiniGrid({ data, side, compareData, cls, title, titleColor }) {
  if (!data) return null;
  return (
    <div style={S.stateBox}>
      <div style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.1em', color: titleColor || '#64748b', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${side}, 1fr)`, gap: 3 }}>
        {data.map((val, i) => {
          const changed = compareData && val !== compareData[i];
          return (
            <div key={i} style={{
              height: 26, borderRadius: 4,
              border: `1px solid ${changed ? (cls === 'final' ? '#00ff9d' : '#00e5ff') : '#1e2535'}`,
              background: changed ? (cls === 'final' ? 'rgba(0,255,157,.08)' : 'rgba(0,229,255,.08)') : '#0a0c10',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.62rem', fontWeight: 600,
              color: changed ? (cls === 'final' ? '#00ff9d' : '#00e5ff') : '#94a3b8',
              transition: 'all .3s',
            }}>
              {val}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Log panel ────────────────────────────────────────────────
function LogPanel({ entries }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);
  return (
    <div style={{ background: '#11141c', border: '1px solid #1e2535', borderRadius: 10, padding: 16 }}>
      <div style={{ ...S.panelTitle }}>
        Simulation Log
        <span style={{ flex: 1, height: 1, background: '#1e2535' }} />
      </div>
      <div ref={ref} style={S.logBox}>
        {entries.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#7c3aed', flexShrink: 0 }}>{e.ts}</span>
            <span style={{ color: e.ok ? '#00ff9d' : e.phase ? '#00e5ff' : '#94a3b8' }}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const [running,     setRunning]     = useState(false);
  const [stageIdx,    setStageIdx]    = useState(0);
  const [meshState,   setMeshState]   = useState(null);   // { p, side, values, nodeStates, arrowStage, rowShift, colShift }
  const [states,      setStates]      = useState(null);   // { initial, s1, s2 }
  const [complexityP, setComplexityP] = useState(null);
  const [complexityQ, setComplexityQ] = useState(null);
  const [logEntries,  setLogEntries]  = useState([{ ts: '--:--:--', msg: 'Ready. Configure and run.', phase: false, ok: false }]);

  const addLog = useCallback((msg, { phase = false, ok = false } = {}) => {
    const now = new Date();
    const ts  = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => String(n).padStart(2, '0')).join(':');
    setLogEntries(prev => [...prev, { ts, msg, phase, ok }]);
  }, []);

  // ── Simulation runner ──────────────────────────────────────
  async function runSimulation(p, q, speed) {
    setRunning(true);
    setComplexityP(p);
    setComplexityQ(q);

    const delay = SPEED_DELAY[speed];
    const { initial, afterStage1, afterStage2, rowShift, colShift, side } = computeShift(p, q);

    // Reset state
    setStageIdx(0);
    setStates(null);
    setLogEntries([]);
    addLog(`Starting: p=${p}, q=${q}, rowShift=${rowShift}, colShift=${colShift}`, { phase: true });

    // Helper: set all node states at once
    const setNodes = (values, statesFn, arrowStage) => {
      setMeshState({
        p, side, values: [...values],
        nodeStates: Array.from({ length: p }, (_, i) => statesFn(i)),
        arrowStage, rowShift, colShift,
      });
    };

    // ── Initial state ──
    setNodes(initial, () => 'idle', 0);
    setStates({ initial, s1: null, s2: null });
    setStageIdx(0);
    await sleep(delay * 0.5);

    // ── Stage 1: Row highlight sweep ──
    setStageIdx(1);
    addLog('Stage 1: Row-wise shift starting...', { phase: true });
    for (let r = 0; r < side; r++) {
      setNodes(initial, i => Math.floor(i / side) === r ? 'highlight-row' : 'idle', 0);
      await sleep(Math.max(80, delay / side));
    }
    // Show all rows highlighted + arrows
    setNodes(initial, () => 'highlight-row', 1);
    await sleep(delay * 0.7);

    // Apply stage 1
    setNodes(afterStage1, () => 'idle', 0);
    setStates(prev => ({ ...prev, s1: afterStage1 }));
    addLog(`Stage 1 done — each row shifted right by ${rowShift}`, { ok: true });
    await sleep(delay * 0.4);

    // ── Stage 2: Column highlight sweep ──
    setStageIdx(2);
    addLog('Stage 2: Column-wise shift starting...', { phase: true });
    for (let c = 0; c < side; c++) {
      setNodes(afterStage1, i => i % side === c ? 'highlight-col' : 'idle', 0);
      await sleep(Math.max(80, delay / side));
    }
    // Show all cols highlighted + arrows
    setNodes(afterStage1, () => 'highlight-col', 2);
    await sleep(delay * 0.7);

    // Apply stage 2
    setNodes(afterStage2, () => 'moved', 0);
    setStates(prev => ({ ...prev, s2: afterStage2 }));
    addLog(`Stage 2 done — each column shifted down by ${colShift}`, { ok: true });
    await sleep(delay * 0.3);

    setStageIdx(3);
    addLog(`✓ Circular shift complete. Node i → (i + ${q}) mod ${p}`, { ok: true });
    setRunning(false);
  }

  function handleReset() {
    if (running) return;
    setMeshState(null);
    setStates(null);
    setStageIdx(0);
    setLogEntries([{ ts: '--:--:--', msg: 'Reset. Ready.', phase: false, ok: false }]);
  }

  const complexityActive = complexityP && complexityQ;

  return (
    <>
      <style>{cssVars}</style>
      <div style={S.wrapper}>

        {/* Header */}
        <header style={S.header}>
          <h1 style={S.h1}>Mesh Circular Shift Visualizer</h1>
          <p style={S.sub}>Parallel &amp; Distributed Computing — Interactive 2-Stage Shift Simulation</p>
        </header>

        <div style={S.layout}>

          {/* LEFT: Control Panel */}
          <ControlPanel onRun={runSimulation} onReset={handleReset} running={running} />

          {/* RIGHT */}
          <div style={S.rightCol}>

            {/* Stage bar */}
            <StageBar current={stageIdx} />

            {/* Mesh Grid */}
            <div style={S.meshPanel}>
              <div style={S.panelTitle}>
                Mesh Grid
                <span style={{ flex: 1, height: 1, background: '#1e2535' }} />
              </div>
              <MeshGrid
                p={meshState?.p}
                side={meshState?.side}
                values={meshState?.values}
                nodeStates={meshState?.nodeStates || []}
                arrowStage={meshState?.arrowStage || 0}
                rowShift={meshState?.rowShift || 0}
                colShift={meshState?.colShift || 0}
              />
            </div>

            {/* Before / After state panels */}
            <div style={S.statesRow}>
              <MiniGrid
                data={states?.initial} side={meshState?.side}
                compareData={null} cls=""
                title="① Initial State" titleColor="#64748b"
              />
              <MiniGrid
                data={states?.s1} side={meshState?.side}
                compareData={states?.initial} cls="changed"
                title="② After Stage 1" titleColor="#00e5ff"
              />
              <MiniGrid
                data={states?.s2} side={meshState?.side}
                compareData={states?.s1} cls="final"
                title="③ Final State" titleColor="#00ff9d"
              />
            </div>

            {/* Log */}
            <LogPanel entries={logEntries} />

            {/* Complexity Panel */}
            <ComplexityPanel
              p={complexityP} q={complexityQ}
              active={complexityActive}
            />

          </div>
        </div>
      </div>
    </>
  );
}
