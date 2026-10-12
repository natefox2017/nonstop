# Nevercrest — Nonstop Knight-inspired 3D Auto-Combat RPG

Nevercrest is a portrait browser game built with **Three.js, React and TypeScript**. The current runnable slice is a primitive 3D graybox that exercises one authored floating-island Floor. Its combat and tuning are original; the project does not include assets or code from the 2016 reference game.

## Current playable slice

- The knight automatically follows the authored route, targets reachable enemies and performs basic attacks.
- Each Floor contains four ordered encounters with five registered goal enemies apiece. Only those 20 enemies count toward the objective.
- Ordinary Floors clear and advance automatically. Every third Floor stops at **Boss Ready** until the player presses **BATTLE**. The Boss fights automatically after that command.
- The HUD has exactly three active skill buttons—currently Whirl, Leap and Void—with gameplay-owned cooldowns. The core supports equipping all six documented skills into their matching slot; cooldowns remain per-skill when switching, and Boss start refreshes the active three. Buttons and keys 1–3 use the same commands. Pause and Resume halt the simulation.
- The complete current `GameState` is saved to IndexedDB, with periodic saves and saves on commands and phase changes. Writes atomically retain the previous valid snapshot for recovery; valid version-1 saves migrate to version 2, and a future schema is preserved without downgrade.
- A single hand-authored waypoint Floor definition and procedural primitive meshes form the current graybox. Combat values in [`tuning.ts`](src/game/tuning.ts) are provisional pacing values, not claims about reference balance.

This is a graybox, not production art or full feature parity. Slam, Slash and Clone are selectable in core state, but their effects and the Skills page remain unimplemented pending verified behavior and an approved page design. Skill forms/unlock levels, equipment and chests, expanded progression persistence, offline settlement and current-run Floor-20 Ascension are also not present. See [the product brief](docs/product/product-brief.md), [core loop](docs/product/core-loop.md) and [validation stages](docs/technical/validation-plan.md).

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm. The package lock pins the actual versions.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite in a portrait browser. The game plays without mouse steering or a basic-attack button. Use the three skill buttons or keys 1–3, press **BATTLE** on Boss Floors, and pause with the top-right control or `P`.

## Validate

```sh
npm test
npm run build
```

The deterministic core tests cover Floor shape, stable target ties, one-time kill credit, 20-goal Floor clear/advance, every-third-Floor Boss Ready and explicit Boss start, skill-slot switching and cooldown persistence, current-run Floor-20 Ascension eligibility, same-Floor death retry, and Boss loss/retry. Browser screenshots and smoke captures live under [`output/playwright/`](output/playwright/).

## Project contracts

- [Core gameplay and state transitions](docs/product/core-loop.md)
- [2016 reference baseline](docs/product/reference-gameplay-baseline.md) and [parity/evidence policy](docs/product/reference-parity-policy.md)
- [Portrait HUD](docs/product/hud-layout.md) and [visual direction](docs/product/visual-direction.md)
- [Approved technology stack](docs/technical/stack-decision.md), [architecture](docs/technical/architecture.md) and [data contracts](docs/technical/data-contracts.md)
- [Save and offline contract](docs/technical/persistence-and-offline.md) and [asset pipeline](docs/technical/asset-pipeline.md)
- [Development rules](AGENTS.md) and [contributing](CONTRIBUTING.md)

The repository has no active Linear board or GitHub issue backlog. Use the current repository requirements and scoped work; do not import tasks or artifacts from another project.
