"""
LILA BLACK — Data Pipeline
Converts 1,243 parquet files → static JSON for the frontend.

Outputs:
  public/data/index.json              — match manifest (all 796 matches)
  public/data/heatmaps.json           — pre-aggregated 32x32 grids per map
  public/data/match/{match_id}.json   — per-match event stream (796 files)
  public/minimaps/                    — minimap images copied from player_data/

Run from lila-assignment/:
  py pipeline/process_data.py
"""

import os
import sys
import shutil
from pathlib import Path

import pyarrow.parquet as pq
import pyarrow as pa
import pandas as pd
import orjson

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "player_data"
OUT_DIR  = BASE_DIR / "public" / "data"
OUT_MATCH_DIR = OUT_DIR / "match"
MINIMAP_SRC = DATA_DIR / "minimaps"
MINIMAP_DST = BASE_DIR / "public" / "minimaps"

DAYS = ["February_10", "February_11", "February_12", "February_13", "February_14"]

# ---------------------------------------------------------------------------
# Map configs (from README)
# ---------------------------------------------------------------------------
MAP_CONFIG = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370.0, "origin_z": -473.0},
    "GrandRift":     {"scale": 581,  "origin_x": -290.0, "origin_z": -290.0},
    "Lockdown":      {"scale": 1000, "origin_x": -500.0, "origin_z": -500.0},
}

# ---------------------------------------------------------------------------
# Event code mapping (full name → short code)
# ---------------------------------------------------------------------------
EVENT_CODE = {
    "Position":     "P",
    "BotPosition":  "BP",
    "Kill":         "K",
    "Killed":       "D",
    "BotKill":      "BK",
    "BotKilled":    "BD",
    "KilledByStorm":"S",
    "Loot":         "L",
}

# ---------------------------------------------------------------------------
# Player color palette (12 distinct colors for humans)
# ---------------------------------------------------------------------------
HUMAN_COLORS = [
    [255, 200,  50],  # yellow
    [80,  200, 255],  # cyan
    [255, 100,  80],  # red-orange
    [100, 255, 150],  # green
    [200,  80, 255],  # purple
    [255, 160,  30],  # orange
    [80,  255, 220],  # teal
    [255,  80, 180],  # pink
    [150, 200, 255],  # light blue
    [255, 255, 100],  # bright yellow
    [180, 255,  80],  # lime
    [255, 130, 130],  # salmon
]
BOT_COLOR = [140, 140, 140]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_human(user_id: str) -> bool:
    """UUID = human, numeric string = bot."""
    try:
        int(user_id)
        return False
    except (ValueError, TypeError):
        return True


