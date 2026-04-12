# Insights

Three findings from the LILA BLACK telemetry data, surfaced using the visualization tool.

---

## Insight 1: LILA BLACK is a PvE Game in Practice — Human vs. Human Combat is Near-Zero

### What caught my eye

The kill/death heatmap on all three maps is almost entirely driven by `BotKill` and `BotKilled` events. Switching the event filter to show only human-vs-human markers (`Kill`/`Killed`) leaves the map nearly empty — a stark visual contrast to the dense bot combat clusters.

### The evidence

Across all 796 matches and 5 days of data (89,104 events total):

| Event | Count |
|-------|-------|
| Human kills bot (`BotKill`) | 2,415 |
| Bot kills human (`BotKilled`) | 700 |
| **Human kills human (`Kill`)** | **3** |
| **Human killed by human (`Killed`)** | **3** |

3 human-vs-human fights in 796 matches. That's a 0.38% match PvP rate. On the path visualization, human player trails rarely cross — players are moving through the same map but are not intercepting each other.

### Is this actionable?

**Yes — directly.** If PvP is a design intent for LILA BLACK (the README describes it as an "extraction shooter," a genre where PvP is typically central), this data signals a systemic suppression of player encounters.

**Metrics affected:**
- PvP encounter rate (currently ~0.4%)
- Match engagement time (PvP extends matches; PvE-only matches end when bots are cleared or storm hits)
- Player retention (extraction shooters derive replayability from unpredictable human encounters)

**Actionable items:**
1. Review extraction zone placement — if players can extract without crossing each other's paths, they will. The path visualization shows human trails routing around each other rather than through shared corridors. Add forced-traversal chokepoints near high-loot and extraction areas.
2. Reduce bot density or bot aggression — if bots are engaging players continuously, humans are always occupied with PvE and never scan for human threats. The 3.45 human K/D vs bots suggests players are winning bot fights easily; the presence of bots may not be the suppressor. The routing design is the more likely cause.
3. Test a match mode with fewer bots and smaller map zones to force human proximity.

### Why a level designer should care

Map design is the primary lever for controlling player encounter rates. This data proves that the current three maps are not generating human encounters at scale. A level designer can use the path visualization to find the "miss corridors" — paths humans take that run parallel but never intersect — and redesign them to converge.

---

## Insight 2: Lockdown is Measurably Harder — and Players May Be Avoiding It

### What caught my eye

The death heatmap on Lockdown is denser relative to map area than the other two maps. The kill/death ratio tooltip on Lockdown matches shows more frequent `BotKilled` events per human player than AmbroseValley or GrandRift matches of similar duration.

### The evidence

Human K/D ratio (BotKill ÷ BotKilled) by map across all 5 days:

| Map | Bot Kills | Bot Deaths | K/D |
|-----|-----------|------------|-----|
| GrandRift | 192 | 46 | **4.17** |
| AmbroseValley | 1,797 | 486 | **3.70** |
| **Lockdown** | **426** | **168** | **2.54** |

Lockdown players die to bots **46% more often** relative to kills than GrandRift players. This is not a sample size artifact — Lockdown has 171 matches vs. GrandRift's 59, so the Lockdown sample is larger.

Play volume also correlates with difficulty:

| Map | Matches | % of total |
|-----|---------|-----------|
| AmbroseValley | 566 | 71.1% |
| Lockdown | 171 | 21.5% |
| GrandRift | 59 | 7.4% |

Players may be self-selecting away from Lockdown's difficulty, compressing into AmbroseValley.

### Is this actionable?

**Yes.** The death heatmap on Lockdown in the tool immediately shows which cells concentrate deaths. These are tuning targets.

**Metrics affected:**
- Map play distribution (currently AmbroseValley-heavy)
- Player death rate on Lockdown (56.6% average across maps; Lockdown is above this)
- Session length on Lockdown (more deaths = shorter matches = less engagement time per session)

**Actionable items:**
1. Open the death heatmap on Lockdown in the tool. Identify the top 3 death-concentration cells. Cross-reference with the map image — are they forced-traversal corridors with no cover? If yes, add cover assets or alternative routes.
2. Check whether the high-death cells also have high traffic (overlay traffic heatmap). If players must pass through a death zone, they have no choice — a design fix is needed. If the death zone is off the main path, players are being drawn there by loot and dying — consider moving loot or adding escape routes.
3. Run A/B test: reduce bot density by 20% in Lockdown for one week and measure whether K/D and play share recover.

### Why a level designer should care

A K/D of 2.54 vs. 4.17 is a 64% difficulty delta between maps in the same game. Players experience Lockdown as significantly harder even if they can't articulate why. The tool makes the specific death locations visible — designers don't have to guess which part of Lockdown is the problem.

---

## Insight 3: Dead Zones — Large Map Areas Are Never Visited Across 5 Days

### What caught my eye

Switching the heatmap to "traffic" mode and looking at all three maps immediately reveals large cold regions — areas with visibly zero path density even across 796 matches. This is not edge-of-map boundary behavior; some dead zones are interior quadrants.

### The evidence

Using a 5×5 grid analysis (each cell = 20% of map width/height):

| Map | Empty cells (0 traffic) | Low-traffic cells (<10% of avg) |
|-----|------------------------|----------------------------------|
| AmbroseValley | 6 / 25 (24%) | 9 / 25 (36%) |
| GrandRift | 9 / 25 (36%) | 11 / 25 (44%) |
| Lockdown | 9 / 25 (36%) | 11 / 25 (44%) |

On GrandRift and Lockdown, **over a third of the playable area** has zero recorded events across the entire 5-day dataset.

Three additional data points reinforce this:
1. **Traffic, kills, and loot hotspots cluster in the same cells.** Players go where loot is; they fight where players are; they die where fights happen. The dead zones have no loot hotspots — the absence of loot anchors absence of players.
2. **Storm deaths are scattered randomly** across maps (39 total, visually spread). The storm is not funneling players through dead zones — it's not activating underused areas.
3. **No matches on GrandRift show any events in the northwest quadrant** of the map across all 59 GrandRift matches.

### Is this actionable?

**Yes — high leverage.** Dead zones represent sunk cost in level design: geometry, textures, lighting, and bot spawns that generate zero player engagement.

**Metrics affected:**
- Map utilization rate (currently <65% of area used on GrandRift/Lockdown)
- Match variety (players running the same routes every match reduces replay value)
- Asset ROI (dead zones are built assets with zero return)

**Actionable items:**
1. **Relocate loot spawns into dead zones.** Since traffic follows loot, moving one or two high-value loot clusters into currently empty cells will pull player paths into those areas. Use the tool to identify the dead cell closest to an existing traffic corridor — that's the lowest-friction loot relocation target.
2. **Adjust storm direction/origin** on GrandRift and Lockdown to pass through dead zones. Currently the storm does not force players through underused areas. Redirecting it would activate dead zones while maintaining storm pressure as a design mechanic.
3. **Add extraction points in dead zones.** Extraction is the primary player objective. An extraction point in a currently empty area gives players a reason to traverse it — and creates new encounter opportunities.
4. **Consider reducing map size on GrandRift.** 36% empty cells on a map that accounts for only 7.4% of all play suggests GrandRift may simply be too large for its player count. Shrinking the playable zone would concentrate traffic and reduce bot-encounter dead time.

### Why a level designer should care

Level design hours spent on areas that 100% of players avoid for 5 consecutive days are hours that could be spent improving the areas players actually use. The traffic heatmap in the tool makes this visible in seconds — no data engineering required.
