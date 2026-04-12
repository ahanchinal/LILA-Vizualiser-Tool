# LILA BLACK — Player Journey Visualizer

A browser-based tool for Level Designers to explore player behavior across LILA BLACK's 3 maps, built on 5 days of production telemetry (89,104 events).

## Live Demo

> https://lila-vizualiser-tool.vercel.app/

## Features

- **Player paths** — movement trails for humans (colored per player) and bots (gray)
- **Event markers** — kills, deaths, loot pickups, and storm deaths shown as distinct markers on the map
- **Heatmap overlays** — traffic density, kill zones, and death zones aggregated across all sessions
- **Timeline playback** — scrub or auto-play any match at speeds from 0.5× to 16×
- **Session filters** — filter by map, date, duration, kill count, death count, player type, or session ID
- **Session comparison** — load a second match alongside the primary one; compare match renders in a separate teal colour palette with its own swimlane track
- **Onboarding tour** — a step-by-step walkthrough of every feature, shown on first load

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Visualization | Deck.gl 9 (OrthographicView) |
| State | Zustand 4 |
| Data pipeline | Python 3 + PyArrow + pandas + orjson |
| Hosting | Vercel (static) |

## Data

1,243 Apache Parquet files across 5 days (Feb 10–14) were processed by a Python pipeline into static JSON:
- `public/data/index.json` — manifest of all 796 matches
- `public/data/heatmaps.json` — pre-aggregated 32×32 heatmap grids per map
- `public/data/match/*.json` — per-match event streams

## Project Structure

```
lila-assignment/
├── pipeline/           # Python ETL script
├── public/
│   ├── data/           # Processed JSON
│   └── minimaps/       # Map images
├── src/
│   ├── components/     # React components
│   ├── constants/      # Map configs, event codes, colors
│   ├── hooks/          # Data fetching
│   ├── store/          # Zustand global state
│   └── utils/          # Coordinate transform, color scale
└── INSIGHTS.md         # Key findings from the data
```
