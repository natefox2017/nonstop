# Game Data and Interface Contracts

The Gate 1 interfaces are implemented in `src/game/types.ts`, `floor.ts`, `core.ts` and `save.ts`. This document records both that initial slice and the broader target contract; systems named only in later sections remain unimplemented until an authorized slice adds them. Preserve snapshot compatibility when changing the current schema.

## Stable IDs and reference rules

All durable entities use stable opaque string IDs, never localized labels, glTF node paths or Three.js UUIDs. Define at minimum `floor_template_id`, `encounter_id`, `actor_instance_id`, `skill_id`, `rune_id`, `item_instance_id`, `item_definition_id`, `chest_id`, `modifier_id` and `save_schema_version`. Player-facing names are catalog translations.

The reference ruleset is a versioned independent configuration (`ruleset_id = launch_2016`); its state machine is distinct from unverified numeric tuning. Unverified prototype values do **not** automatically become approved parity constants.

## Floor template

Author a hand-designed single contiguous floating landmass per template. The first graybox uses this declarative shape:

```text
FloorTemplate { id, route: Point2[], encounters: 4 × { id, center, goals: 5 × { id, position, maxHealth } }, bossArena: Point2 }
```

The current template is `floating-meadow-v1` in `src/game/floor.ts`; `validateFloorTemplate` checks encounter count, goal count, unique IDs, finite coordinates and route length. It does not yet validate polygonal walkability, obstacle reachability or a catalog of Floor-template mappings.

Gameplay walkability, route/arena boundaries and spawn coordinates are authoritative in the authored Floor definition; a Blender/GLB export must not silently change them. Floor number selects an approved authored template via a deterministic versioned mapping; no runtime maze or selectable-island chain. Gameplay collision and level cosmetics can change independently only if the authored navigation contract remains valid.

Validate coordinates as finite bounded numbers, unique IDs, reachable encounter route order, exactly 20 reachable goals, no unreachable decorative passage that looks like a route, valid Boss staging and a stable forward path. Reject malformed templates rather than starting combat with broken targets. Exact obstacle shapes and units are chosen at implementation kickoff, with a migration path for old template versions.

## Commands and events

Current input is the typed `GameCommand` union: `cast-skill`, `start-boss`, and `toggle-pause`. The broader planned command set includes skill selection, equipment, upgrades, selling and Ascension; sequence/epoch defense is not implemented yet.

Core produces `GameState` snapshots and typed `GameEvent`s for enemy defeat, Floor clear, Boss Ready, Boss start and Hero death. React and Three consume snapshots; they do not own damage or objective credit. Reward and inventory events remain future implementation.

Targeting uses reachable-nav distance and stable-ID tie ordering. Actor death is credited at most once using instance IDs registered in that encounter. Farm/summon/decoration instances have no goal-credit permission.

## Skill and equipment catalogs

Exactly six base skill IDs (`whirl`, `slam`, `leap`, `slash`, `clone`, `void`) are grouped into three slots. Each has five catalog forms including `basic` and a stable per-skill rune ID. Catalog rows declare unlock, cooldown, contact timing, area/target semantics and effect type. Unverified coefficients are tagged calibration; no effect should be secretly implemented inside a VFX component.

Exactly `weapon`, `armor`, `cloak` are gameplay slots. Each item instance stores stable definition ID, level, rarity, rolled modifiers, unique-effect ID and rolled numeric fields. Random drops use an injected seedable RNG for deterministic tests and a weighted eligible chest pool; never a predetermined slot cycle. Validate imported item instances and price/upgrade overflows. Repeated reward-commit requests are idempotent by reward checkpoint ID.

## Durable run state and migration

The current version-1 `GameState` snapshot contains `schemaVersion`, Floor and phase, current/lifetime-high Floor numbers, encounter index, goal kills/defeated IDs, Hero and enemy simulation values, skill cooldowns, elapsed play time, Floor-clear timer and pause state. It is stored as one IndexedDB record. The broader target snapshot adds the durable progression domains below once implemented: `runId`, `epoch`, `rulesetId`, Coins/Tokens, Knight Level/XP, inventory/equipped item IDs, skill forms, permanent upgrades and consumables.

This is a **domain contract**, not a frozen JSON field implementation. Distinguish current-run Floor from lifetime highestFloor. Never serialize Three.js objects, actor pointers, path cache, animation state, running wall-clock timers or GPU resources. Explicitly decide whether skill cooldowns are restored or reconstructed at encounter boundaries; do not infer from old save formats.

Restore/integrity-check inventory and equipment before calculating offline rewards. Migrations operate on an in-memory copy, never downgrade future schemas, and commit one complete result or leave the last-valid snapshot unchanged. Implementation details live in [persistence](persistence-and-offline.md).

## Required tests after implementation

Reject unregistered goal deaths, malformed Floor shape, duplicate events, stale epoch actions, invalid skill slot, non-eligible chest drop, overflowed economy fields and future-schema save. Test deterministic replay with a fixed RNG seed, Boss/retry/offline state changes and atomic reward + next checkpoint. The contracts become frozen only after those tests and one real integrated Floor pass.
