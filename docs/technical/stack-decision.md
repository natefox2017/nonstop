# Runtime Stack — Approved

## Decision

**Approved by the project owner on 2026-10-12.** The new Nevercrest implementation uses **Three.js + React + TypeScript**. **Blender is optional** for authored 3D modeling, rigging, retargeting and export; it is not required for procedural geometry, gameplay code, UI or runtime rendering.

This decision is final for the project's initial browser implementation unless the owner explicitly requests a change. This repository is currently **documentation only**: technology approval is not a claim that packages have been installed or the game implemented.

## Component ownership

| Responsibility | Approved direction | Notes |
| --- | --- | --- |
| 3D world, camera, animation, VFX and GLB/glTF | **Three.js** | One imperative scene owner; avoid duplicating ownership with React |
| HUD, inventory, skill dialogs, responsiveness, accessible controls | **React + HTML/CSS** | DOM overlay over the WebGL scene |
| Combat state machine, skills, progression, catalogs, navigation interfaces | **Strict TypeScript** | Pure deterministic core; visuals have no reward authority |
| Models, rigging, custom motion, complex hand-authored island meshes | **Blender if needed** | Reuse licensed GLB art or generate basic meshes directly in Three.js |
| Source assets | **glTF 2.0 / GLB** | Record rights, import/export version and stable attachment points |

The browser is the initial target; Android/iOS packaging and cloud services are not part of this foundation. The gameplay view is portrait-only. This is a **Web game stack**, not a claim that Three.js supplies an integrated game-engine editor, AI navigation, physical simulation or persistence on its own.

## Implementation tool recommendations (not yet installed)

- **Vite** for development/build, using supported version and strict TypeScript settings chosen when scaffolding.
- **Vitest** for deterministic game rules and data validation tests.
- **Playwright** for browser startup, portrait resize, modal interactions, keyboard/focus and regression captures.
- **IndexedDB** for versioned atomic local game saves, accessed behind a small typed storage interface.
- **Three.js GLTFLoader and AnimationMixer** for asset loading and animation, without writing redundant parsers.
- **Rapier** only if a real collision/physics need remains after an authored floor graybox; do not install reflexively.
- Existing maintained pathfinding/navmesh components evaluated against authored route/arena geometry before custom algorithms.
- A minimal typed UI subscription adapter; add **Zustand** only if state complexity requires it. The React render loop never owns the gameplay tick.

Record actual package versions, licenses, browser support and performance constraints when dependencies are added. Avoid a speculative managers/services framework; build the smallest complete vertical slice.

## Architecture boundaries

```text
DOM input -> typed command queue -> pure TypeScript GameCore
                                 -> rules / encounter / actors / rewards
                                 -> validated snapshot and offline settlement
                          |                                 |
                    Three.js renderer                 React HUD overlays
                    (visual subscriber)               (command subscriber)
```

Simulation steps and reward commits are independent from animation frame rate, sound timing and DOM effects. Keep an authored declarative Floor template as the navigation/encounter/spawn source of truth; GLB visuals cannot change gameplay coordinates. See [architecture](architecture.md), [data contracts](data-contracts.md) and [persistence](persistence-and-offline.md).

## Remaining design decisions

The **core stack is settled**. Only implementation details still require scoped evidence: versions and minimum browser class, fixed-step clock choice, walkable graph/navmesh representation, collision approach, viewport GPU budgets, first UI design approval and exact save schema. These are normal engineering decisions **within** the agreed stack, not a reopening of the engine choice.

Follow the [staged validation plan](validation-plan.md): functional graybox first; one integrated representative hero/enemy/island asset batch next; scale art and features only after rendered acceptance. Preserve originality and license provenance.
