# Development Sequence and Acceptance Gates

The stack is **approved and installed: Three.js + React + TypeScript, with Blender used only when needed**. The current runtime is the primitive Gate 1 graybox described in the [README](../../README.md). Test results belong to executed checks; this plan describes the durable acceptance gates.

## Gate 0 — Freeze the first executable slice

The framework decision and first graybox contracts are complete. Portrait resolutions, a Floor route/arena template, input commands, typed GameState and save snapshot are in the current implementation. Minimum browser/GPU performance and production page-flow approval remain open.

**Evidence:** implemented interfaces in `src/game/`, the responsive graybox HUD, pinned packages and actual browser smoke evidence. The production UI design review remains a separate gate for expanded flows.

## Gate 1 — Runnable primitive graybox

The current runnable application is this slice: one continuous floating-landmass test Floor with an authored route, four arenas × five registered goal enemies, deterministic auto-navigation/targeting/basic attacks, three representative active skills, ordinary Floor transition, explicit every-third-Floor BATTLE, pause, and a version-2 IndexedDB snapshot with version-1 migration. It uses original procedural placeholder meshes; no joystick or manual attack button.

**Acceptance:** `npm test` covers template shape, stable target ordering, registered/one-time death credit, 20-kill clear/advance, Boss Ready/BATTLE and cooldown rejection. Browser runs and screenshot captures verify actual portrait rendering, Boss start, pause/resume and reload restore at 390×844, 540×960 and 720×1280. Do not mistake the graybox for art approval or production UI approval.

## Gate 2 — Complete reliable gameplay loop

Add all six base skills in three slots, cooldown switching, three gear slots, random eligible chests, Boss loss/retry, Coins/upgrade, offline no-Boss, reliable IndexedDB saves and current-run Floor-20 Ascension. Stage runestones and tuning with explicit reference evidence; avoid invented gameplay.

**Acceptance:** unit/integration and browser restart tests; corrupted/future schema refusal, duplicate rewards, failed writes, offline clock rollback, stale event epochs, death and pause; at least one genuine complete Floor/Boss/reward replay. Separate behavioral parity from numeric calibration.

## Gate 3 — Representative production 3D assets

**Start actual modeling only after Gate 1** validates camera, actor scale, authored path, animation contact and replacement contracts. Integrate one original/licensed Hero, one ordinary enemy, an island section and key clips using GLB. Blender is optional for shape/rig/export processing.

**Acceptance:** known rights/provenance, valid import/orientation, rig/attachment names, in-scene movement and attack synchronization, navigable collision unchanged, measured frame time/memory and readability in the real portrait scene. Do not preproduce every character, item, skill icon or map before this batch passes.

## Gate 4 — Approved UI and combat feedback

With reviewed original designs for each page, build battle HUD, Skills, Gear, Boss Ready/fight/chest, Pause/Settings and Ascension confirmation. Integrate VFX, hit/death feedback, icons and audio in small verified batches.

**Acceptance:** touch/pointer/keyboard, modal focus, action accessibility when scrolling, first-open and resize behavior, safe areas and long translated labels; rendered portrait captures at 540×960, 720×1280 and narrow/tall ratios. No UI effect may grant combat credit.

## Gate 5 — Content, balance and release quality

Calibrate public 2016 observable behavior and bounded Floors 1–1000, mark hidden coefficients provisional. Expand authored Floor templates and licensed content only after one integrated slice meets performance and crash-recovery goals. Additional game systems or mobile packaging require explicit scope.

**Acceptance:** real browser regression, deterministic deep-Floor simulations, saved progress/loot consistency, new/old tab isolation, WebGL/context-loss recovery, loading/memory/FPS metrics on agreed target hardware and auditable asset rights.

## Evidence standard

Documentation and mockups are not implemented code; a green static check is not gameplay acceptance. Maintain scoped automated scripts for core rules and data validation, and browser evidence for rendered gameplay. Run only appropriate tests for each change, recording exact results. The current test command is `npm test`; the production build command is `npm run build`.
