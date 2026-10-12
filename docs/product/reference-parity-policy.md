# Reference Gameplay Parity Policy

Target for Floors **1-1000**: the original 2016 release line of **Nonstop Knight**. Floors above 1000 are a later original-design space; they may innovate when that phase is explicitly scheduled, but are not implemented during the current parity work.

This policy is authoritative for gameplay work until the project explicitly enters a later redesign phase.

## 1. No gameplay invention during the Floors 1-1000 parity phase

The no-invention rule applies to Floors 1-1000. Post-1000 content is explicitly reserved for a later design phase and must not leak backward into the reference-parity range.

Gameplay behavior within Floors 1-1000 must be one of:

1. directly documented by a launch-era source;
2. reproducible from surviving reference footage/build evidence;
3. required technical infrastructure that does not change player-visible rules.

Do not add quality-of-life mechanics, extra rewards, new combat rules, new progression systems, new Boss mechanics, custom drop guarantees, custom death rules or custom resource loops merely because they seem better.

If evidence is incomplete, keep the behavior isolated as calibration data and label it as unverified. Do not describe an estimate as an original-game fact.

## 2. Reference behavior has priority over prior project assumptions

When repository code, tests or docs disagree with verified reference behavior, the reference behavior wins.

Before changing a gameplay rule:

- search launch-era evidence;
- record whether the rule is verified or calibrated;
- update the parity regression when the observable contract changes;
- keep later-version systems out unless they are proven to belong to the 2016 target.

Pets, later live events, bounties and competitive systems are not part of the launch-line parity target.

## 3. Presentation may differ; gameplay may not

Allowed reskinning:

- dungeon -> floating landmass;
- project-specific character/enemy art;
- project-specific UI layout, icons, copy, VFX, audio and names;
- responsive portrait-only presentation across supported portrait aspect ratios.

The reskin must not change combat timing, progression gates, reward rules, equipment semantics, skill behavior, death/Ascension state transitions or offline boundaries.

## 4. Closed-source numbers are calibration data

Exact internal constants that are not publicly recoverable are not treated as design freedom.

Examples:

- damage/HP growth curves;
- exact skill coefficients and cooldowns;
- exact RNG weights;
- exact unlock levels when only partial milestones are observable;
- exact offline encounter timing.

These values should live in catalogs/configuration rather than being scattered through UI or presentation code. They may be replaced later by black-box measurements without changing the state machine.

## 5. Architecture for later changes

Keep these concerns separate:

- **reference rules:** Floor/Boss/death/Ascension/offline state transitions;
- **skill catalog:** skills, runestones, unlocks and coefficients;
- **equipment catalog:** slots, chests, rarities, perks and legendary effects;
- **calibration/tuning:** hidden numeric constants;
- **presentation:** art, HUD, animation, camera and floating-island theme.

Future gameplay changes should be introduced as an explicit post-parity profile or ruleset instead of silently modifying the reference profile.

## 6. Acceptance rule

A gameplay PR is not complete merely because it feels close.

It is complete only when:

- the change is supported by reference evidence or marked as calibration;
- parity regressions cover the observable behavior;
- natural playthrough regression still succeeds;
- persistence/offline regressions still succeed;
- supported portrait presentation still boots and renders across the regression sizes.

Until the project explicitly changes direction, **reference parity beats novelty**.

## Calibration boundary

The team must derive tuning values independently from permitted observations. Historical game-engine prototype numbers or unverified internet tables are **not** authoritative original-game constants. Store provisional values in a dedicated versioned catalog and test them against observable behavior.
