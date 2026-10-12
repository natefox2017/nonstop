import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInitialGameState } from "../game/core";
import { gameStore } from "../game/store";
import { App } from "./App";

vi.mock("../game/store", () => ({
  gameStore: {
    subscribe: vi.fn(() => () => {}),
    subscribeStatus: vi.fn(() => () => {}),
    getSnapshot: vi.fn(),
    getStatus: vi.fn(() => "Autosave ready"),
  },
}));

function render(state = createInitialGameState()) {
  vi.mocked(gameStore.getSnapshot).mockReturnValue(state);
  return renderToStaticMarkup(createElement(App));
}

function skillButtons(markup: string) {
  return [...markup.matchAll(/<button class="skill-button[^>]+>/g)].map(([button]) => button);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(gameStore.getStatus).mockReturnValue("Autosave ready");
});

describe("approved raster HUD", () => {
  it("uses the three supplied artworks in semantic buttons", () => {
    const markup = render();
    expect(skillButtons(markup)).toHaveLength(3);
    for (const id of ["whirl", "leap", "void"]) {
      expect(markup).toContain(`/assets/hud/skill-${id}-ready-v1.png`);
    }
    expect(markup).not.toContain("skill-mark");
    expect(markup).not.toContain("ACTIVE SKILLS");
  });

  it("shows real cooldown text and disables only the cooling skill during combat", () => {
    const state = createInitialGameState();
    state.enemies = [{ id: "goal", kind: "goal", encounterId: "encounter-1", position: { x: 0, z: 0 }, health: 100, maxHealth: 100, attackTimer: 1 }];
    state.skillCooldowns.whirl = 2.2;
    const markup = render(state);
    const [whirl, leap, voidSkill] = skillButtons(markup);
    expect(whirl).toContain('disabled=""');
    expect(leap).not.toContain('disabled=""');
    expect(voidSkill).not.toContain('disabled=""');
    expect(markup).toContain("Whirl. 2.2s");
    expect(markup).toContain('skill-cooldown-value">3s');
    expect(markup).toContain("skill-cooldown-mask");
  });

  it("disables skills while paused, out of combat, or without a target", () => {
    for (const phase of ["exploring", "boss-ready", "floor-clear"] as const) {
      const state = createInitialGameState();
      state.phase = phase;
      expect(skillButtons(render(state)).every((button) => button.includes('disabled=""'))).toBe(true);
    }
    const state = createInitialGameState();
    state.paused = true;
    state.enemies = [{ id: "goal", kind: "goal", encounterId: "encounter-1", position: { x: 0, z: 0 }, health: 100, maxHealth: 100, attackTimer: 1 }];
    expect(skillButtons(render(state)).every((button) => button.includes('disabled=""'))).toBe(true);
  });

  it("shows the independent BATTLE action only at Boss Ready", () => {
    expect(render()).not.toContain('class="battle-button"');
    const state = createInitialGameState();
    state.floorNumber = 3;
    state.goalKills = 20;
    state.phase = "boss-ready";
    const markup = render(state);
    expect(markup).toContain('/assets/hud/battle-button-blank-v1.png');
    expect(markup).toContain('<span>BATTLE</span>');
    expect(markup.indexOf('class="battle-button"')).toBeLessThan(markup.indexOf('class="skill-row"'));
    state.paused = true;
    expect(render(state)).toContain('class="battle-button" disabled=""');
    state.phase = "boss-battle";
    expect(render(state)).not.toContain('class="battle-button"');
  });

  it("derives the four encounter markers and health fill from authoritative state", () => {
    const state = createInitialGameState();
    state.goalKills = 7;
    state.hero.health = 25;
    const markup = render(state);
    const diamonds = [...markup.matchAll(/<img[^>]+src="([^"]*encounter-diamond[^"]+)"/g)].map((match) => match[1]);
    expect(diamonds).toHaveLength(4);
    expect(diamonds.filter((src) => src.endsWith("-active-v1.png"))).toHaveLength(1);
    expect(markup).toContain('class="objective" data-wide-floor="false" role="group" aria-label="Floor 1. 7 of 20 goals defeated. 1 of 4 encounters cleared."');
    expect(markup).toContain("clip-path:inset(0 75% 0 0)");
  });

  it("uses numeric overlay plates and state-specific pause artwork", () => {
    const state = createInitialGameState();
    state.floorNumber = 1000;
    expect(render(state)).toContain('class="floor-number" data-wide="true">1000');
    expect(render(state)).toContain('/assets/hud/progress-backplate-blank-v1.png');
    expect(render(state)).toContain('/assets/hud/pause-button-v1.png');
    state.paused = true;
    expect(render(state)).toContain('/assets/hud/resume-button-v1.png');
    expect(render(state)).toContain('aria-label="Resume battle"');
  });

  it("keeps persistence failures visible despite the minimal HUD", () => {
    vi.mocked(gameStore.getStatus).mockReturnValue("Browser storage is unavailable.");
    expect(render()).toContain('class="save-warning" role="status">Browser storage is unavailable.');
  });

  it("retains health semantics and audio/pause controls", () => {
    const markup = render();
    expect(markup).toContain('role="meter" aria-label="Hero health"');
    expect(markup).toContain('aria-label="Audio feedback"');
    expect(markup).toContain('aria-label="Pause battle"');
  });
});
