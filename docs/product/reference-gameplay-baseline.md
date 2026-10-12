# Original Nonstop Knight Gameplay-Parity Baseline

Target reference for Floors **1-1000**: the original 2016 release line of **Nonstop Knight**, not *Nonstop Knight 2* and not later live-operations systems such as Pets, Events, Bounties or competitive modes. Floors above 1000 are reserved for a later original-design phase and are intentionally out of scope for the current implementation.

This project reproduces publicly observable gameplay behavior with original code, names, art, maps, UI geometry, audio and independently authored tuning data. No reference-game binaries, source code or extracted assets are used.

## 1. Launch Floor structure

- Launch-era industry coverage documents **1000 Floors** in the 2016 content set. Floor 1000 is the current parity boundary; post-1000 content is intentionally deferred to the later original-design phase.
- The hero automatically searches for enemies, moves and performs basic melee attacks.
- The player has no movement joystick and no basic-attack button.
- Every Floor requires exactly **20 valid minion kills**.
- Normal Floors transition automatically after 20/20.
- Every third Floor stops at Boss Ready after 20/20.
- Outside the player-activated live Frenzy/Boss-Ticket flows described below, the player explicitly presses BATTLE; offline simulation never starts a Boss.
- Boss Ready allows non-objective farming without increasing the completed 20-kill objective.
- Boss victory advances to the next Floor. There is no route-selection world map.

## 2. Automatic combat and navigation

The mandatory loop is:

```text
Acquire nearest reachable active enemy
-> follow navigable ground into melee range
-> face target
-> basic attack
-> apply one hit on the attack event
-> target dies or survives
-> keep target or retarget
```

Only alive, active and reachable actors may be targeted. Equal path-distance choices use deterministic stable-ID ordering. Unreachable targets never grant objective credit. Travel between encounters is automatic. Skill displacement must remain on navigable ground.

## 3. Three slots, six skills and runestones

The combat HUD has exactly three active skill slots:

1. Whirl / Slam;
2. Leap / Slash;
3. Clone / Void.

Each of the six base skills has five launch-line variants including its base form. Knight Level unlocks skills and runestones. The runtime preserves the current cooldown when a player changes an equipped skill or runestone; entering a Boss fight refreshes all three active-skill cooldowns.

Observable special interactions include:

- Gold Leap grants Coins on landing even without a kill;
- killing at least three enemies with one attack/skill grants a multikill Coin reward;
- Clone Leap creates a clone with the behavior of the currently equipped Clone runestone;
- defensive, control, multi-cast, summon and cooldown-oriented runestones modify the corresponding base skill while returning to automatic combat afterward.

## 4. Boss gate and death recovery

Every third Floor follows:

```text
20 / 20
-> Boss Ready
-> optional non-objective farming
-> READY / HARD / VERY HARD / IMPOSSIBLE readiness label
-> BATTLE
-> Boss fight
  failure -> Boss Ready
  victory -> random chest reward -> next Floor
```

Ordinary-minion death returns to the beginning of the current Floor, resetting current-Floor objective progress while retaining Coins, equipment and permanent progression. Boss failure returns to Boss Ready and permits another attempt.

## 5. Coins, chests and equipment

There are exactly three gameplay equipment slots:

- Weapon: basic-attack damage;
- Armor: survivability / maximum damage capacity;
- Cloak: active-skill damage.

Minions grant Coins and Coins upgrade equipped gear. Every Boss grants a random chest from the unlocked chest pool. Basic chest progression is run-local, while themed chest-family unlocks are lifetime progression and remain available after Ascension. Launch-era evidence directly places **Frosty Chest at lifetime Floor 100**; exact thresholds for other chest families remain calibration/audit items until equally strong evidence is recovered. Chest contents can award Weapon, Armor or Cloak; the reward is not a fixed slot rotation. Boss reward base power is stronger than the currently equipped item in the same slot.

Rarity contract:

