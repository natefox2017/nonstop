# Contributing

This repository contains a runnable Gate 1 graybox using the approved **Three.js + React + TypeScript** browser stack. Blender is optional. The current runtime is deliberately limited to one primitive Floor template and its automated combat loop; it does not yet include production models or full equipment/progression systems.

Start with [README](README.md), [AGENTS](AGENTS.md), [core loop](docs/product/core-loop.md), [architecture](docs/technical/architecture.md) and [implementation gates](docs/technical/validation-plan.md).

## Changes

- Understand the actual current source and requirements before creating files or modifying interfaces.
- Work on the smallest complete task; prefer a maintained existing dependency over an unneeded custom system.
- Provide explicit behavior, constraints, error cases, acceptance and test plan for complex tasks. Do not rely on previous chats or the former repository.
- Use a dedicated branch/PR only when needed by collaboration or required checks. Respect the existing repository's actual rules; never bypass required review.
- There is no active Linear task board or GitHub Issue backlog in the clean repository. Do not recreate historic tasks or project boards unless the owner requests them.
- Keep Markdown for durable requirements, architecture and standards, not progress logs or TODO lists.

## Quality and asset use

Game mechanics must be deterministic and independently testable. Keep combat authority separate from React and Three.js. Test small portrait sizes and browser focus/resize behavior. Once there is executable code, run relevant tests and report exact results; do not claim a game can boot yet.

All repository text is English. Use original art, designs, sound and writing. External code/models/animations require known commercial-use, modification and distribution rights, provenance and attribution. Never import proprietary reference-game material. Add visual assets only after a representative tested slice and design review.

Run `npm test` for deterministic core-rule tests and `npm run build` for strict TypeScript plus the production Vite build. Verify gameplay in a browser; a successful build alone is not playable acceptance.
