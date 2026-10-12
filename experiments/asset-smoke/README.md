# Native glTF and animation smoke test

This isolated page checks the repository's existing Three.js stack with temporary CC0 KayKit assets. It is not used by the game, reads no `GameStore` state, changes no gameplay, and should not be treated as an art approval or production model decision.

Run `npm run dev` and open `/experiments/asset-smoke.html`. The page loads one Knight and two Barbarian instances, with idle, movement, combat, hit and death actions from the matching Rig_Medium animation sets. Root translation tracks are excluded so GameCore remains the sole authority for actor position. Click the animation buttons to exercise action transitions; each target is controlled independently.

The browser smoke check should confirm three independent 23-bone rigs, 48 imported animation clips, actual skinned-vertex deformation when an action changes, unchanged other actor instances and actor root positions, and a clean unmount with the canvas removed.

## Dependency decision

The lockfile's `three@0.186.1` is inside `three.quarks@0.17.1`'s declared `three >=0.182.0` peer range. The package is MIT-licensed. This experiment uses Three's built-in `GLTFLoader`, `AnimationMixer` and `SkeletonUtils.clone`; it does not need the particle-only three.quarks package, so no dependency was added.

## Asset provenance

All model and animation files in `assets/` are test-only extracts from the creator's free tiers. The original KayKit Itch pages identify both packs as CC0; each source archive also ships its own `License.txt`.

- Character pack: [KayKit - Character Pack: Adventurers](https://kaylousberg.itch.io/kaykit-adventurers), Free 2.0.
- Animation pack: [KayKit - Character Animations](https://kaylousberg.itch.io/kaykit-character-animations), Free 1.1.
- This experiment uses `Knight.glb`, `Barbarian.glb`, `Rig_Medium_General.glb`, `Rig_Medium_MovementBasic.glb`, and `Rig_Medium_CombatMelee.glb`.
- The license files are copied alongside the test assets. No paid tier or extra package was used.

## Limits

This is import/rig/animation plumbing evidence. The palette and presentation are only harness UI, not approved game art. The game currently exposes no skill-activation presentation event, so this page does not invent skill VFX or route animations into combat. No model is connected to combat movement, hit resolution, death, or save state.

Baseline checks on this branch: `npm test` passes 20 tests; `npm run build` succeeds with the existing 568.74 kB renderer-chunk warning. The small type-only fix in `src/game/core.test.ts` keeps the ascension eligibility fixture compatible with its declared `Pick<GameState, "floorNumber">` input.
