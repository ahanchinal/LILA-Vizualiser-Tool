# Data Analysis & Game Design Insights: LILA BLACK Telemetry

This document outlines key findings derived from a 5-day sample of production telemetry data (February 10–14, 2026), consisting of 89,104 event rows across 796 unique matches.

---

## Dataset Summary

| Metric | Value |
|---|---|
| Total Events Processed | 89,104 |
| Unique Matches | 796 |
| Human vs. Bot Kills | 2,415 (Human kills Bot) vs. 3 (Human kills Human) |
| Map Popularity | AmbroseValley (71.1%), Lockdown (21.5%), GrandRift (7.4%) |
| Average K/D (Human vs. Bot) | 3.44 across all maps |

---

## Insight 1: Minimal Human-on-Human Combat

Analysis of the 796 matches reveals that LILA BLACK currently functions primarily as a PvE (Player vs. Environment) experience, despite its extraction shooter framework.

**The Evidence:** Out of approximately 800 matches, only 3 human-vs-human kills were recorded (although the playerIDs are the same which is a curious fact). In contrast, human players eliminated 2,415 bots during the same period — a PvP encounter rate of less than 0.4% per match.

**Data Pattern:** Visualizing player journeys shows that human paths rarely intersect. Players appear to be moving through parallel corridors that do not force proximity or engagement.

**Actionable Lever:** Level designers can increase encounter rates by centralizing high-value loot or converging extraction zones into shared chokepoints.

**Target Metrics:** PvP Encounter Rate; Match Tension/Engagement.

---

## Insight 2: Higher Player Death Rates on the Lockdown Map

There is a significant disparity in player performance and map selection across the three available maps.

**The Evidence:** The human-to-bot Kill/Death ratio on Lockdown is 2.54 — 38% lower than on GrandRift (4.11). Players are dying to AI significantly more often on this map.

**Data Pattern:** The lower performance correlates with lower map utilization. Lockdown accounts for only 21.5% of total matches, while AmbroseValley accounts for over 70%.

**Actionable Lever:** The death heatmap for Lockdown identifies 3–4 specific rooms with high death density. Reducing bot spawn counts in these areas or increasing available cover may encourage higher map adoption.

**Target Metrics:** Map Distribution %; Player Death Rate per Map.

---

## Insight 3: Large Unused Areas in GrandRift and Lockdown

A substantial portion of the built environment in GrandRift and Lockdown is receiving zero player traffic.

**The Evidence:** Using a 5×5 grid analysis, over 30% of the playable area on GrandRift and Lockdown recorded zero movement events across the 5-day window.

**Data Pattern:** Traffic heatmaps show that player movement is strictly tethered to loot hotspots. Areas without loot anchors remain dead zones. The current storm mechanic is not successfully funneling players into these underutilized quadrants.

**Actionable Lever:** Relocating high-tier loot into dead zones (such as the northwest quadrant of GrandRift) would force players to explore more of the map's geometry.

**Target Metrics:** Map Utilization Rate; Route Variety.

---

## Conclusion for Level Design

The data suggests that while the core PvE loop is active, the current map layouts and loot distributions prevent the extraction element from feeling competitive or unpredictable. Using the visualization tool, designers can identify exact coordinates where the player experience stalls and adjust map flow to maximize engagement.
