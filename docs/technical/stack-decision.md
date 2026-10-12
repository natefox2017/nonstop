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

## Selected implementation tooling (not yet installed)

- **Vite** as the build/dev tool with strict TypeScript; pin mutually compatible stable versions in the first implementation lockfile.
- **Vitest** as the unit/integration test runner for deterministic game rules and data validation.
- **Playwright** as the browser test runner for startup, portrait resize, modal interactions, keyboard/focus and WebGL smoke checks.
- **IndexedDB** for versioned atomic local game saves, accessed through a typed storage interface with complete transactional snapshots.
- **Three.js GLTFLoader and AnimationMixer** for asset loading and animation, without writing redundant parsers.
- **No physics engine by default**: use authored routes and simple collision queries for the first Floor. Evaluate Rapier only if a demonstrated gameplay requirement needs full rigid-body physics.
- **Authored waypoint graph** for the first Floor, with reachable-distance targeting and deterministic stable-ID ties. Evaluate a maintained navigation library only if authored maps outgrow the graph contract.
- **React useSyncExternalStore** with a typed immutable snapshot adapter for HUD state. No Zustand or additional state manager until concrete needs justify it; React never owns the gameplay tick.

Record actual package versions, licenses, browser support and performance constraints when dependencies are added. Avoid a speculative managers/services framework; build the smallest complete vertical slice.

## Why not Phaser or React Three Fiber

- **Phaser is not selected.** It is primarily a 2D game framework and would add a second scene/render/input lifecycle to this Three.js 3D project. Do not install it or copy Phaser-specific scene APIs into the implementation.
- **React Three Fiber is not selected for the initial runtime.** Use imperative Three.js for the scene and React DOM for UI to keep one render owner and straightforward deterministic simulation boundaries. Reconsider only through an explicitly approved architecture change.
- **Blender is an optional asset editor, not a game framework.** The browser must run without it.

## First implementation contract

- Scaffold only the approved Vite + React + TypeScript + Three.js browser application, plus Vitest and Playwright when their first required tests are implemented. Record actual dependency versions in the lockfile; no versions are currently installed.
- GameCore uses deterministic fixed-step updates, typed commands and events, and immutable snapshots. Use a candidate 30 Hz simulation step initially; confirm or adjust with measured tests before treating it as a frozen performance contract.
- One authored Floor template provides waypoint navigation, walkable bounds, spawn anchors and four ordered encounters. GLB meshes are visuals, not navigation or reward authorities.
- React renders an accessible portrait DOM HUD using useSyncExternalStore; Three.js owns canvas rendering, GLTFLoader, AnimationMixer and visual effects. Neither UI nor renderer may independently grant kills or rewards.
- Use IndexedDB with schema validation and atomic checkpoint writes. No server, multiplayer, physics engine or speculative manager framework in the first slice.
- Maintain original chibi 3D art and the frozen gameplay invariants. No Pokémon franchise assets and no mechanic changes.

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

The **core stack is settled**. Implementation evidence is still needed for actual package versions and minimum browser class, measured fixed-step performance, viewport GPU budgets, first UI design approval and exact save schema. The initial waypoint navigation, no-physics default and React subscription approach are selected above; they are not installed implementations. These are normal engineering decisions **within** the agreed stack, not a reopening of the engine choice.

Follow the [staged validation plan](validation-plan.md): functional graybox first; one integrated representative hero/enemy/island asset batch next; scale art and features only after rendered acceptance. Preserve originality and license provenance.
