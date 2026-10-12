# Development Sequence and Acceptance Gates

The stack is **approved: Three.js + React + TypeScript, with Blender used only when needed**. The new repository currently contains specifications only. No game, CI, art or application test has been built. Real completion and test evidence belong to the relevant development work, not this enduring specification.

## Gate 0 — Freeze the first executable slice

The framework decision is complete. Define the initial browser support matrix, portrait test resolutions, game camera framing, one authored Floor route/arena plan, input commands and exact typed game/save contracts. Review the first UI flow and representative art direction. Choose and pin tool versions when the first scaffold is created.

**Evidence:** documented interfaces, owner-approved page/flow design and a coherent contract; no claim of gameplay implementation.

## Gate 1 — Runnable primitive graybox

Create the smallest complete Vite/TypeScript + Three.js scene with a React HUD. Programmatically draw one continuous floating-landmass test Floor with an authored route, four arenas × five goal enemies and a Boss space. Implement auto-navigation, auto-targeting/basic attacks, registered 20-goal counting, ordinary Floor transition and explicit every-third-Floor BATTLE. Show exactly three skill placeholders; no joystick.

**Acceptance:** pure unit tests for target/reachability, stable tie ordering, single-death credit, 20 kills and Boss Ready; real browser render and usable HUD at several portrait sizes. Do not mistake the graybox for art approval.

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

Documentation and mockups are not implemented code; a green static check is not gameplay acceptance. Once source exists, maintain scoped automated scripts for core rules, data validation, browser behavior and WebGL smoke tests. Run only appropriate tests for each change, recording exact results. No runtime suite can run from this initial documents-only repository.
