# Proposed Data and Interface Contracts

The following defines **planned interfaces** for the approved TypeScript/Three.js project, not existing files or ready-to-import code. Freeze exact names and serialization versions during the first implementation slice; later public state changes require documented compatibility and tests.

## Stable IDs and reference rules

All durable entities use stable opaque string IDs, never localized labels, glTF node paths or Three.js UUIDs. Define at minimum `floor_template_id`, `encounter_id`, `actor_instance_id`, `skill_id`, `rune_id`, `item_instance_id`, `item_definition_id`, `chest_id`, `modifier_id` and `save_schema_version`. Player-facing names are catalog translations.

The reference ruleset is a versioned independent configuration (`ruleset_id = launch_2016`); its state machine is distinct from unverified numeric tuning. Unverified prototype values do **not** automatically become approved parity constants.

## Floor template

Author a hand-designed single contiguous floating landmass per template. Proposed declarative shape:

```text
FloorTemplate {
  id, version, coordinateSystem: "meters-y-up",
  playableBounds / walkablePolygons,
  authoredRoute: ordered waypoint ids + 3D positions,
  encounters: exactly four ordered Encounter { id, arenaBounds,
      entryAnchor, exitAnchor, spawnAnchors: exactly five goal entries },
  bossArena: { spawnAnchor, entryAnchor, cameraZone },
  decorSockets, navDataVersion, visualAssetIds
}
```

Gameplay walkability, route/arena boundaries and spawn coordinates are authoritative in the authored Floor definition; a Blender/GLB export must not silently change them. Floor number selects an approved authored template via a deterministic versioned mapping; no runtime maze or selectable-island chain. Gameplay collision and level cosmetics can change independently only if the authored navigation contract remains valid.

Validate coordinates as finite bounded numbers, unique IDs, reachable encounter route order, exactly 20 reachable goals, no unreachable decorative passage that looks like a route, valid Boss staging and a stable forward path. Reject malformed templates rather than starting combat with broken targets. Exact obstacle shapes and units are chosen at implementation kickoff, with a migration path for old template versions.

## Commands and events

Input is a typed finite command union, e.g. `CastSkill(slot=1..3)`, `ChooseSkill(family,rune)`, `EquipItem(instanceId)`, `UpgradeEquipment(slot)`, `SellItem(instanceId)`, `StartBoss`, `ConfirmAscend`, `Pause`, `Resume`. Include a monotonic command sequence/epoch for duplicate and stale event defense. Reject invalid slot/state/insufficient currency/unknown item with a structured result that **does not mutate state**.

Core produces read-only snapshots and presentation events, e.g. `DamageApplied`, `ActorDied`, `ObjectiveChanged`, `BossReady`, `ChestCommitted`, `FloorAdvanced`, `RunAscended`. React and Three subscribe; they do not own side effects that modify rewards. A display event may repeat safely (animation replay) while objective and inventory state must not.

Targeting uses reachable-nav distance and stable-ID tie ordering. Actor death is credited at most once using instance IDs registered in that encounter. Farm/summon/decoration instances have no goal-credit permission.

## Skill and equipment catalogs

Exactly six base skill IDs (`whirl`, `slam`, `leap`, `slash`, `clone`, `void`) are grouped into three slots. Each has five catalog forms including `basic` and a stable per-skill rune ID. Catalog rows declare unlock, cooldown, contact timing, area/target semantics and effect type. Unverified coefficients are tagged calibration; no effect should be secretly implemented inside a VFX component.

Exactly `weapon`, `armor`, `cloak` are gameplay slots. Each item instance stores stable definition ID, level, rarity, rolled modifiers, unique-effect ID and rolled numeric fields. Random drops use an injected seedable RNG for deterministic tests and a weighted eligible chest pool; never a predetermined slot cycle. Validate imported item instances and price/upgrade overflows. Repeated reward-commit requests are idempotent by reward checkpoint ID.

## Durable run state and migration

Proposed snapshot domains: `schemaVersion`, `runId`, `epoch`, `rulesetId`, `floorNumber`, `highestFloor`, `encounterBoundary`, `goalKills`, `bossState`, `coins`, `bankedTokens`, `pendingTokens`, `knightLevel`, `xp`, `inventory`, `equippedItemInstanceIds`, `skillLoadout`, `permanentUpgradeLevels`, `consumableInventory`, `bossTicketRemaining`, `checkpointId`, `lastCommittedTimestamp`.

This is a **domain contract**, not a frozen JSON field implementation. Distinguish current-run Floor from lifetime highestFloor. Never serialize Three.js objects, actor pointers, path cache, animation state, running wall-clock timers or GPU resources. Explicitly decide whether skill cooldowns are restored or reconstructed at encounter boundaries; do not infer from old save formats.

Restore/integrity-check inventory and equipment before calculating offline rewards. Migrations operate on an in-memory copy, never downgrade future schemas, and commit one complete result or leave the last-valid snapshot unchanged. Implementation details live in [persistence](persistence-and-offline.md).

## Required tests after implementation

Reject unregistered goal deaths, malformed Floor shape, duplicate events, stale epoch actions, invalid skill slot, non-eligible chest drop, overflowed economy fields and future-schema save. Test deterministic replay with a fixed RNG seed, Boss/retry/offline state changes and atomic reward + next checkpoint. The contracts become frozen only after those tests and one real integrated Floor pass.
