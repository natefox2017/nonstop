# Nevercrest Development Agreement

## Repository and product authority

This repository is a clean **documentation-only** starting point for a Three.js game. It has no runnable game, tests, models or build system until they are actually committed. The following are separate authorities:
1. The owner's latest explicit instructions.
2. Approved product behavior in `docs/product/` and the approved technology decision in `docs/technical/stack-decision.md`.
3. Current repository code and measured tests once implementation exists.

Do not infer that a former project branch, historical chat or a specification demonstrates an implemented feature. An AI without prior conversation must be able to understand development from this repository and the scoped task itself. Mark unknown historical game behavior as `TO VERIFY`, not a newly invented mechanic.

## Finalized technology stack

Use **TypeScript + Three.js** for the scene and game simulation interfaces, and **React + semantic HTML/CSS** for game UI. Blender is **optional** for bespoke meshes, skeletons and animations; do not make it a runtime dependency. Develop for the browser with portrait layout first. Pick package versions, bundler, test tools and optional navigation/physics libraries only when introducing the actual implementation; prefer maintained existing open-source solutions over custom replacements.

Do not substitute Godot, another full engine, Unity, a speculative backend or a new UI framework without explicit owner approval. Keep Three.js rendering independent of deterministic gameplay rules; React must not grant damage, rewards or objective credit.

## Product invariants

- Reference the publicly observable original **2016 Nonstop Knight** mechanics, Floors 1–1000, using independently authored code, balance, visuals, UI and audio. Never copy proprietary game code or assets.
- Automatic hero movement, targeting and basic melee attacks. **No movement joystick or basic-attack button.**
- Four ordered encounters of five registered goal enemies: exactly **20 goal kills per Floor**; other enemies/summons never increment the objective.
- Every third Floor stops at Boss Ready after 20 kills. Ordinary Boss combat requires an explicit BATTLE command, apart from documented user-activated live accelerators; offline never starts/defeats a Boss or grants Boss gear.
- Three active skill slots, six selectable base skills grouped into three two-choice families. Cooldowns remain authoritative in gameplay state.
- Exactly Weapon, Armor and Cloak equipment; save reliable inventory/coin/reward progression. Ascension unlocks on **current-run** Floor 20, not lifetime highest Floor.
- One authored continuous floating landmass per Floor template, not procedural maze generation. Responsive portrait-only game layout.

Use the approved original Pokémon-inspired chibi 3D visual direction in [visual direction](docs/product/visual-direction.md): rounded expressive characters, simplified Three.js-friendly materials and animation rigs. Never copy Pokémon creatures, characters, logos or assets. Visual redesign does not change combat, progression, input or economy rules.

See [core loop](docs/product/core-loop.md), [parity policy](docs/product/reference-parity-policy.md), [HUD](docs/product/hud-layout.md) and [technical contracts](docs/technical/data-contracts.md).

## Standards and task authority

Follow the [central engineering standard](https://github.com/natefox2017/agents-md/blob/main/AGENTS.md) selectively with the [Three.js](https://github.com/natefox2017/agents-md/blob/main/profiles/THREEJS.md), [Web game](https://github.com/natefox2017/agents-md/blob/main/profiles/WEB_GAMES.md) and [3D game](https://github.com/natefox2017/agents-md/blob/main/profiles/GAME_3D.md) profiles. The [asset delivery contract](https://github.com/natefox2017/agents-md/blob/main/profiles/ASSET_DELIVERY.md) applies only to actual asset tasks. This documentation-only repository has no installed framework packages, executable game, test runner or active Linear Board; do not claim otherwise. Use the [stack decision](docs/technical/stack-decision.md) for the selected Vite, Three.js, React, Vitest, Playwright, waypoint and persistence approach; Phaser and React Three Fiber are not selected. Future code and commands must be verified from actual files before use.

## Lightweight development workflow

No active Linear board, GitHub Issue backlog or mandatory task-claim system is established for this fresh repository. **Do not recreate or import old tasks.** Work directly from the current explicit request; only set up a tracker when the owner asks for one. For a complex independent task, write a zero-context executable specification: goal, current files/interfaces, behavior, edge cases, constraints, tests and acceptance. Keep small one-off changes lightweight.

Before modifying anything, inspect the latest files, applicable `AGENTS.md`, Git status if accessible, branch/PR overlap, dependencies and tests. Use a scoped branch and PR when that is required by the repository or collaboration; do not bypass protection/review. Preserve contributor changes and never force-overwrite shared work. Freeze save/API/map contracts before parallel workers edit them. Avoid unrequested refactors, UI flows and unnecessary CI changes.

Documents are for enduring requirements, architecture and development standards; do **not** use Markdown as a temporary TODO/progress/bug-history log. Repository text, branch and future code identifiers are English-only. Do not commit credentials, restricted assets, private keys or uncertain-licensed content.

## AI-first implementation contracts

Optimize the project for independent, zero-context AI contributors without introducing unnecessary tooling or speculative modules.

- Keep gameplay logic in pure, deterministic TypeScript modules with typed commands, state snapshots and events. React and Three.js consume those contracts; neither can mutate combat rewards or progression directly.
- Prefer declarative, validated data for Floors, encounters, enemies, skills, equipment and visual asset mappings over scattered constants. Preserve the frozen gameplay rules and identifiers.
- Maintain explicit module ownership and stable interfaces when source modules actually exist. Do not fabricate paths, packages, generators or tests in advance.
- Standardize future GLB asset handoffs: coordinate system, scale, pivot, named animation clips, equipment attachment nodes, material constraints, source/license and verified import path. Prefer modular original chibi assets and shared rigs; Blender is optional.
- Each substantial authorized task must be executable without prior conversation: current source baseline, exact allowed files/interfaces, required behavior, exclusions, finite test commands and observable acceptance. Do not create a parallel Markdown task tracker.
- Before building new functionality, inspect reusable local code and maintained open-source options (normally 1–3) for compatibility, license, maintenance, security and integration cost. Avoid redundant infrastructure and unapproved dependencies.
- Require actual import, browser interaction or gameplay evidence for the relevant deliverable; screenshots and type checks alone are not evidence of playable behavior.

## Implementation and validation

Build a minimal **one-Floor graybox** first: basic Three.js view, authored navigation/encounters, deterministic automated combat and three-slot React HUD. Accept real models only after route, scale, camera and action timings are validated. Prefer compliant reusable models/animations, GLB/glTF exports and small integrated art batches. UI implementation requires an approved page/flow design.

Keep authoritative gameplay in pure testable TypeScript state/rules. Renderer, sound, DOM/React, visual effect lifecycles and animation tracks are consumers of events, not independent gameplay authorities. Browser persistence must validate versions/IDs, commit complete snapshots atomically and avoid duplicate offline/Boss rewards.

For new code, run relevant unit and browser smoke tests actually available in the repository. Test objective/Boss/death/skill/save/offline rules independently from WebGL, then verify rendered portrait layout, focus/touch and performance in actual browsers. Do not report unexecuted tests as successful. There are **no** runtime or CI tests in this initial documentation-only commit.

Report concrete file changes, test results, commits/PR status if applicable and unresolved blockers. See [validation stages](docs/technical/validation-plan.md).
