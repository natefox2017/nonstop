# Visual Direction

## Art statement

Nevercrest is a sunlit 3D fantasy adventure on a continuous floating landmass above a cloud sea. The art uses an original Pokémon-inspired chibi 3D adventure language: friendly compact silhouettes, oversized expressive heads, simplified anatomy, rounded forms, bright but controlled color blocks and clean readable materials. It must be feasible in Three.js with simple meshes, reusable materials and modest animation rigs. Avoid photorealism, excessive detail and enclosed dark dungeons. Pokémon characters, distinctive creatures, Poké Balls, logos and recognizable franchise assets are not permitted. The palette stays bright enough for automatic combat to be readable.

The reference game's assets, UI layout, icons, typography, characters, effects and level geometry are not production inputs.

## Core palette

| Token | Hex | Primary use |
| --- | --- | --- |
| Sky | `#73D7FF` | sky, information accent |
| Cloud | `#F3FBFF` | background, safe neutral |
| Panel | `#FFF7DF` | cards, HUD containers |
| Grass | `#8ADE63` | playable landmass top |
| Moss | `#3FAF66` | nature accent |
| Sun | `#FFD85A` | rewards, primary emphasis |
| Coral | `#FF776D` | danger, health loss, pause accent |
| Arcane | `#C98BFF` | magic and special states |
| Ink | `#26384A` | text and strong outlines |
| Cliff | `#755638` | landmass underside and structural edges |

These are design tokens, not a requirement that every texture use flat colors.

## 3D world language

- One Floor is one continuous, hand-authored floating landmass.
- The top surface uses broad color/value zones and clear route silhouettes.
- Cliff undersides taper into stylized rock forms; the edge must remain readable from the portrait camera.
- Trees, rocks and ruins use families with 3-5 variants, then rotate/scale only within authored prop sockets.
- Decorative branches may imply a wider world but never look like selectable progression routes.
- The protected path and combat arenas remain visually open enough for target acquisition, VFX and loot readability.
- Materials favor high roughness, restrained normal detail and limited transparency for mobile performance.

## Character language

- Hero silhouette reads at small portrait-gameplay scale.
- Use consistent chibi proportions (approximately 2.5–3.5 heads tall as an art-direction target, subject to camera readability), expressive heads and hands, and clear weapon/cloak silhouettes.
- Equipment changes must remain visible without requiring a new skeleton or controller.
- Enemies use clear family silhouettes and attack anticipation rather than texture-heavy detail.
- Hit feedback combines pose, small hit stop, directional VFX and concise audio; screen shake remains limited.

## UI language

- Rounded, friendly, compact panels with crisp iconography and readable touch targets; avoid copying Pokémon game UI compositions or icon designs.
- Interface surfaces follow the bright warm-panel/pale-blue-card/navy-ink/gold-frame semantic palette in the [HUD contract](hud-layout.md). World and VFX palette tokens above remain separate.
- High-contrast text and understated metallic accents that do not obscure the island.
- Large, separated skill buttons with icon, cooldown mask and optional numerical cooldown.
- No basic-attack button and no movement joystick.
- The central combat viewport remains mostly unobstructed.
- Minimum touch target: 96 × 96 px at the 1080 × 1920 baseline.
- Motion may use brief playful squash-and-stretch and expressive anticipation, while cooldowns, hit timing and gameplay authority remain unchanged.

See the [battle HUD coordinate contract](hud-layout.md).

## Effects and lighting

- Daylight is the default readability condition.
- One directional key light plus baked/ambient contribution is the baseline.
- Skill families have distinct shape/color signatures, but color alone is never the only differentiator.
- Transparent particles are short-lived and bounded to control overdraw.
- Bloom is subtle and never required to read a hit or reward.

## Review order

1. Black-and-white silhouette and camera readability.
2. Route, enemy and reward separation.
3. Palette consistency.
4. Material and lighting quality.
5. Secondary detail.

A polished model that fails portrait readability is rejected before detail production continues.
