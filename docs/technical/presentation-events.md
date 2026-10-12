# Combat presentation events

The deterministic game core emits typed events after it accepts an implemented action or resolves a hit. The event stream is transient: it is not part of a save and cannot apply damage, move actors, grant objective credit, or change cooldowns. The renderer and Web Audio feedback subscribe as consumers; the state snapshot remains authoritative.

The current browser slice maps successful Whirl, Leap, and Void casts, basic attacks, hits, defeats, boss starts, and Floor clears to temporary character clips, simple ring effects, and short synthesized sound cues. `slam`, `slash`, and `clone` still emit no cast events because their gameplay effects are not implemented.

Character models and clips under `public/assets/cc0-test-set/` are temporary CC0 KayKit validation assets. Their provenance and included license texts are recorded next to the files. They are not approval of the final character art direction. Replacing them with production art does not require a gameplay change.
