# Browser Save, Offline and Recovery Contract

The current runtime saves one complete version-1 `GameState` in IndexedDB (`nevercrest-save` / `snapshots`). The `current` and `last-good` records are written in one read-write transaction, about once per second and immediately on commands and phase changes. A valid current snapshot wins; if it is missing or invalid and a valid same-schema `last-good` exists, load reports recovery and resumes from that snapshot. The invalid current record is copied to `quarantined-current` in the same transaction as the next save. A future schema is never replaced or recovered over, and a failed transaction rolls back both current and last-good writes. Keep audio/locale preferences separate from gameplay state. The broader target rules are in [core loop](../product/core-loop.md); implemented fields are in [data contracts](data-contracts.md).

## Atomic save contract

The first-slice snapshot stores Floor/encounter/Boss Ready state, goal IDs, Hero/enemy simulation values, cooldowns, elapsed time and pause state; it never stores Three.js objects, particles or paths. The target progression snapshot adds run IDs/epochs, Coins, Tokens, Knight Level/XP, inventory, skill forms, permanent upgrades and consumables. The current adapter validates every implemented field before restore, keeps one prior valid snapshot, quarantines a damaged current record on its next successful replacement, and refuses future schema versions. Migrations and validation for future progression fields are still required.

Boss rewards: generate the eligible random chest once, assign a stable reward checkpoint ID, update inventory and next-Floor checkpoint, then **commit the whole snapshot before playing the chest animation**. Relaunching or duplicate input must not grant another item. Death and Ascension also save their post-transition checkpoint before presentation delays. Old-epoch timers/callbacks have no authority after run replacement. Block destructive progression after an unresolved write error, with visible retry/export/recovery.

## Offline settlement

Offline settlement is not present in the current runtime. Its absence means a closed or background tab grants no simulated progress. The future contract is a pure function of the complete validated snapshot, injected wall-clock time and versioned tuning. Clamp clock rollback to zero and bound implausibly long elapsed periods using an explicit tested policy; do not approximate hours by hidden WebGL combat. The reference pace is roughly one third of live encounters, but exact numbers require calibration.

Offline may complete normal Floors and the minions of the next Boss Floor to stop at **Boss Ready**. It must never start or defeat a Boss, award Boss equipment, or extend live Frenzy duration. Permanent Coin/offline bonuses are consistently applied through one rule path. On visibility resume, pause the live loop, settle at most once for the elapsed checkpoint, commit the new snapshot, then resume. Never award live and offline kills for the same time interval.

## Browser failure cases

- Mid-save crash/reload: IndexedDB transaction publishes current and last-good fields all at once or none; automated storage tests cover transaction rollback, recovery and damaged-record quarantine. Browser restart verification remains required as the application expands its saved progression domains.
- Quota/private mode/storage denied: show a durable warning, offer explicit export and safe import, do not silently delete data.
- Multiple tabs: use a tested revision/lease or allow one writer only. `BroadcastChannel` alone is not a transaction lock; reject stale writes.
- Invalid imported JSON: reject malformed values, duplicate inventory IDs, impossible Floor/kills, unknown items, nonfinite stats, huge payloads and new schemas without mutating prior storage.
- Clock tampering and refresh spamming: clamp and deduplicate settlement; document limitations of local single-player storage.
- Preferences: changing language/sound cannot change saved combat or cause additional offline rewards.

Cloud saves/accounts and native-device packaging are **not** assumed part of this first browser plan. Add them only from an independently approved issue with a security/privacy contract.

## Tests once implementation exists

Inject write failures at staging/commit, validate last-good recovery and incompatible versions, execute repeated reward/restart scenarios, test Boss Ready/offline and Ascension with zero pending Tokens, simulate tab focus races and cross-tab stale revisions, and verify selected gear and inventory survive a full browser restart. Static documentation checks cannot prove any of these.
