# Interface Localization Contract

The original project planned English and Simplified Chinese. The **initial browser implementation defaults to English**, independent of OS locale; Simplified Chinese (`zh_CN`) remains a supported design target for a separately scoped localization milestone. Do not invent a new language picker on the first-release UI without an approved page/flow.

Keep stable gameplay identities (`floor`, `skill_id`, `rune_id`, `item_id`, `rarity`) language-neutral. Translate only visible strings from an externalized catalog, including dynamic/plural templates, equipment stats, Boss readiness, error/recovery text and accessibility labels. Locale must not change damage, drops, cooldown or save schema.

If a locale choice is enabled later, persist it in separate UI preferences from the gameplay run, apply it without reloading/settling the run, and fall back to English when missing or unsupported. A failed preference write must preserve the last valid preference, explain the error and leave the active session usable.

Use appropriately licensed, bundled or audited-font sources with known Chinese glyph coverage; do not rely exclusively on the host OS font. Verify real portrait first-open, switch, relaunch, resize, truncation and numeric formatting cases in both languages before announcing localization complete. No translation catalogs, browser font bundles or localized runtime have been implemented yet.
