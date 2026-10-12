# Future Asset Production Plan

The runtime contains temporary CC0 KayKit character and animation GLBs in `public/assets/cc0-test-set/`. `Knight.glb` and `Barbarian.glb` each embed one PNG character texture. Three separate GLBs provide general, movement and melee clips on a shared rig; they contain no image textures. These are validation assets, not approved production art. The map has no imported world models or authored terrain textures: Three.js builds the island, route, rings, stones, and static cloud puffs from procedural geometry. Blender is useful for bespoke meshes, UVs, rigging, animation and repairing imported assets, but is **not mandatory** for this game. Use commercially permitted existing glTF assets and simple geometry before commissioning unique meshes. Target an original chibi adventure look with rounded low-complexity silhouettes, simplified materials, expressive short animation clips and shared modular equipment attachments. Do not reuse recognizable Pokémon designs or franchise assets.

## Sequence and gates

1. Freeze the portrait camera, scale, level route, actor movement, animation events and approved chibi style with a functioning primitive graybox of one Floor. Validate oversized-head silhouettes, visibility of gear and skill effects at gameplay scale.
2. Integrate exactly one representative original/licensed hero, one enemy, one island section/prop and a tiny animation set (`idle`, `run`, `attack`, `hit`, `death`). Test them in the actual browser viewport.
3. Once readable and performant, author the Boss, remaining enemies, equipment variants, skill VFX and UI icons in small integrated batches. No requirement to draw all models before programming.
4. Before expanding a large catalog, freeze visual identity, GLB export rules, skeleton/attachment points, source rights and real frame-time/texture budgets.

**Procedural Three.js:** use for test grounds, arena markers, simple rocks, basic props, collision proxies and particle effects. **Blender or another mesh editor:** use for authored hero/enemy geometry, special islands, unique weapons, skinning/retargeting, UV/material fixes and complex motion. **Reuse:** prioritize mature open-source or licensed source assets with verified commercial modification/redistribution rights. Never copy or extract proprietary 2016 Nonstop Knight assets, icons, audio, UI layouts or level meshes.

## GLB/glTF export contract

Use glTF 2.0 binary (`.glb`) for runtime; verify meters, origins, Y-up world conversion from Blender's Z-up authoring environment, scale, materials and actual imported animation names. Character locomotion is gameplay-authoritative; root motion should not move a hero twice. Keep named weapon/cloak/armor attachment nodes stable and support replacing meshes without rewriting combat.

Visible GLB scene geometry is **not** the source of truth for walkable ground, pathfinding, goals or collision. Author a separate Floor template navigation contract and test coordinate parity. Three.js `GLTFLoader` and `AnimationMixer` handle supported loading/clips; do not write proprietary importers.

## Rights, storage and performance

For every asset store ID, author/source URL, explicit license and attribution, acquisition/version, permitted commercial use and redistributions, editable source path, exported GLB hash, changes and approval link. Choose binary/LFS policy when production assets are actually introduced. Reject ambiguous rights or irreproducible source. Generated art requires source/terms verification too.

Start with shared materials, instancing repeated props, bounded alpha particles, concise textures and measured GPU memory/frame time. Profile representative mobile browsers **before** fixing polygon/texture budgets. Build fallbacks for missing GLB/compressed textures and context loss; placeholder art must not silently change gameplay.

React/CSS draws panels and control states. Artwork for six skills, gear and UI must be reviewed together at **actual** on-screen dimensions, with cooldown masks and grayscale readability, after a page/flow design is approved. Use Three.js for VFX trails, flashes, hit particles and light changes; these effects consume gameplay events and never grant damage or rewards on their own.
