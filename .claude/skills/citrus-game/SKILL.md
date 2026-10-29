---
name: citrus-game
description: Build or extend the Jeju tangerine (감귤) Mario-style platformer in citrus.html — levels, enemies, power-ups, boss, WebAudio sfx/music, Korean voice. Use when asked to add stages, enemies, items, sounds, voice lines, or tweak physics in this game.
---

# 제주 감귤 대모험 (citrus.html)

Single-file canvas platformer (960x544, 32px tiles, 17 rows, fixed 60fps step). No assets or libraries: all art is drawn procedurally, all audio is WebAudio + `speechSynthesis`. Linked from `index.html` ("🎮 감귤 게임").

## Concept
- Hero 귤이 (tangerine with leaf). Small → 한라봉 (big, `?` block gives it) → 감귤꽃 (fire: shoots seeds). Star = invincible, 1UP = green 청귤.
- Stages: 1-1 제주 해안 (day), 1-2 한라산 자락 (dusk, moving lifts, urchins), 1-3 성산 일출봉 (boss 대왕 돌하르방, 6 HP; stomp = 2, seed = 1; rocks fall on landing).
- Enemies: `bug` 청귤벌레 (stompable), `urchin` 성게 (hurts if stomped, `stomp:false`), `bird` 갈매기 (flies, `fly:true`).
- Controls: ←→/AD move, Space/↑/W/K jump (double jump, `p.dbl`), Shift/X/Z/J run + shoot, P pause, M music, V voice, Enter start. Touch buttons on coarse pointers.

## Code map (search these names)
- Audio: `initAudio`, `tone`, `noise`, `sfx(name)` switch, `SONGS[]` (8th-note MIDI arrays, 0 = rest; `playMusic(i)`), `say(text,{key,cd,who,pitch,rate})` = voice + speech bubble with cooldown.
- Levels: builders `L1/L2/L3` using helpers `gr` (ground, optional top row), `put`, `row`, `pipe`, `stairs`, `coins`, `arc`, `en`, `lift`, `mkBoss`; `LEVELS=[L1,L2,L3]`. Tiles: 0 air, 1 ground, 2 brick, 3 coin block, 4 power block (`data` = 'star'|'1up'), 5 used, 6/7 pipe, 8 stone.
- Physics: `moveX/moveY` (tile AABB), `updPlayer` (coyote 7f, jump buffer 7f, variable jump height, lift carry), `updEnemy`, `updBoss`, `updItem`, `updFire`.
- Render: `drawBG` (THEMES[] per stage: sky, Hallasan, hills, trees, 돌하르방), `drawTile`, `drawHero`, `drawEnemy`, `drawItem`, `drawFlag`, `drawBoss`, `drawHUD`.
- State machine: `title → intro → play → clear → (next level | win)`, `over`. Debug hook: `window.__dbg` (`s`, `loadLevel`, `startGame`, `winGame`).

## Recipes
- **New stage**: write `L4()`, push to `LEVELS`, add a `THEMES` entry (and `music` index into `SONGS`). Keep gaps ≤ 5 tiles, pipes ≤ 3 tall, blocks at row 11, stone platforms at row 12 (base jump ≈ 3.9 tiles, running ≈ 4.8).
- **New enemy**: add to `ENEMY`, a `drawEnemy` branch, and include its name in the `case 'bug': case 'urchin': case 'bird':` list in `update`.
- **New sfx/voice**: add a `case` in `sfx()`; call `say('대사',{cd:ms})` — always give frequent lines a cooldown.
- **Tuning**: jump `-(11.8+|vx|*.28)`, double jump `-10.5`, gravity `.55` (`1.2` when jump released), walk 2.8 / run 4.4 px/frame.

## Testing (no test framework)
Open the file in the browser pane and drive it via `window.__dbg` and dispatched `KeyboardEvent`s: teleport `P.x`/`cam.x` near the flag (`lv.flagX*32`) to check clear → next level, near the boss (`cam.x≈900`) to check the boss → win path, and watch the console for errors. Wait for `state==='play'` after `loadLevel` (the intro card lasts ~130 frames; the pane throttles rAF). Voice/music can't be verified headlessly — say so rather than claiming it works.

## Conventions
- Keep everything in one HTML file; match the existing terse style and Korean UI strings.
- Don't commit unless asked.
