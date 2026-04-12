# Architecture

## What We Built and Why

### React + Vite
Standard SPA setup. Vite gives fast HMR during development and an optimized production bundle. React provides a component model that cleanly separates the sidebar filters, map canvas, and timeline — three areas of the UI that share state but need to update independently.

### Deck.gl (OrthographicView)
Deck.gl is a WebGL-based visualization library purpose-built for rendering spatial data layers. The specific reasons it fits this use case:

- **`PathLayer`** — renders player movement trails as polylines natively
- **`ScatterplotLayer`** — renders event markers (kills, deaths, loot) as positioned dots
- **`BitmapLayer`** — renders a pre-rasterized canvas texture as a full-map overlay (used for heatmaps)
- **`OrthographicView`** — renders in pixel-space (0–1024) rather than geographic lat/lng, which is exactly what game coordinates map to after the world→pixel transform

The alternative (plain HTML5 Canvas) would require manually implementing kernel density estimation for heatmaps, hit-testing for tooltips, and re-rendering logic — all of which Deck.gl provides. The GPU rendering also handles our 89K-point dataset with zero performance concern.

### Zustand
Cross-component state (selected match, current playback time, layer toggles) is shared between the sidebar, map canvas, and timeline bar — three non-adjacent components. Zustand provides global state without Redux boilerplate. The store has direct action functions that keep dispatch logic out of components.

### Static JSON + Vercel
The dataset is read-only (fixed 5-day window). There is no reason to run a server. Pre-processing the parquet files to JSON once means:
- Zero backend infrastructure
- Instant Vercel deploy from GitHub
- CDN-cached match files load in <100ms after first access
- No cold starts, no server costs

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
        │       ├── PathLayer       ← position events, filtered to currentTime
        │       ├── ScatterplotLayer ← current player dots
        │       ├── ScatterplotLayer ← kill/death/loot/storm markers
        │       └── BitmapLayer     ← heatmap texture (if mode selected)
        │
        └── MapView.jsx → DeckGL canvas over minimap <img>
```

---

## Coordinate Mapping

The minimap images are 1024×1024 pixels. Each map has a known world-space origin and scale defined in the README:

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | −370 | −473 |
| GrandRift | 581 | −290 | −290 |
| Lockdown | 1000 | −500 | −500 |

The conversion is a two-step linear transform:

```
Step 1: World → UV (normalized 0–1)
  u = (x − origin_x) / scale
  v = (z − origin_z) / scale

Step 2: UV → Pixel (1024×1024 image)
  pixel_x = u × 1024
  pixel_y = (1 − v) × 1024    ← Y-axis is flipped (image origin = top-left)
```

The `y` column in the data is **elevation** (height in the 3D world) and is discarded — this is a 2D top-down visualization.

**Pre-computation decision:** Pixel coordinates are computed once in `pipeline/process_data.py` rather than at render time in the browser. This eliminates per-frame JS computation and reduces per-event JSON size by removing the raw `x`, `y`, `z` floats (3 × 4 bytes each) and replacing them with two integer pixel values.

**DeckGL coordinate system:** `OrthographicView` with `coordinateSystem: CARTESIAN` renders data in the same [0–1024] pixel space as the minimap image. The canvas is overlaid on the image using CSS `position: absolute`, so pixel coordinates map directly to image pixels at the default zoom level.

---

## JSON Schema Design Decisions

**Why per-match files (796 × ~4KB) rather than one file:**  
A single file containing all 89K events would be ~4–5MB and would need to be fully parsed before anything renders. With per-match files, the app loads immediately with the index (163KB) and fetches only the selected match on demand. A user never needs more than one match simultaneously.

**Why short event codes (`P`, `BK`, `BD`…):**  
Each event in JSON contains a code field. Storing `"BotKilled"` (9 chars) vs `"BD"` (2 chars) across ~90K events saves ~630KB of JSON. The mapping table lives in `src/constants/maps.js`.

**Why pre-aggregate heatmaps:**  
Aggregating 89K position events into a 32×32 grid in the browser on every render would be expensive and redundant — the underlying dataset never changes. Pre-aggregation in the pipeline produces a 19KB file that loads once. The 32×32 resolution renders as 32×32 pixel cells on a 1024px canvas, which is visually sufficient to identify hot and cold zones.

---

## Assumptions

1. **`ts` encoding:** The `ts` column is stored as `datetime64[ms]` in parquet, which pandas represents as int64 milliseconds since Unix epoch. The values cluster around `1970-01-21` — this is not meaningful wall-clock time but rather the game engine's internal match clock stored as epoch-ms. We normalize by subtracting the per-match minimum `ts`, giving `t_rel = 0` at the first event of each match.

2. **Bot detection by `user_id`, not event type:** The README documents that UUIDs are humans and numeric IDs are bots. However, 751 bot rows contain `Position` or `Loot` event types (typically human-only events). Detection is therefore always done by parsing `user_id` — if `int(user_id)` succeeds, it's a bot — never by event type.

3. **`y` column (elevation) discarded:** The tool is 2D only. The `y` column represents height in the 3D world and has no bearing on minimap position.

4. **February 14 partial day:** Included without special treatment. The lower volume (79 files vs. 437 on Feb 10) is handled naturally by the date filter.

5. **`match_id` suffix:** All `match_id` values in the parquet data include a `.nakama-0` suffix (the game server instance identifier). This suffix is stripped when generating filenames: `match_id.replace('.nakama-0', '')`.

6. **16 bot-only matches:** 16 matches have no human player files. These are included in the index and can be selected, but will show only bot movement paths.

---

## Trade-offs

| Decision | Chosen | Alternative | Reason |
|----------|--------|-------------|--------|
| Heatmap rendering | BitmapLayer (pre-rasterized canvas) | ScreenGridLayer | `BitmapLayer` gives full control over color mapping and opacity; `ScreenGridLayer` re-bins at render time (redundant for pre-aggregated data) |
| Coordinate computation | Pre-computed in Python | Runtime in browser | Eliminates per-frame JS math; reduces JSON payload |
| Data format | Per-match JSON files | Single monolithic JSON | On-demand loading; user never needs all 796 matches at once |
| State management | Zustand | useState + prop drilling | Sidebar, map, and timeline are non-adjacent; prop drilling would be unwieldy |
| Hosting | Vercel static | Railway (Python server) | No backend needed; zero ops; CDN delivery |
| Heatmap grid resolution | 32×32 | 64×64 or higher | 32×32 cells = 32px per cell at 1024px canvas — visually clear; doubling adds 4× data with marginal benefit |
| Deck.gl vs plain Canvas | Deck.gl | Canvas API | GPU rendering, built-in layers for paths/scatter, tooltip/interaction support out of the box |
