# Animation presentation validation

## Adoption decision

Use Three.js' native `GLTFLoader`, `SkeletonUtils.clone`, and `AnimationMixer` for the current character-animation path. The isolated browser smoke page verified those APIs against this repository's `three@0.186.1`: two skinned source models loaded, three independent 23-bone actors were created, and animation actions changed skinned vertices without moving unrelated actors or their roots. See [the smoke page](../../experiments/asset-smoke.html) and [the captured browser evidence](../../output/playwright/kaykit-animation-smoke.png).

Do not add `three.quarks` to the runtime for this work. The official [`three.quarks` package metadata](https://github.com/Alchemist0823/three.quarks/blob/master/packages/three.quarks/package.json) identifies release `0.17.1`, license `MIT`, and peer range `three >=0.182.0`. The project's `three@0.186.1` satisfies that declared peer range. This is metadata-level version compatibility only: `three.quarks` was not installed or exercised in the browser, so runtime compatibility is unverified. Revisit it only if an approved effect needs its particle system and run an isolated integration smoke test before adopting it.

The smoke models and animations are temporary validation assets from the creators' free KayKit tiers. The official [Adventurers pack](https://kaylousberg.itch.io/kaykit-adventurers) and [Character Animations pack](https://kaylousberg.itch.io/kaykit-character-animations), along with the included archive license files, state CC0. This does not approve these characters as production art or replace the current game characters.

## Existing skill boundary

The current implemented skills are `whirl`, `leap`, and `void` in [`tuning.ts`](../../src/game/tuning.ts) and [`core.ts`](../../src/game/core.ts):

| Skill | Current behavior | Current tuning |
| --- | --- | --- |
| Whirl | Damages enemies within radius around the hero | 18 damage, radius 3.8, cooldown 8s |
| Leap | Moves the hero up to 4.2 units toward the selected target, then damages enemies around that target | 26 damage, radius 2.8, cooldown 10s |
| Void | Damages only the selected target | 54 damage, cooldown 14s |

`slam`, `slash`, and `clone` exist in the catalog/save types, but do not have implemented cast effects; tests assert that an attempted cast produces no effect. This document adds no behavior for those entries.

## Minimal presentation event contract

Add one `GameEvent` variant when a cast is accepted:

```ts
type ImplementedSkillId = "whirl" | "leap" | "void";

type SkillCastEvent = {
  type: "skill-cast";
  skillId: ImplementedSkillId;
  heroFrom: Point2;
  heroTo: Point2;
  affectedEnemyIds: string[];
};
```

Emit it only after the existing phase, equipped-slot, cooldown, and target checks pass. `affectedEnemyIds` lists enemies that the existing cast logic actually damages. `heroFrom` and `heroTo` are equal for Whirl and Void; Leap uses its already-computed pre- and post-move positions. The event describes a completed gameplay decision; it does not own damage, cooldown, movement, or save state. Preserve existing `enemy-defeated` events for kills.

`skill-equipped` only reports a loadout change, and `enemy-defeated` reports a kill rather than each accepted hit. The state snapshot already carries authoritative cooldowns and hero position. `GameStore.dispatch()` stores the command result's events before synchronously notifying subscribers, while `WorldRenderer` currently subscribes to state only and does not read `getEvents()`. The smallest integration point is therefore:

1. `dispatchCommand()` emits `skill-cast` alongside any existing defeat events.
2. `GameStore` continues publishing that result in its existing dispatch notification.
3. `WorldRenderer` copies each new `skill-cast` into a short-lived presentation queue in its store subscriber, then uses the latest state for actor positions and cooldown UI. Do not persist presentation events.

The renderer may map the three skill IDs to approved character clips and optional effects. That mapping is presentation only; this validation has not chosen those production mappings or added skill VFX.

## Remaining integration work

- Add type and unit tests proving accepted casts emit one event with the expected IDs/positions and rejected casts emit none.
- Deliver events to the renderer without losing them at the next simulation tick; verify that presentation cannot change combat results or saves.
- Select production animation clips and any effects with the game's art direction; use a separately approved production asset set with recorded provenance.
- Browser-check each implemented skill at supported viewport sizes, including simultaneous/rapid actions, pause, unmount, and reduced-motion/performance behavior.
- Run an independent QA pass. The current verification was author-run; this closeout did not receive independent QA. PR #7 currently has no reported CI checks.
