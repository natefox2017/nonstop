# Nevercrest Product Brief

## Product statement

Nevercrest is a single-player, 3D auto-combat action RPG built around the original 2016 Nonstop Knight progression loop. It targets portrait only. The planned layout uses a 720 x 1280 portrait design coordinate system and responsive scaling; exact browser launch dimensions will be verified after the runtime stack is selected. The hero continuously moves, targets and performs basic melee attacks. The player makes high-value decisions through three active skills, equipment choices, boss attempts and Ascension.

The mechanical benchmark is deliberate. The implementation, source code, characters, names, dialogue, UI composition, icons, audio, level geometry, balance tables and all shipped art are original project work.

## Player promise

- Open the game and immediately watch meaningful progress.
- Make a small number of readable decisions instead of steering every attack.
- Trigger satisfying skills at the right moment.
- Replace gear often and feel visible power growth.
- Return after time away to collect progress without allowing offline play to defeat bosses.
- Use portrait screens of different sizes without losing essential controls or the active character from view.

## Frozen gameplay baseline

1. The hero automatically seeks reachable goal enemies.
2. The hero automatically approaches and performs basic melee attacks.
3. The player equips exactly three active skills, one from each skill family.
4. A normal Floor requires exactly 20 goal-minion kills.
5. Every third Floor becomes Boss Ready after its 20 goal kills.
6. Boss fights require explicit BATTLE outside player-activated live Frenzy/Boss-Ticket accelerator flows; offline simulation never starts them.
7. Offline simulation may clear normal Floors and reach Boss Ready, but never defeats a Boss.
8. Gameplay equipment has three slots: Weapon, Armor and Cloak.
9. Ascension becomes available after reaching Floor 20 in the current run. Exact reward and economy values remain tuning data.
10. The run returns automatically to forward progression after combat, skill use, rewards and ordinary Floor transitions.

See [core-loop.md](core-loop.md) for the state contract.

## Original presentation direction

- World: large, continuous floating landmasses above a cloud sea rather than underground dungeons.
- Art: original Pokémon-inspired chibi 3D adventure aesthetic, with rounded stylized characters, expressive silhouettes, bright outdoor floating islands, simple materials and animation-friendly geometry suited to Three.js. No franchise characters, creatures, logos or copied assets.
- UI: friendly rounded original adventure HUD with controlled accents, clear iconography and large touch targets; all gameplay controls and behavior stay unchanged.
- Map structure: one authored landmass per Floor template, one protected main route, no world-map route choice.
- Orientation: portrait only, with responsive portrait sizing over the future renderer and DOM overlay. Development defaults to a 540x960 window and 720x1280 logical canvas.

See [visual-direction.md](visual-direction.md) and [hud-layout.md](hud-layout.md).

## First commercial-risk test

The first meaningful build is one complete playable Floor on a representative authored floating-landmass Floor. It must prove automatic travel/targeting/basic attacks, readable enemy hit/death feedback, four ordered encounters and exactly 20 goal kills, three representative active skills, responsive battle UI, Floor-clear/save-resume behavior, and stable performance in representative portrait browsers. Device and GPU constraints require measured evidence once a runtime exists.

Final hero art, a large equipment catalog and multiple biomes do not block this test. The repo currently contains only specifications; this describes future acceptance, not an already playable build. See the [validation plan](../technical/validation-plan.md) and the linked Linear/GitHub acceptance evidence.

## Scope discipline

The following remain outside the first complete core-loop release unless separately approved:

- PvP, guilds or online co-op;
- pets, live events, bounties or battle passes;
- shops, ads or in-app purchases;
- procedural terrain generation or branching world-map choices;
- a broad cosmetic catalog;
- backend services that are not required by a measured product need.

The product earns additional systems only after the complete Floor loop is playable, measurable and performant.
