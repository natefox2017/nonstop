# Core Loop and Gameplay State Contract

Nevercrest targets publicly observable mechanics of the original 2016 Nonstop Knight release across Floors 1–1000, **without copying proprietary content**. The current Gate 1 runtime implements the automatic Floor loop, three representative skills, explicit Boss entry and reloadable snapshots; this document's other progression systems remain target requirements. Consult the [launch-era reference](reference-gameplay-baseline.md) for confidence boundaries and the [parity policy](reference-parity-policy.md) for unrecovered constants.

## Autonomous action and player input

- The hero acquires the nearest living, reachable, active hostile by navigable distance, with stable-ID tie breaking; moves into melee range; faces it; resolves a basic hit at the attack event; then keeps or changes target as appropriate.
- No movement joystick, drag steering, tap-to-move requirement or basic-attack button. Skill input, gear changes, Boss BATTLE, pause/settings and Ascension are the player's high-value decisions.
- Transition between ordered encounters follows an authored traversable route. Skill relocation is clamped to valid ground. Dead, duplicate, foreign, null or unregistered targets never receive kill/reward credit.
- Separate deterministic combat state and movement authority from visual poses, particle effects, frame rate and React UI updates. Actors may interpolate visually without changing hit results.

## Floor and Boss finite-state sequence

```text
Floor start -> automated route/travel -> encounter 1..4 (five goal enemies each)
  -> exactly 20 goal kills
  -> non-Boss Floor: persist next-Floor checkpoint -> show transition -> next Floor
  -> every 3rd Floor: Boss Ready (optional non-goal farming)
       -> explicit BATTLE -> Boss fight -> defeat: return to Boss Ready
                                      -> win: commit random chest/reward and
                                         next-Floor checkpoint atomically -> next Floor
```

Only registered **goal** enemies in the four ordered encounter groups count toward 20; farm enemies, allies, summons and decoration do not. Floor progress is monotonic until a defined death/restart/Ascension reset. At Boss Ready, 20/20 stays complete during farming and Boss retries. Ordinary offline progress never starts Boss combat. An explicitly activated **live Frenzy or Boss Ticket** run is a separately gated accelerator; it may cross Boss gates under its documented behavior.

The 2016 reference has a bounded 1000-Floor launch-era content scope. Do **not** silently implement an infinite Floor ladder, guess the Floor-1000 completion screen or invent content beyond 1000. Treat missing terminal behavior as `TO VERIFY`.

## Death, retry, pause and recovery

- Death during a normal encounter retries **the same Floor** from encounter 1 and 0/20 kills, retaining Coins, equipment, Knight Level, skills and permanent progression; restore full effective HP.
- Death in Boss combat without an approved revive restores Boss Ready at 20/20 and full effective HP. Discard the failed Boss actors/health; the next ordinary attempt needs BATTLE.
- A supported legendary Boss revive, if equipped and unused for that attempt, may replace the Hero once within the same Boss battle. Its revival HP percentage is **calibration pending evidence**, not a hardcoded reference truth.
- Persist the post-death retry checkpoint **before** any deferred transition. Pause halts gameplay clocks/AI and combat timers. A deferred callback from an old run/scene epoch must not change the new run.
- UI resizing, overlay changes, tab background/foreground and graphics reload must not mutate rewards, objectives or saved selections.

## Three active skills and runestones

Exactly **three live slots**, with one selection from each two-skill family:

| Slot | Choices |
| --- | --- |
| 1 | Whirl or Slam |
| 2 | Leap or Slash |
| 3 | Clone or Void |

There are six base skills, each with five launch-line forms **including the base form** (30 forms total). Knight Level unlocks skills/forms. Switching a loadout must **not refill cooldowns**. Entering a Boss battle refills all three cooldowns. Resolve skill effects on their gameplay contact event and return to automatic fighting. Special interactions to preserve where supported by evidence include Gold Leap coins on landing, Clone Leap inheriting the selected Clone form, 3+ enemy multikill rewards, knockback/control, multi-cast and cooldown-effect variants. Exact durations, damage coefficients and unlock levels require source evidence or explicitly labeled provisional tuning.

## Equipment, rewards and economy

Gameplay gear has exactly three slots: **Weapon** (basic damage), **Armor** (effective survivability) and **Cloak** (active skill power). Enemies earn Coins; Coins upgrade equipped items; selling and equipping operate on stable item instances. Bosses award a random chest from the unlocked pool, not a fixed slot rotation. A Boss reward's base power must exceed the equipped same-slot item's base power. Persistence must commit the chest reward and next-Floor checkpoint together **before** presentation.

- Common: one random modifier.
- Rare: two random modifiers.
- Legendary: two random modifiers plus one fixed unique effect defined by the item/chest family.
- Modifiers include attack/skill damage, attack speed, crit, dodge, survivability and bounded conditionally stacked effects. Each timed conditional stack expires independently.

Permanent themed chest unlocks and Knight Level are distinct from run-local equipment/Coins. Exact chest weights, damage curves, upgrade costs and rarity probabilities are not known launch-era constants; store as versioned calibration data, never embed in UI code.

## Frenzy, Boss Ticket and offline

- Frenzy Potion is a **live-session** finite boost/warp/automatic Boss-gate accelerator. The active duration does not progress offline. Its exact numeric buff/duration is calibration.
- Boss Ticket jumps regular minion Floors and chains **three Boss fights**, covering nine ordinary Floors in the launch-era cadence. Persist the remaining sequence for interrupted play.
- Offline simulation operates only on durable snapshot data and timestamp differences. Its approximate reference speed is one third of live encounter throughput, subject to calibration. It may advance through ordinary Floors and reach the **next** Boss Ready after completing the required minions. It must **never** start/defeat a Boss or award Boss gear.
- Apply Coin/offline-gold permanent upgrades through one reconciled calculation. Protect against clock rollback, extremely long absence, duplicate foreground settlements and untrusted future save schemas. See [persistence contract](../technical/persistence-and-offline.md).

## Ascension

Eligibility depends on the **current run** reaching Floor 20 (`floor_number >= 20`), not on lifetime highest Floor. It does not inherently require clearing Floor 20 or beating a Floor-20 Boss. Refuse activation while a save integrity/persistence failure is unresolved; require an explicit confirmation because it is destructive.

Ascension banks pending progression Tokens, returns to Floor 1 and resets run-local Coins/gear. It retains Knight Level/XP, skills/forms/unlocks, already banked Tokens and purchased permanent Token upgrades. Owning a Token does not automatically increase stats; purchased upgrade levels do. The legacy prototype's minimum-one-Token settlement was an **unverified calibration**, not a binding historical reward rule. Preserve current-run versus lifetime record semantics throughout save/load/offline/restart.

## Implementation-independent acceptance

Use deterministic tests for the state machine, target and kill identity, 20-kill groups, Boss Ready/retry, cooldown switching, random-chest eligibility, atomic reward checkpoint, death, offline Boss exclusion and current-run Ascension. Then verify the same behavior in a real rendered portrait battle scene. Do not mark a rule implemented based on a catalog, mockup or document alone.
