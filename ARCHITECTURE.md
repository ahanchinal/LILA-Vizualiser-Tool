# Architecture: LILA BLACK Player Journey Visualizer

## Project Overview

The goal of this project was to build a highly responsive tool that allows Level Designers to visualize how players move and interact within the game maps. The priority was to ensure the tool feels "instant" and can handle the full 5-day dataset without performance lag.

---

## Tech Stack Decisions

### React & Vite

React allows different parts of the screen — the map, the sidebar filters, and the playback bar — to stay in perfect sync. Vite was used to ensure the app stays lightweight and loads quickly in the browser.

### Deck.gl (The Map Engine)

Instead of using a basic HTML canvas, Deck.gl was used — a high-performance framework designed specifically for large spatial datasets.

- **Performance:** Uses the GPU, allowing it to render nearly 90,000 data points and movement paths simultaneously without stuttering.
- **Layering:** Allows stacking a PathLayer for player trails, a ScatterplotLayer for kills/loot dots, and a BitmapLayer for heatmaps, all perfectly aligned on top of the minimap image.

### Zustand (State Management)

To handle the playback feature, the app needs a central "brain" to track the current second of the match. Zustand shares `currentTime` across the map and the timeline scrubber so they move together.

### Pre-processing: Python Pipeline

The raw gameplay data is provided in Apache Parquet format, which browsers cannot read natively. A Python pipeline converts the Parquet files into static JSON.

- **Why JSON?** JSON is much easier for a browser to parse.
- **Efficiency:** Since this is a static 5-day dataset, pre-processing into JSON allows the tool to be hosted cheaply and run instantly. A live dataset would warrant a dedicated backend server.
- **On-Demand Loading:** The app loads an index file first, then only downloads the movement data for a specific match when the user clicks on it, saving bandwidth.

---

## Data Flow

```
player_data/**/*.nakama-0 (parquet)
        │
        ▼
pipeline/process_data.py
        │
        ├── public/data/index.json        (match manifest, 796 entries)
        ├── public/data/heatmaps.json     (32×32 grids × 3 modes × 3 maps)
        └── public/data/match/{id}.json   (per-match events, 796 files)
        │
        ▼
Browser (React app)
        │
        ├── App.jsx → useMatchData()
        │       ├── fetch /data/index.json     → Zustand matchList
        │       └── fetch /data/heatmaps.json  → Zustand heatmapData
        │
        ├── User selects match
        │       └── fetch /data/match/{id}.json → Zustand matchData
        │
        ├── Zustand store (selectedMap, currentTime, layer toggles…)
        │
        ├── DeckLayers.jsx (reads store, returns layer array)
        │       ├── PathLayer        ← position events, filtered to currentTime
        │       ├── ScatterplotLayer ← current player dots
        │       ├── ScatterplotLayer ← kill/death/loot/storm markers
        │       └── BitmapLayer      ← heatmap texture (if mode selected)
        │
        └── MapView.jsx → DeckGL canvas over minimap <img>
```

---

## Path Animation in the Browser

Player movement paths are not static lines — they are calculated as you watch.

- **Filtering:** For every player in a match, the app filters events where the time is less than or equal to the current playback time (`t <= currentTime`).
- **Growth:** As the timeline scrubber moves forward, more events pass the filter and the path grows on the map.
- **Zero-Math Rendering:** Because the Python pipeline already handled coordinate mapping, the browser does no complex math while scrubbing — it just filters and draws.

---

## Coordinate Mapping

The game world uses 3D coordinates (`x`, `y`, `z`), but the minimaps are 2D images (1024×1024 pixels). To align them, the conversion follows the logic provided in the README file.

### The Y-Axis Flip

In a game world, the vertical coordinate (`z`) increases as you move "up" the map. However, in digital images and browsers, pixel `0` is at the top. Without correction, players would appear to move upside down.

The fix is: `pixel_y = (1 - v) * 1024`. Subtracting the position from `1` flips the map so that "up" in-game matches "up" on screen.

---

## Important Data Assumptions & Fixes

### 1. Timestamp Correction

The README stated that timestamps (`ts`) were stored as milliseconds. However, treating them as milliseconds resulted in a Unix epoch date of January 21, 1970 — not February 2026 when the data was collected.

**The issue:** The raw integer values are Unix seconds, but the Parquet schema incorrectly labels the column as `timestamp[ms]`. PyArrow faithfully reads them as milliseconds, landing 20 days after the epoch instead of 56 years.

**The fix:** Cast the column to `int64` via PyArrow before pandas interprets it, then treat those integers as seconds. Once corrected, match durations became realistic (avg ~6.8 minutes).

### 2. Map Constants

The Scale and Origin constants provided in the README for AmbroseValley, GrandRift, and Lockdown were used directly to ensure accuracy of player dot placement.

---

## Key Trade-offs

| Decision | Why |
|---|---|
| Pre-calculated heatmaps | Calculating heatmaps in the browser for thousands of points is slow. Pre-computing the 32×32 grid in Python makes it appear instantly when toggled. |
| 32×32 grid resolution | Large enough to show hot zones clearly, small enough to keep the file size tiny (19 KB) so it loads immediately. |
| Short event codes | Converting event names like `"Position"` or `"Loot"` to single letters (`"P"`, `"L"`) saved over 600 KB across match files, improving load times on slow connections. |
