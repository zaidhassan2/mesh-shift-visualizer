// ============================================================
// MeshGrid.jsx
// Renders the √p × √p mesh grid with animated node transitions.
// Shows before/after states and draws arrows for data movement.
// ============================================================

import React, { useRef, useEffect } from 'react';

// Node highlight states
// 'idle' | 'highlight-row' | 'highlight-col' | 'moved'
function getNodeStyle(state) {
  const base = {
    width: 70, height: 70,
    borderRadius: 10,
    border: '2px solid #2a3347',
    background: '#161b27',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
    position: 'relative',
  };
  if (state === 'highlight-row') return {
    ...base,
    border: '2px solid #00e5ff',
    background: 'rgba(0,229,255,.1)',
    boxShadow: '0 0 16px rgba(0,229,255,.3)',
    transform: 'scale(1.07)',
  };
  if (state === 'highlight-col') return {
    ...base,
    border: '2px solid #7c3aed',
    background: 'rgba(124,58,237,.15)',
    boxShadow: '0 0 16px rgba(124,58,237,.3)',
    transform: 'scale(1.07)',
  };
  if (state === 'moved') return {
    ...base,
    border: '2px solid #00ff9d',
    background: 'rgba(0,255,157,.08)',
    boxShadow: '0 0 14px rgba(0,255,157,.2)',
  };
  return base;
}

// Draw arrows on canvas for the active stage
function drawArrows(canvas, wrapper, meshEl, side, rowShift, colShift, stage) {
  if (!canvas || !wrapper || !meshEl) return;

  const mRect = meshEl.getBoundingClientRect();
  const wRect = wrapper.getBoundingClientRect();

  canvas.width  = mRect.width;
  canvas.height = mRect.height;
  canvas.style.width  = mRect.width + 'px';
  canvas.style.height = mRect.height + 'px';
  canvas.style.left   = (mRect.left - wRect.left) + 'px';
  canvas.style.top    = (mRect.top  - wRect.top)  + 'px';

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nodeSize = 70;
  const gap      = 10;
  const cell     = nodeSize + gap;

  function arrow(x1, y1, x2, y2, color) {
    const shrink = 26;
    const angle  = Math.atan2(y2 - y1, x2 - x1);
    const sx1 = x1 + Math.cos(angle) * shrink;
    const sy1 = y1 + Math.sin(angle) * shrink;
    const sx2 = x2 - Math.cos(angle) * shrink;
    const sy2 = y2 - Math.sin(angle) * shrink;
    if (Math.hypot(sx2 - sx1, sy2 - sy1) < 8) return;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
    // arrowhead
    const hl = 10;
    ctx.beginPath();
    ctx.moveTo(sx2, sy2);
    ctx.lineTo(sx2 - hl * Math.cos(angle - 0.4), sy2 - hl * Math.sin(angle - 0.4));
    ctx.lineTo(sx2 - hl * Math.cos(angle + 0.4), sy2 - hl * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
  }

  if (stage === 1 && rowShift > 0) {
    for (let r = 0; r < side; r++) {
      for (let c = 0; c < side; c++) {
        const destC = (c + rowShift) % side;
        const x1 = c    * cell + nodeSize / 2;
        const x2 = destC * cell + nodeSize / 2;
        const y  = r * cell + nodeSize / 2;
        if (x1 !== x2) arrow(x1, y, x2, y, 'rgba(0,229,255,0.75)');
      }
    }
  }

  if (stage === 2 && colShift > 0) {
    for (let r = 0; r < side; r++) {
      for (let c = 0; c < side; c++) {
        const destR = (r + colShift) % side;
        const x  = c * cell + nodeSize / 2;
        const y1 = r    * cell + nodeSize / 2;
        const y2 = destR * cell + nodeSize / 2;
        if (y1 !== y2) arrow(x, y1, x, y2, 'rgba(124,58,237,0.75)');
      }
    }
  }
}

export default function MeshGrid({ p, side, values, nodeStates, arrowStage, rowShift, colShift }) {
  const canvasRef  = useRef(null);
  const wrapperRef = useRef(null);
  const meshRef    = useRef(null);

  // Redraw arrows when stage or size changes
  useEffect(() => {
    drawArrows(canvasRef.current, wrapperRef.current, meshRef.current,
               side, rowShift, colShift, arrowStage);
  }, [arrowStage, side, rowShift, colShift]);

  if (!p || !values) {
    return (
      <div style={{ textAlign: 'center', color: '#64748b', padding: 50, fontSize: '.85rem' }}>
        <div style={{ fontSize: '2.5rem', opacity: .25, marginBottom: 8 }}>⬡</div>
        Enter p and q, then click Run Simulation
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* The actual mesh grid */}
      <div
        ref={meshRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${side}, 70px)`,
          gap: 10,
        }}
      >
        {values.map((val, i) => (
          <div key={i} style={getNodeStyle(nodeStates[i] || 'idle')}>
            <div style={{ fontSize: '.58rem', color: '#64748b', lineHeight: 1, marginBottom: 3 }}>
              node {i}
            </div>
            <div style={{
              fontSize: '1rem', fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              color: '#e2e8f0', lineHeight: 1,
              transition: 'color .3s',
            }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas for arrows — positioned absolutely over grid */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}