- Common: one random modifier;
- Rare: two random modifiers;
- Legendary: two random modifiers plus one fixed unique effect tied to its item/chest family.

Modifiers include damage, attack speed, critical chance/damage, dodge, Armor/HP and conditional effects. Conditional after-kill, after-hit and after-skill modifiers can stack with independently expiring durations.

## 6. Original run-acceleration consumables

The launch-line loop includes two consumable accelerators:

- **Frenzy Potion:** a limited live-session state that raises offense and defense, automatically warps the Knight toward enemies and keeps the automatic run moving through Boss gates. Outside Frenzy, Bosses still require explicit BATTLE input. It does not accelerate closed-app/offline simulation. Frenzy duration is itself a permanent-upgrade category.
- **Boss Ticket:** skips ordinary minion Floors and sends the Knight through the next **three Bosses in succession**, equivalent to advancing nine Floors through the normal three-Floor Boss cadence.

Both consumables can be acquired through progression/Ascension-era rewards. Exact historical duration, stat multipliers and reward quantities are closed-source calibration values.

## 7. Offline progression

Offline progression is logic simulation, not a hidden 3D scene.

- Offline combat advances at roughly one third of live progression speed.
- Ordinary Floors may complete offline.
- Offline progress stops after completing the minions on the next Boss Floor and reaching Boss Ready.
- A Boss is never started or defeated offline.
- No Boss equipment is awarded offline.
- Allowed Coin farming/settlement remains possible at the gate.

## 8. Knight Level and Ascension

Knight Level persists across Ascension and is the unlock authority for skills and runestones.

Ascension:

- unlocks from Floor 20 in the current run;
- returns active progression to Floor 1;
- resets Coins and run-local gear;
- retains Knight Level, unlocked/equipped skills and runestones;
- banks pending Tokens earned from Boss progression;
- retains previously banked Tokens and purchased permanent upgrades.

Tokens buy permanent upgrade categories such as damage, skill damage, Armor/HP, Coin gain, Token gain and offline Coin gain.

## 9. Save authority

The save stores durable gameplay identities and state, never SceneTree node paths:

- schema version;
- current and highest Floor;
- Boss Ready and completed encounter boundary;
- Coins, banked Tokens and pending Tokens;
- Knight Level/XP;
- three equipment slots, inventory, perks and unique effects;
- active skill/runestone loadout;
- permanent Token-upgrade levels;
- unused Frenzy Potion / Boss Ticket inventory and in-progress Boss-Ticket sequence;
- last-save timestamp for offline simulation.

The active Frenzy timer is intentionally not persisted: launch-era reports explicitly note that Frenzy does not work while the game is closed.

Live actors, navigation paths, animation timers, VFX and camera objects are reconstructed.

## 10. What is reskinned

Changed presentation:

- dungeon -> bright continuous floating landmass above clouds;
- original knight -> original grounded, moderately stylized sky-knight silhouette;
- original enemies -> original bright creature families;
- original UI art -> project-specific responsive HUD;
- original names, icons, audio and effects -> project-specific replacements.

Gameplay structure remains the reference loop.

## 11. Verification boundary

Publicly observable state transitions and interaction rules are the parity contract. Closed-source constants such as exact internal damage curves, RNG seeds/weights for every historical patch, every cooldown coefficient and values that were never publicly exposed cannot be claimed as extracted or literally identical.

Those hidden constants remain independent tuning data and require black-box calibration against surviving reference recordings/build evidence. This distinction is part of the acceptance contract, not a reason to replace known observable rules with simplified substitutes.


## 12. Evidence requirements for launch-line extensions

Launch existence alone is insufficient to define a runtime contract:

- Revive Potion requires June 2016 evidence for revive health, per-fight usage limits and presentation, in addition to documented existence and Boss-use purpose.
- Mystery/rewarded chests require launch-line evidence for spawn cadence and reward tables, in addition to documented existence. Ads or monetization need explicit scope authorization.

Post-1000 progression is not a launch-parity gap anymore; it is a deliberately deferred original-design phase.

