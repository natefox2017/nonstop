# Web Game Architecture — Approved Stack

This is the architecture for the **approved Three.js + React + strict TypeScript** browser implementation. The current code implements the Gate 1 graybox in `src/`; later systems in this document remain target architecture. Blender is optional and never required at runtime.

## Ownership and update model

```text
Browser input (pointer/touch/keyboard)
      -> typed command queue / input policy
      -> deterministic fixed-step GameCore (authoritative)
         Floor FSM -> encounter manager -> actors/skills -> reward/economy
             |                 |                  |
         catalog data       nav queries        save snapshots
      -> immutable view-model / event snapshots
             |                           |
      Three.js visual adapter        React HUD/modal adapter
      meshes/animations/VFX          no authoritative combat state
             |
      responsive viewport camera fitted to DOM-unobstructed battle rect
```

**Single authority rule:** GameCore is the only writer of combat state, objective credit, equipment/rewards, cooldowns and Floor progression. Neither animation mixer events, React effect hooks, physics callbacks nor UI timers may grant independent kills or items. Resolve one authoritative combat hit at a scheduled gameplay contact time; send the resulting event to presentation for FX/SFX. Animation may display hit anticipation without deciding damage.

The graybox runs a main-thread 30 Hz fixed-step loop with `requestAnimationFrame` rendering. It caps catch-up at five steps and does not simulate background time. Offline settlement from a persisted checkpoint remains a later implementation requirement.

## Current and planned source boundaries

| Location | Responsibility | Must not own |
| --- | --- | --- |
| `src/game/core.ts`, `floor.ts`, `types.ts`, `tuning.ts` | Current deterministic Floor loop, authored template, state/command types and provisional pacing | DOM, Three.js mesh or storage API |
| `src/game/store.ts`, `src/game/save.ts` | Current external-store adapter and IndexedDB version-1 whole-state snapshots | Combat and reward rules |
| `src/game/core.test.ts` | Current deterministic core tests | Live player state |
| `src/game/catalogs/` | Versioned skills, items, chests, tuning and stable IDs | Event listeners and UI translations |
| `src/game/maps/` | Future additional authored templates, route/arena geometry and path projection | Generated random terrain or artwork exports |
| `src/render/WorldRenderer.ts` | Current procedural Three.js scene, camera, geometry and character placeholders | Hit/kill/reward authority |
| `src/ui/App.tsx`, `src/ui/styles.css` | Current responsive graybox HUD, accessibility and command dispatch | Game tick timers and save rewriting |
| `src/app/startRuntime.ts` | Current startup and capped fixed-step loop | Parallel gameplay rule copies |
| `src/game/persistence/` | Future migrations, expanded save/recovery and offline calculation | Direct scene mutation or rewards outside core |

No manager, event bus, service container, multiplayer layer or backend should be created without its first concrete consumer and acceptance case. Use Three.js native loaders/animation/camera features instead of rebuilding existing functionality. Introduce a third-party navmesh/physics dependency only when real geometry and tests show why a simpler authored solution fails.

## Gameplay invariants

- 4 ordered encounters × 5 registered goal enemies = 20 valid kills per Floor.
- Every third Floor: Boss Ready at 20/20; BATTLE normally required; farming remains non-goal.
- Only `GameCore` grants objective credit on one registered death event. Reject duplicate callbacks/replayed damage.
- The graybox uses Whirl, Leap and Void as three fixed representative skills; the six-skill choice catalog and forms are not implemented yet.
- Six skills in three two-choice families; loadout changes preserve current cooldowns; Boss start refreshes them.
- Gear has exactly Weapon, Armor and Cloak slots; reward and next checkpoint commit together.
- Death and Ascension change the run epoch, invalidating pending callbacks; offline never resolves a Boss.

The source-of-truth rules are in [core-loop](../product/core-loop.md); proposed interfaces are in [data contracts](data-contracts.md).

## 3D renderer and responsive UI

Three.js renders in a canvas; React DOM overlays it. Render and simulation cannot assume 720 × 1280 is an actual GPU target: it is a portrait **design coordinate reference**. Recompute DPR-aware viewport and UI safe areas on resize/`visualViewport`; cap DPR by measured performance, not a fixed presumed phone. UI reports the unobscured normalized battle rectangle; camera follows visual targets while keeping the hero visible, but it cannot move the simulation actor.

Floor template authored data drives navigation boundaries, goal spawns, path and camera anchor zones; glTF meshes decorate/corroborate this source. Collision proxies/nav volumes are independent from visible mesh detail. If a GLB fails to load, show an explicit recoverable error or authorized placeholder without changing Floor state.

Each character animation mapping is data-driven (`idle`, `run`, `attack`, `hit`, `death`; Boss adds telegraphs). Weapon and cloak attachments use named bones/nodes; absent optional visuals fall back without breaking attacks. VFX effects consume events and never trigger extra damage in their own lifecycle.

## Security and reliability

Browser runtime is client-authoritative single-player. Treat imported save JSON and catalog inputs as untrusted; validate schema and bounded numeric fields before loading. Disallow a future/newer save schema from being overwritten with an older one. Do not persist live scene nodes or material instances. IndexedDB failure, quota issues and private-mode limitations must be visible with retry/export options; never silently wipe a recoverable previous snapshot.

Run/soft-pause/visibility changes preserve a coherent checkpoint and do not settle offline twice. Test browser refresh during a Boss chest reward, fast reopen, duplicated input, corrupted data, resize while modal open and multiple simultaneous tabs. See [persistence contract](persistence-and-offline.md).

## Scope boundary

The first slice is one authored continuous floating landmass and one automatic Floor, using procedural placeholder geometry. It is **not** a production art acceptance, infinite terrain generator, complete art catalog or mobile app release. Use [validation gates](validation-plan.md) before expanding content.
