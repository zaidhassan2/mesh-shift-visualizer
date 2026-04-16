# Mesh Circular Shift Visualizer

An interactive web application that simulates and visualizes **circular q-shift** on a 2D mesh topology — built for the Parallel & Distributed Computing assignment.

## 🚀 Live Deployment URL

> **https://mesh-shift-visualizer.netlify.app**
> *(Replace this with your actual Netlify/Vercel URL after deployment)*

---

## What It Does

A circular q-shift moves data from node `i` to node `(i + q) mod p`. On a **√p × √p mesh**, this is done efficiently in **two stages**:

| Stage | Operation | Steps |
|-------|-----------|-------|
| Stage 1 | Row Shift — each row shifts right by `q mod √p` | `q mod √p` |
| Stage 2 | Column Shift — each column shifts down by `⌊q / √p⌋` | `⌊q / √p⌋` |
| **Total** | | `(q mod √p) + ⌊q / √p⌋` |

Compare to a **ring**: `min(q, p-q)` steps — much slower for large p.

---

## Project Structure

```
mesh-shift-visualizer/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── MeshGrid.jsx        ← grid rendering + animation + arrows
│   │   ├── ControlPanel.jsx    ← user inputs (p, q, speed, buttons)
│   │   └── ComplexityPanel.jsx ← complexity analysis + bar chart
│   ├── utils/
│   │   └── shiftLogic.js       ← pure shift algorithm (testable, no DOM)
│   ├── App.jsx                 ← main app, animation state machine
│   └── index.js                ← React entry point
├── README.md
└── package.json
```

---

## Running Locally

### Prerequisites
- Node.js v16+ and npm

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/mesh-shift-visualizer.git
cd mesh-shift-visualizer

# 2. Install dependencies
npm install

# 3. Start development server
npm start
# Opens http://localhost:3000 automatically
```

---

## Deployment (Netlify — Free)

### Option A: Netlify Drop (Fastest, no account needed)
```bash
npm run build          # creates /build folder
```
Go to **https://app.netlify.com/drop** → drag the `/build` folder → instant live URL.

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=build
```

### Option C: GitHub Pages
```bash
npm install --save-dev gh-pages
# Add to package.json scripts: "deploy": "gh-pages -d build"
# Add: "homepage": "https://YOUR_USERNAME.github.io/mesh-shift-visualizer"
npm run build && npm run deploy
```

### Option D: Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## Features

- **Input Validation** — p must be a perfect square (4–64), q must be 1 to p−1
- **Animated Mesh Grid** — nodes highlight row-by-row, then column-by-column
- **Arrow Visualization** — canvas arrows show direction of data movement for each stage
- **Before/After State Panels** — three mini-grids showing initial → stage 1 → final
- **Complexity Panel** — live ring vs mesh step comparison with bar chart
- **Simulation Log** — timestamped log of each phase
- **Speed Control** — 5 speed settings from slow (educational) to fast

---

## Algorithm (shiftLogic.js)

```js
// Stage 1: row shift
for r in rows:
    for c in cols:
        afterStage1[r][c] = initial[r][(c - rowShift + side) % side]

// Stage 2: column shift  
for r in rows:
    for c in cols:
        afterStage2[r][c] = afterStage1[(r - colShift + side) % side][c]
```

The logic module is pure JS with zero DOM dependencies — it can be imported and unit-tested independently.

---

## Tech Stack

- **React 18** — component-based UI
- **Vanilla CSS-in-JS** — no external CSS framework
- **HTML5 Canvas** — arrow rendering
- **Google Fonts** — JetBrains Mono + Syne
