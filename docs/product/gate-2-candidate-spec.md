# Gate 2 Candidate Specification — Review Required

**Status: candidate only. This document is not approved product behavior and does not authorize implementing or shipping its unresolved mechanics or page design.** The source-of-truth requirements remain [core-loop.md](core-loop.md), [reference-gameplay-baseline.md](reference-gameplay-baseline.md), [reference-parity-policy.md](reference-parity-policy.md), and [hud-layout.md](hud-layout.md).

This sheet narrows the remaining Gate 2 decisions to the smallest records needed before building the skills/progression UI and runtime. It keeps established requirements and current behavior intact.

## Frozen requirements

- Exactly three skill slots with families Whirl/Slam, Leap/Slash, and Clone/Void.
- Five forms per skill, including `basic`, with stable skill and form IDs.
- Knight Level is the authority for skill/form unlocks.
- Equipping a different skill does not reset either skill's cooldown. Boss start refreshes the three equipped skills.
- Production page design requires review before implementation.

## Current implementation

- The core stores a loadout and six per-skill cooldowns. It accepts any member of the documented slot family; there is not yet a Knight Level unlock gate.
- Whirl, Leap, and Void still use the existing provisional graybox effects and values; version-1 saves migrate to version 2.
- The current battle HUD is not the approved production Skills page.

The current gate documents define these rules and families, but do not provide a six-skill effect catalog, a 30-form catalog, unlock thresholds, Knight XP rules, or a Skills-page design. The runtime intentionally leaves Slam, Slash, and Clone without cast effects; it does not invent unlock levels.

## Reference check and confidence

The repository's reference-baseline documents state the gameplay contract but do not attach direct evidence for every skill or unlock claim. A quick source check found two contemporaneous 2016 secondary articles with partial, non-identical descriptions:

- [Pocket Gamer, “What we can learn from the success of Nonstop Knight” (22 June 2016)](https://www.pocketgamer.biz/nonstop-knight/) describes six skills, selecting three, and five sub-versions unlocked through leveling. It does not provide the canonical 30 names, effects, cooldowns, or level thresholds.
- [GameSkinny, “Nonstop Knight: A Beginner's Guide” (12 June 2016)](https://www.gameskinny.com/tips/nonstop-knight-a-beginners-guide/) describes three broad skill archetypes: a spinning attack, a leaping slam, and a clone. It gives qualitative advice, not a complete six-skill catalog or exact tuning.
- A [2016 community discussion](https://www.reddit.com/r/nonstopknight/comments/4vt2es/best_skills/) mentions variants such as Stun Slam, Dash Slash, and Heal Clone, but it is player recollection and not canonical documentation.

These sources corroborate the broad structure, but they do not resolve the production behaviors. Treat them as research leads, not authority to promote guessed mechanics to parity rules. Prefer surviving first-game footage or a first-game build for exact behavior. Do not use *Nonstop Knight 2* references as a substitute.

## Smallest missing specification

| Area | Minimum needed to implement | Candidate default (not approved) |
| --- | --- | --- |
| Six base skills | Per-skill target selection, displacement, contact event, damage shape, control/summon behavior, duration, and Boss/minion interactions | Keep the existing Whirl/Leap/Void graybox behavior unchanged. Treat the article's spin, leap/slam, and clone descriptions only as broad hypotheses. Do not ship a guessed effect for the other three. |
| Thirty forms | Five stable IDs and concise effect deltas for each skill, plus which values are calibration | Each skill gets `basic` as form 1. Leave the remaining four IDs/effects unresolved until evidence or owner review. Do not invent rune names. |
| Unlock/growth | Starting Knight Level, XP award events and amounts, level curve/cap, and an unlock level for each skill/form | Preserve the existing Whirl/Leap/Void starting loadout. Keep thresholds absent rather than assigning placeholder levels to parity data. A debug-only all-unlocked catalog can be used for later QA if clearly separated from player progression. |
| Cooldowns | Six base cooldowns and exactly when cooldown starts; whether form modifiers affect it | Preserve current provisional Whirl 8s / Leap 10s / Void 14s values as graybox calibration only. Do not copy those numbers to Slam/Slash/Clone. Keep the implemented per-skill switching and Boss refresh rules. |
| Skills page | Page hierarchy, card contents, locked/equipped states, form selection, equip action, close/back behavior, focus and scroll behavior | Reuse existing HUD colors and touch-target constraints. Present one family at a time; show both choices and an explicit equipped/locked state; keep form details in the selected skill panel. Do not implement until a page board is reviewed. |

If no source can resolve a numeric value, the owner may approve a separately named provisional calibration profile. Such a profile must remain replaceable and must not be described as extracted historical behavior.

## Candidate Skills-page wireframe

This is a content hierarchy only, not a reviewed visual design:

```text
┌─────────────────────────────┐
│ Back                 SKILLS │
│ Knight Level · XP progress  │
│ [Whirl / Slam] [Leap / Slash] [Clone / Void]
│                             │
│ Selected skill              │
│ Icon · name · short effect  │
│ [Basic] [Form 2] … [Form 5] │
│ Cooldown · locked/equipped  │
│                    [EQUIP]  │
└─────────────────────────────┘
```

The wireframe intentionally omits exact copy, iconography, effect text, lock levels, form names, and confirmation behavior. Retain the product HUD requirements for accessible labels, visible non-color state, portrait scrolling and focus restoration. A design review should resolve the omitted pieces at 540×960 and 720×1280 before production implementation.

## Progression data boundary

The existing data contract already names the next durable fields: `runId`, `epoch`, `rulesetId`, Coins/Tokens, Knight Level/XP, inventory/equipped item IDs, skill forms, permanent upgrades, and consumables. The core loop further distinguishes run-local Coins/gear/pending Tokens from lifetime highest Floor, Knight Level/XP, banked Tokens, unlocks, and purchased upgrades.

Candidate grouping for a later schema (not a frozen serialization shape):

- **Run state:** run ID/epoch, current Floor and encounter, Coins, pending Tokens, equipped item IDs/inventory, reward checkpoint, and active skill/form selection.
- **Lifetime progression:** highest Floor, Knight Level/XP, banked Tokens, unlocked skills/forms/chest families, and permanent upgrade levels.
- **Consumables:** keep counts and in-progress accelerator state durable; decide their run/lifetime ownership from reference evidence before freezing the shape.
- **Ruleset identity:** ruleset/catalog versions so calibration and future migrations remain explicit.

No progression implementation should add empty placeholder fields without a consuming system. Before the next save-schema expansion, freeze the item/form ID catalogs, coin and XP award events, upgrade formulas, Token settlement policy, overflow bounds, and v2-to-v3 migration cases. The existing current/last-good atomic-write behavior and refusal of future schemas must remain unchanged.

## Acceptance after approval

1. Review the per-skill effect table and unlock/form matrix against first-game evidence or approve a labeled provisional profile.
2. Review the Skills-page board before React flow work.
3. Freeze the progression snapshot fields and migration before economy/reward systems write them.
4. Add deterministic tests for every selected skill/form, unlock boundary, cooldown carry-over, Boss refresh, and v2 save migration; then exercise the approved page and one complete Floor/Boss loop in portrait browsers.
