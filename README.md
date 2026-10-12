# Nevercrest — Nonstop Knight-inspired 3D Auto-Combat RPG

This is a **fresh, documentation-only repository**, initialized without the former game's Git history, code, assets or build artifacts. It contains product requirements and the technical design for a new implementation. **No game is currently runnable.**

## Finalized technology choice

**Three.js + React + TypeScript** is the approved stack:

- **Three.js:** WebGL 3D rendering, camera, GLB/glTF loading, animations and skill VFX.
- **React + HTML/CSS:** portrait HUD, inventory, skill selection, Boss rewards, settings and responsive overlays.
- **TypeScript:** deterministic gameplay rules, catalogs, navigation interfaces and versioned saves.
- **Blender:** optional, used only when authored 3D geometry, rigging, animation edits or export processing is needed.

A lightweight browser toolchain, navigation/collision libraries and automated test tools will be selected during the first implementation slice. They are **not installed or pinned yet**. See the [technical decision](docs/technical/stack-decision.md) and [architecture](docs/technical/architecture.md).

## Gameplay target

Independently recreate the publicly observable **2016 Nonstop Knight** single-player auto-combat progression loop, with original characters, art, UI and authored continuous floating-landmass Floors. Do not copy proprietary source, meshes, audio, icons, level layouts or internal balance tables.

Key requirements: automatic navigation/targeting/basic attacks; **no joystick**; four encounters × five valid goal enemies = **20 kills per Floor**; Boss Ready after every third Floor and explicit BATTLE; exactly three active skill slots with six selectable base skills; exactly Weapon, Armor and Cloak gear; offline progress never starts or defeats Bosses; current-run Floor 20 enables Ascension; launch-line parity scope through Floor 1000. Portrait-only layout is the approved direction.

## Documentation

**Product**
- [Product brief](docs/product/product-brief.md)
- [Core gameplay and state transitions](docs/product/core-loop.md)
- [2016 reference baseline](docs/product/reference-gameplay-baseline.md) and [parity/evidence policy](docs/product/reference-parity-policy.md)
- [Portrait HUD](docs/product/hud-layout.md), [visual direction](docs/product/visual-direction.md) and [localization](docs/product/localization.md)

**Engineering**
- [Finalized technical stack](docs/technical/stack-decision.md)
- [Architecture](docs/technical/architecture.md) and [data contracts](docs/technical/data-contracts.md)
- [Model and optional Blender workflow](docs/technical/asset-pipeline.md)
- [Save/offline integrity](docs/technical/persistence-and-offline.md)
- [Implementation and acceptance stages](docs/technical/validation-plan.md)
- [Development rules](AGENTS.md) and [contributing](CONTRIBUTING.md)

## Working agreement

The repository intentionally starts with **no GitHub Issues or development backlog**. There is no active Linear issue board or requirement to create one. Use focused development tasks and the current repository files as the source of truth; create Issues or a tracking board only if the owner explicitly requests it. Prefer existing open-source tooling to custom infrastructure.

The first implementation goal is a playable, deterministic, portrait **graybox Floor** with a Three.js scene and simple React HUD. Real character/terrain models are produced after their camera, navigation and animation contracts are validated. See [acceptance gates](docs/technical/validation-plan.md).

Keep future commits confined to the new repository history. No historical Godot implementation is imported.
