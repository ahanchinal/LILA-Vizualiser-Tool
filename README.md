# LILA BLACK — Player Journey Visualizer

A browser-based tool for Level Designers to explore player behavior across LILA BLACK's 3 maps, built on 5 days of production telemetry (89,104 events).

## Live Demo

> https://lila-vizualiser-tool.vercel.app/

## Features

- **Player paths** — movement trails for humans (colored) and bots (gray)
- **Event markers** — kills, deaths, loot pickups, and storm deaths as distinct markers
- **Heatmap overlays** — traffic density, kill zones, and death zones across the full dataset
- **Timeline playback** — scrub or auto-play any match with adjustable speed (1×–16×)
- **Filters** — by map, date, and individual match
- **Human vs bot distinction** — visual and filter-level separation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Visualization | Deck.gl 9 (OrthographicView) |
| State | Zustand 4 |
| Data pipeline | Python 3 + PyArrow + pandas + orjson |
| Hosting | Vercel (static) |

## Setup

### 1. Run the data pipeline (one-time)

```bash
cd pipeline
pip install -r requirements.txt
cd ..
py pipeline/process_data.py
```

This reads all 1,243 parquet files from `player_data/` and outputs:
- `public/data/index.json` — match manifest
- `public/data/heatmaps.json` — pre-aggregated heatmaps
- `public/data/match/*.json` — 796 per-match files
- `public/minimaps/` — minimap images

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Environment Variables

None required. All data is static JSON served from `public/`.

## Deployment (Vercel)

1. Push repo to GitHub (include `public/data/` and `public/minimaps/`)
2. Import repo in [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — no configuration needed beyond `vercel.json`
4. Deploy

## Project Structure

```
lila-assignment/
├── pipeline/           # Python ETL script
├── public/
│   ├── data/           # Generated JSON (run pipeline first)
│   └── minimaps/       # Map images (copied by pipeline)
├── src/
│   ├── components/     # React components
│   ├── constants/      # Map configs, event codes, colors
│   ├── hooks/          # useMatchData
│   ├── store/          # Zustand global state
│   └── utils/          # Coordinate transform, color scale
└── player_data/        # Raw parquet files (source data)
```
