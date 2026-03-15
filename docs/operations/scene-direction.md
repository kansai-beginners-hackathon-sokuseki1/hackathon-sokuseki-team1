# Scene Direction Rules

## Purpose

Stage scenes are built from three independent layers:

- `StageBackdrop`: sky, hills, ground, weather
- `StageProps`: buildings, landmarks, traces of civilization
- `StageCharacters`: hero, NPCs, enemies

## Core Rules

1. Each stage has one visual focus.
2. Dense buildings appear only in living-area stages.
3. Exploration stages favor terrain, ruins, gates, or landmarks over active buildings.
4. The hero is always the anchor character in the foreground.
5. Additional characters are added only when they strengthen the stage fantasy.
6. Foreground density must stay low enough to avoid competing with the task UI.

## Stage Mapping

- `beginning-village`: settlement focus, full village props, hero + guide
- `grassland-road`: road focus, no buildings, hero only
- `forest-maze`: forest focus, no buildings, hero + spirit
- `desert-town`: trade-town focus, light buildings, hero + merchant
- `seaside-port`: harbor focus, port props, hero + dock worker
- `snow-fortress`: fortress focus, defensive props, hero + guard
- `ancient-ruins`: ruins focus, no active buildings, hero only
- `magic-city`: arcane-city focus, magical structures, hero + mage
- `demon-lord-castle`: boss-castle focus, castle silhouette, hero + boss

## Implementation Note

The source of truth for stage composition lives in `src/GameScene.jsx` under `STAGE_DEFINITIONS[].scene`.

Structure-specific rendering components live in `src/StageStructures.jsx`.
