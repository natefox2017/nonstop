# Browser Save, Offline and Recovery Contract

**Future design only:** no IndexedDB store or Web runtime exists in the current tree. Use a validated versioned **complete run snapshot** in IndexedDB, with last-known-good recovery metadata. Keep audio/locale preferences separate from gameplay state. The authoritative rules are [core loop](../product/core-loop.md); proposed state fields are in [data contracts](data-contracts.md).

## Atomic save contract

Persist Floor/encounter/Boss Ready, run ID and epoch, Coins, Tokens, Knight Level/XP, full inventory and equipped stable item IDs, three skills and runestones, permanent upgrades, consumables, RNG/tuning version and last committed clock timestamp. Never persist Three.js object references, actors, particle instances or navigation paths. Restore and validate inventory **before** offline settlement. Validate schema version and all IDs/numbers; a future or corrupt schema must **not** be overwritten by an older app. Migration operates on a copy and transactionally publishes a new valid snapshot, otherwise keeps the last-good snapshot.

Boss rewards: generate the eligible random chest once, assign a stable reward checkpoint ID, update inventory and next-Floor checkpoint, then **commit the whole snapshot before playing the chest animation**. Relaunching or duplicate input must not grant another item. Death and Ascension also save their post-transition checkpoint before presentation delays. Old-epoch timers/callbacks have no authority after run replacement. Block destructive progression after an unresolved write error, with visible retry/export/recovery.

## Offline settlement

Use a pure function of the complete validated snapshot, injected wall-clock time and versioned tuning. Clamp clock rollback to zero and bound implausibly long elapsed periods using an explicit tested policy; do not approximate hours by hidden WebGL combat. The reference pace is roughly one third of live encounters, but exact numbers require calibration.

Offline may complete normal Floors and the minions of the next Boss Floor to stop at **Boss Ready**. It must never start or defeat a Boss, award Boss equipment, or extend live Frenzy duration. Permanent Coin/offline bonuses are consistently applied through one rule path. On visibility resume, pause the live loop, settle at most once for the elapsed checkpoint, commit the new snapshot, then resume. Never award live and offline kills for the same time interval.

## Browser failure cases

- Mid-save crash/reload: IndexedDB transaction publishes all fields or none; verify last-good recovery.
- Quota/private mode/storage denied: show a durable warning, offer explicit export and safe import, do not silently delete data.
- Multiple tabs: use a tested revision/lease or allow one writer only. `BroadcastChannel` alone is not a transaction lock; reject stale writes.
- Invalid imported JSON: reject malformed values, duplicate inventory IDs, impossible Floor/kills, unknown items, nonfinite stats, huge payloads and new schemas without mutating prior storage.
- Clock tampering and refresh spamming: clamp and deduplicate settlement; document limitations of local single-player storage.
- Preferences: changing language/sound cannot change saved combat or cause additional offline rewards.

Cloud saves/accounts and native-device packaging are **not** assumed part of this first browser plan. Add them only from an independently approved issue with a security/privacy contract.

## Tests once implementation exists

Inject write failures at staging/commit, validate last-good recovery and incompatible versions, execute repeated reward/restart scenarios, test Boss Ready/offline and Ascension with zero pending Tokens, simulate tab focus races and cross-tab stale revisions, and verify selected gear and inventory survive a full browser restart. Static documentation checks cannot prove any of these.