def world_to_pixel(x: float, z: float, map_id: str) -> tuple[int, int]:
    """Convert world (x, z) to minimap pixel (px, py) on a 1024x1024 image."""
    cfg = MAP_CONFIG[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    px = int(round(u * 1024))
    py = int(round((1.0 - v) * 1024))
    px = max(0, min(1024, px))
    py = max(0, min(1024, py))
    return px, py


def load_all_files() -> pd.DataFrame:
    """Load all parquet files across all days into a single DataFrame."""
    frames = []
    total = 0
    for day in DAYS:
        day_dir = DATA_DIR / day
        if not day_dir.exists():
            print(f"  Warning: {day_dir} not found, skipping")
            continue
        files = list(day_dir.iterdir())
        print(f"  {day}: {len(files)} files")
        for fpath in files:
            try:
                table = pq.read_table(str(fpath))
                # ts is typed as timestamp[ms] in the schema but raw integers are
                # Unix seconds. Cast via PyArrow before pandas interprets them.
                raw_ts_s = table.column("ts").cast(pa.int64()).to_pylist()
                df = table.to_pandas()
                df["ts_unix_s"] = raw_ts_s  # true Unix seconds
                # Decode event bytes → str
                df["event"] = df["event"].apply(
                    lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x)
                )
                df["day"] = day
                frames.append(df)
                total += 1
            except Exception as e:
                print(f"    ERROR reading {fpath.name}: {e}")
    print(f"  Loaded {total} files total")
    return pd.concat(frames, ignore_index=True)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def main():
    print("=== LILA BLACK Data Pipeline ===\n")

    # Create output dirs
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_MATCH_DIR.mkdir(parents=True, exist_ok=True)
    MINIMAP_DST.mkdir(parents=True, exist_ok=True)

    # Copy minimap images
    print("1. Copying minimap images...")
    for img in MINIMAP_SRC.iterdir():
        shutil.copy2(img, MINIMAP_DST / img.name)
        print(f"   Copied {img.name}")

    # Load all data
    print("\n2. Loading parquet files...")
    df = load_all_files()
    print(f"   Total rows: {len(df):,}")

    # Add derived columns
    df["is_human"] = df["user_id"].apply(is_human)

    # Strip .nakama-0 suffix from match_id for use as filenames
    df["match_id_clean"] = df["match_id"].str.replace(r"\.nakama-0$", "", regex=True)

    # ---------------------------------------------------------------------------
    # 3. Timestamp normalization per match
    # ---------------------------------------------------------------------------
    print("\n3. Normalizing timestamps...")
    # ts_unix_s holds true Unix seconds (cast via PyArrow before pandas parsed them).
    # Convert to milliseconds so t_rel has ms precision for the frontend.
    df["ts_ms"] = df["ts_unix_s"] * 1000
    match_ts_min = df.groupby("match_id_clean")["ts_ms"].transform("min")
    df["t_rel"] = (df["ts_ms"] - match_ts_min).astype(int)

    # ---------------------------------------------------------------------------
    # 4. Pre-compute pixel coordinates
    # ---------------------------------------------------------------------------
    print("4. Pre-computing pixel coordinates...")
    px_list, py_list = [], []
    for _, row in df.iterrows():
        px, py = world_to_pixel(row["x"], row["z"], row["map_id"])
        px_list.append(px)
        py_list.append(py)
    df["px"] = px_list
    df["py"] = py_list

    # ---------------------------------------------------------------------------
    # 5. Build heatmaps (32x32 grid per map, 3 categories)
    # ---------------------------------------------------------------------------
    print("5. Building heatmaps...")
    GRID_SIZE = 32
    heatmaps = {}

    TRAFFIC_EVENTS = {"Position", "BotPosition"}
    KILL_EVENTS    = {"Kill", "BotKill"}
    DEATH_EVENTS   = {"Killed", "BotKilled", "KilledByStorm"}

    for map_id in MAP_CONFIG:
        mdf = df[df["map_id"] == map_id].copy()
        grids = {}
        for label, event_set in [("traffic", TRAFFIC_EVENTS), ("kills", KILL_EVENTS), ("deaths", DEATH_EVENTS)]:
            subset = mdf[mdf["event"].isin(event_set)]
            grid = [0] * (GRID_SIZE * GRID_SIZE)
            for _, row in subset.iterrows():
                col = min(int(row["px"] / 1024 * GRID_SIZE), GRID_SIZE - 1)
                row_idx = min(int(row["py"] / 1024 * GRID_SIZE), GRID_SIZE - 1)
                grid[row_idx * GRID_SIZE + col] += 1
            grids[label] = grid
        heatmaps[map_id] = grids
        print(f"   {map_id}: traffic_max={max(grids['traffic'])}, kills_max={max(grids['kills'])}, deaths_max={max(grids['deaths'])}")

    heatmaps_path = OUT_DIR / "heatmaps.json"
    with open(heatmaps_path, "wb") as f:
        f.write(orjson.dumps(heatmaps))
    print(f"   Wrote {heatmaps_path}")

    # ---------------------------------------------------------------------------
    # 6. Build per-match JSON files
    # ---------------------------------------------------------------------------
    print("\n6. Building per-match JSON files...")
    match_summaries = []
    match_ids = df["match_id_clean"].unique()
    print(f"   Processing {len(match_ids)} matches...")

    for i, match_id in enumerate(match_ids):
        mdf = df[df["match_id_clean"] == match_id]

        map_id = mdf["map_id"].iloc[0]
        day    = mdf["day"].iloc[0]
        duration_ms = int(mdf["t_rel"].max())

        # Group by player
        players = []
        human_idx = 0
        player_ids = mdf["user_id"].unique()

        for uid in player_ids:
            pdf = mdf[mdf["user_id"] == uid].sort_values("t_rel")
            human = is_human(uid)
            color = HUMAN_COLORS[human_idx % len(HUMAN_COLORS)] if human else BOT_COLOR
            if human:
                human_idx += 1

            events = []
            for _, row in pdf.iterrows():
                code = EVENT_CODE.get(row["event"], row["event"])
                events.append({
                    "t":  int(row["t_rel"]),
                    "e":  code,
                    "px": int(row["px"]),
                    "py": int(row["py"]),
                })

            players.append({
                "user_id":     uid,
                "player_type": "human" if human else "bot",
                "color":       color,
                "events":      events,
            })

        # Count events for summary
        all_events = mdf["event"]
        kill_count        = int((all_events.isin(["Kill", "BotKill"])).sum())
        death_count       = int((all_events.isin(["Killed", "BotKilled"])).sum())
        loot_count        = int((all_events == "Loot").sum())
        storm_death_count = int((all_events == "KilledByStorm").sum())
        human_count       = int(mdf[mdf["is_human"]]["user_id"].nunique())
        bot_count         = int(mdf[~mdf["is_human"]]["user_id"].nunique())

        match_doc = {
            "match_id":   match_id,
            "map":        map_id,
            "date":       day,
            "duration_ms": duration_ms,
            "human_count": human_count,
            "bot_count":   bot_count,
            "players":    players,
        }

        out_path = OUT_MATCH_DIR / f"{match_id}.json"
        with open(out_path, "wb") as f:
            f.write(orjson.dumps(match_doc))

        match_summaries.append({
            "match_id":         match_id,
            "map":              map_id,
            "date":             day,
            "duration_ms":      duration_ms,
            "human_count":      human_count,
            "bot_count":        bot_count,
            "kill_count":       kill_count,
            "death_count":      death_count,
            "loot_count":       loot_count,
            "storm_death_count": storm_death_count,
        })

        if (i + 1) % 100 == 0:
            print(f"   {i+1}/{len(match_ids)} matches done...")

    print(f"   Wrote {len(match_ids)} match files to {OUT_MATCH_DIR}")

    # ---------------------------------------------------------------------------
    # 7. Build index.json
    # ---------------------------------------------------------------------------
    print("\n7. Building index.json...")
    index_doc = {
        "maps":    list(MAP_CONFIG.keys()),
        "dates":   DAYS,
        "matches": match_summaries,
    }
    index_path = OUT_DIR / "index.json"
    with open(index_path, "wb") as f:
        f.write(orjson.dumps(index_doc))
    print(f"   Wrote {index_path} ({len(match_summaries)} matches)")

    # ---------------------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------------------
    print("\n=== Pipeline complete ===")
    match_files = list(OUT_MATCH_DIR.glob("*.json"))
    print(f"  Match files:  {len(match_files)}")
    print(f"  index.json:   {index_path.stat().st_size / 1024:.1f} KB")
    print(f"  heatmaps.json: {heatmaps_path.stat().st_size / 1024:.1f} KB")
    total_match_size = sum(f.stat().st_size for f in match_files)
    print(f"  Total match data: {total_match_size / 1024 / 1024:.2f} MB")
    print(f"  Minimaps: {list(MINIMAP_DST.iterdir())}")


if __name__ == "__main__":
    main()
