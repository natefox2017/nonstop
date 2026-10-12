# Portrait Battle UI and Input Contract

This is a **future runtime contract**, not evidence of an existing HUD. The owner approved portrait-only gameplay and a Three.js + React + TypeScript implementation, with responsive DOM layout over the Three.js canvas. No final page or flow should be implemented without its corresponding reviewed design board.

## Orientation, coordinate system and regions

- Portrait only; design reference 720 x 1280 logical units. Preserve usability across shorter and taller portrait ratios and desktop portrait windows such as 540 x 960. Do **not** claim CSS pixels equal device pixels or force a fixed DOM canvas.
- The 3D WebGL canvas can fill the container; React overlays own header, actions, bottom health/skills, modals and accessible focus. Compute a **normalized unobstructed battle rectangle** from measured DOM bounds and visual viewport safe areas; the camera uses it only for framing, not combat authority.
- Header: current Floor / 0–20 objectives, Coins/Tokens and access to Gear, Skills, Pause and eligible Ascend. Center: readable hero, targets, combat feedback and Boss readiness. Footer: hero HP and exactly three active skill buttons with icon, remaining cooldown and clear disabled/ready states.
- BAG/GEAR is a utility control, never a fourth skill. No virtual joystick or manual basic attack. Normal Floor transitions require no tap; Boss Ready requires BATTLE outside explicitly active accelerator flows.
- Responsive overlays must never hide Equip/Sell/Close, BATTLE, Ascend confirmation or Pause/Resume actions. Scroll inventory and details **inside** the modal rather than pushing critical actions below the viewport.

## Component and data boundaries

React reads an immutable or subscription-safe view model (HUD snapshot), dispatches typed commands and never directly mutates simulation state. Input from touches, pointer and keyboard maps to the same command IDs; loading screens and dialogs consume focus without leaking clicks into battle. Cooldown progress renders from simulation timestamps; it does not own the timer.

Camera/layout changes may pan/zoom/reframe to fit the usable battle rectangle, but **cannot teleport actors, alter target order, move route anchors or change saved objectives**. Keep at least one unobstructed hero/enemy reading at the supported smallest portrait size. Support browser zoom and `visualViewport` resize; CSS `env(safe-area-inset-*)` handles notches when available. A very narrow window should reflow or scroll utility UI instead of clipping interactions.

## Visual language and accessibility

The enduring [visual direction](visual-direction.md) specifies an original grounded stylized fantasy world with readable, high-contrast controls. Visual style guidance does **not** by itself approve a specific Web page design; review each page/flow before implementation. Require explicit review of each production page/flow, including Equipment, Skills, Boss, reward, Pause, Settings and Ascend confirmation.

At nominal 720 x 1280, start with 8–12 logical-unit gaps, restrained surface strokes and comfortably separated touch actions; prove sizing at final CSS/device scale. Provide visible text/shape feedback in addition to color for rarity, equipped, selection, cooldown and disabled states. Skill silhouettes remain distinct in grayscale. Text, item stats and long translated labels wrap without covering close/confirm controls. Modals have appropriate roles, focus trap/restore and Escape behavior where applicable.

## Acceptance

Review actual browser captures of battle, Gear/inventory, Skills, Boss Ready/fight, chest, Pause/Settings and Ascend at 540 x 960, 720 x 1280, short/tall portrait variants and zoom/safe-area cases. Test opening a dialog **before** resize as well as resizing while already open. Verify pointer/touch hit targets, keyboard focus, accessible names, camera/actor visibility, and no duplicated skill commands. Screenshots alone do not certify mobile GPU performance or native app packaging.
