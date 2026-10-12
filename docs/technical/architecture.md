# Web Game Architecture — Approved Stack

This is the architecture for the **approved Three.js + React + strict TypeScript** browser implementation. It is a design, not current code: the repository has no `src/` directory yet. Blender is optional and never required at runtime.

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

Start with one main-thread fixed-timestep loop (candidate 30 simulation ticks/sec; `TO TUNE` with benchmarks) and `requestAnimationFrame` rendering interpolation. Cap catch-up steps after a long inactive tab; do **not** simulate hours by running gameplay ticks in the background. On resumed focus, apply the pure offline settlement once from the persisted checkpoint and save. Maintain a monotonic session clock for play time; use wall-clock differences only at offline settlement boundaries.

## Planned source boundaries (none exists yet)

| Future location | Responsibility | Must not own |
| --- | --- | --- |
| `src/game/core/` | Floor state machine, deterministic rules, actors and commands | DOM, Three.js mesh or storage API |
| `src/game/catalogs/` | Versioned skills, items, chests, tuning and stable IDs | Event listeners and UI translations |
| `src/game/maps/` | Authored templates, route/arena geometry, spawns, path projection | Generated random terrain or artwork exports |
| `src/game/persistence/` | Validation/migration, transactional snapshot, offline calculation | Direct scene mutation or rewards outside core |
| `src/render/` | Three.js scene, GLTFLoader, AnimationMixer, camera, effects and geometry | Hit/kill/reward authority |
| `src/ui/` | React panels, styles, localization, accessibility and command dispatch | Game tick timers and save rewriting |
| `src/app/` | Startup, dependency wiring, input focus/pause, lifecycle and diagnostics | Parallel gameplay rule copies |
| `tests/` | Unit tests, controlled integration fixtures and browser acceptance | Live player state |

No manager, event bus, service container, multiplayer layer or backend should be created without its first concrete consumer and acceptance case. Use Three.js native loaders/animation/camera features instead of rebuilding existing functionality. Introduce a third-party navmesh/physics dependency only when real geometry and tests show why a simpler authored solution fails.

## Gameplay invariants

- 4 ordered encounters × 5 registered goal enemies = 20 valid kills per Floor.
- Every third Floor: Boss Ready at 20/20; BATTLE normally required; farming remains non-goal.
- Only `GameCore` grants objective credit on one registered death event. Reject duplicate callbacks/replayed damage.
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

The first slice is one authored continuous floating landmass and one fully verified automatic Floor, using primitives/temporary legal assets. It is **not** an infinite terrain generator, a complete art catalog or a mobile app release. Use [validation gates](validation-plan.md) before expanding content.
