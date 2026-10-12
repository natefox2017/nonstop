import { describe, expect, it } from "vitest";
import { chooseTarget, createInitialGameState, dispatchCommand, isAscensionEligible, stepGame } from "./core";
import { FLOOR_ONE, validateFloorTemplate } from "./floor";
import type { Enemy, GameState } from "./types";

function runUntil(state: GameState, predicate: (state: GameState) => boolean, limit = 20_000): GameState {
  let current = state;
  for (let tick = 0; tick < limit && !predicate(current); tick += 1) {
    current = stepGame(current).state;
    for (const skillId of ["whirl", "leap", "void"] as const) {
      current = dispatchCommand(current, { type: "cast-skill", skillId }).state;
    }
  }
  return current;
}

const enemy = (id: string, x: number, z: number): Enemy => ({
  id,
  kind: "goal",
  encounterId: "test-encounter",
  position: { x, z },
  health: 10,
  maxHealth: 10,
  attackTimer: 5,
});

describe("authored Floor and deterministic combat", () => {
  it("validates four ordered encounters with five unique goal IDs each", () => {
    expect(validateFloorTemplate(FLOOR_ONE)).toEqual([]);
    expect(FLOOR_ONE.encounters).toHaveLength(4);
    expect(FLOOR_ONE.encounters.flatMap((encounter) => encounter.goals)).toHaveLength(20);
  });

  it("uses distance first and stable ID ordering to break target ties", () => {
    const target = chooseTarget({ x: 0, z: 0 }, [enemy("goal-b", 1, 0), enemy("goal-a", -1, 0)]);
    expect(target?.id).toBe("goal-a");
  });

  it("gates Ascension on the current-run Floor 20 without requiring its clear", () => {
    expect(isAscensionEligible({ floorNumber: 19 })).toBe(false);
    expect(isAscensionEligible({ floorNumber: 20 })).toBe(true);
    expect(isAscensionEligible({ floorNumber: 1000 })).toBe(true);
    expect(isAscensionEligible({ floorNumber: 1 })).toBe(false);
  });

  it("counts one registered goal death once", () => {
    let state = createInitialGameState();
    state = {
      ...state,
      hero: { ...state.hero, position: { x: 0, z: 0 }, attackTimer: 0 },
      enemies: [{ ...enemy("goal-1-1", 0, 0), encounterId: "encounter-1" }],
    };
    const defeated = stepGame(state).state;
    expect(defeated.goalKills).toBe(1);
    expect(defeated.defeatedGoalIds).toEqual(["goal-1-1"]);
    expect(stepGame(defeated).state.goalKills).toBe(1);
  });

  it("does not credit an unregistered actor even when it is marked as a goal", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      hero: { ...initial.hero, position: { x: 0, z: 0 }, attackTimer: 0 },
      enemies: [enemy("foreign-goal", 0, 0)],
    };
    const result = stepGame(state);
    expect(result.state.goalKills).toBe(0);
    expect(result.events).toContainEqual({ type: "enemy-defeated", enemyId: "foreign-goal", isGoal: false });
  });

  it("clears a non-Boss Floor at exactly 20 and advances automatically", () => {
    const endOfFloor = runUntil(createInitialGameState(), (state) => state.phase === "floor-clear");
    expect(endOfFloor.phase).toBe("floor-clear");
    expect(endOfFloor.goalKills).toBe(20);
    expect(endOfFloor.defeatedGoalIds).toHaveLength(20);
    const next = runUntil(endOfFloor, (state) => state.floorNumber === 2);
    expect(next.floorNumber).toBe(2);
    expect(next.phase).toBe("exploring");
    expect(next.goalKills).toBe(0);
  });

  it("stops every third Floor at Boss Ready until an explicit BATTLE command", () => {
    const thirdFloor = runUntil(
      { ...createInitialGameState(), floorNumber: 3, highestFloor: 3 },
      (state) => state.phase === "boss-ready",
    );
    expect(thirdFloor.phase).toBe("boss-ready");
    expect(thirdFloor.goalKills).toBe(20);
    expect(thirdFloor.enemies).toHaveLength(0);
    const started = dispatchCommand(thirdFloor, { type: "start-boss" });
    expect(started.state.phase).toBe("boss-battle");
    expect(started.events).toContainEqual({ type: "boss-started", floorNumber: 3 });
  });

  it("retries a normal Floor from encounter one at 0/20 without lowering the high Floor", () => {
    const encounter = FLOOR_ONE.encounters[2];
    const goal = encounter?.goals[0];
    if (!encounter || !goal) throw new Error("Expected a registered goal in encounter three.");
    const initial = createInitialGameState();
    const dying: GameState = {
      ...initial,
      floorNumber: 4,
      highestFloor: 8,
      encounterIndex: 2,
      goalKills: 10,
      skillLoadout: { slot1: "slam", slot2: "slash", slot3: "clone" },
      defeatedGoalIds: FLOOR_ONE.encounters.slice(0, 2).flatMap((item) => item.goals.map((enemy) => enemy.id)),
      hero: { ...initial.hero, position: { ...goal.position }, health: 1, attackTimer: 10 },
      enemies: [{
        id: goal.id,
        kind: "goal",
        encounterId: encounter.id,
        position: { ...goal.position },
        health: 1000,
        maxHealth: 1000,
        attackTimer: 0,
      }],
    };

    const result = stepGame(dying);

    expect(result.events).toContainEqual({ type: "hero-died", floorNumber: 4 });
    expect(result.state).toMatchObject({ floorNumber: 4, highestFloor: 8, phase: "exploring", encounterIndex: 0, goalKills: 0 });
    expect(result.state.defeatedGoalIds).toEqual([]);
    expect(result.state.enemies).toEqual([]);
    expect(result.state.hero.health).toBe(result.state.hero.maxHealth);
    expect(result.state.skillLoadout).toEqual({ slot1: "slam", slot2: "slash", slot3: "clone" });
  });

  it("returns a lost Boss attempt to Boss Ready at 20/20 and allows an explicit retry", () => {
    const ready = runUntil(
      { ...createInitialGameState(), floorNumber: 3, highestFloor: 3 },
      (state) => state.phase === "boss-ready",
    );
    const started = dispatchCommand(ready, { type: "start-boss" }).state;
    const boss = started.enemies[0];
    if (!boss) throw new Error("Expected the Boss to start.");
    const dying: GameState = {
      ...started,
      hero: { ...started.hero, position: { ...boss.position }, health: 1, attackTimer: 10 },
      enemies: started.enemies.map((enemy) => ({ ...enemy, attackTimer: 0, health: 1000, maxHealth: 1000 })),
    };

    const lost = stepGame(dying);

    expect(lost.events).toContainEqual({ type: "hero-died", floorNumber: 3 });
    expect(lost.state).toMatchObject({ phase: "boss-ready", floorNumber: 3, goalKills: 20 });
    expect(lost.state.enemies).toEqual([]);
    expect(lost.state.defeatedGoalIds).toHaveLength(20);
    expect(lost.state.hero.health).toBe(lost.state.hero.maxHealth);
    expect(dispatchCommand(lost.state, { type: "start-boss" }).state.phase).toBe("boss-battle");
  });

  it("keeps cooldowns authoritative and rejects a second cast", () => {
    const state: GameState = {
      ...createInitialGameState(),
      enemies: [{ ...enemy("durable-target", 0, 0), health: 100, maxHealth: 100 }],
      hero: { ...createInitialGameState().hero, position: { x: 0, z: 0 } },
    };
    const first = dispatchCommand(state, { type: "cast-skill", skillId: "void" }).state;
    const second = dispatchCommand(first, { type: "cast-skill", skillId: "void" }).state;
    expect(first.skillCooldowns.void).toBeGreaterThan(0);
    expect(second.enemies[0]?.health).toBe(first.enemies[0]?.health);
  });

  it("switches skills only within their slot and preserves each skill cooldown", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      enemies: [{ ...enemy("durable-target", 0, 0), health: 100, maxHealth: 100 }],
      hero: { ...initial.hero, position: { x: 0, z: 0 } },
    };
    const cast = dispatchCommand(state, { type: "cast-skill", skillId: "whirl" }).state;
    const switched = dispatchCommand(cast, { type: "equip-skill", slot: "slot1", skillId: "slam" });
    expect(switched.state.skillLoadout.slot1).toBe("slam");
    expect(switched.state.skillCooldowns.whirl).toBeGreaterThan(0);
    expect(switched.state.skillCooldowns.slam).toBe(0);
    expect(switched.events).toContainEqual({ type: "skill-equipped", slot: "slot1", skillId: "slam" });
    expect(dispatchCommand(switched.state, { type: "cast-skill", skillId: "whirl" }).state).toBe(switched.state);
    expect(dispatchCommand(switched.state, { type: "equip-skill", slot: "slot2", skillId: "slam" }).state).toBe(switched.state);
    expect(dispatchCommand(switched.state, { type: "equip-skill", slot: "slot1", skillId: "whirl" }).state.skillCooldowns.whirl)
      .toBe(cast.skillCooldowns.whirl);
  });

  it("refreshes only the three equipped cooldowns when a Boss starts", () => {
    const ready = {
      ...createInitialGameState(),
      floorNumber: 3,
      highestFloor: 3,
      phase: "boss-ready" as const,
      goalKills: 20,
      defeatedGoalIds: FLOOR_ONE.encounters.flatMap((encounter) => encounter.goals.map((goal) => goal.id)),
      skillLoadout: { slot1: "slam" as const, slot2: "slash" as const, slot3: "clone" as const },
      skillCooldowns: { whirl: 8, slam: 5, leap: 7, slash: 4, clone: 3, void: 2 },
    };
    const started = dispatchCommand(ready, { type: "start-boss" }).state;
    expect(started.skillCooldowns).toEqual({ whirl: 8, slam: 0, leap: 7, slash: 0, clone: 0, void: 2 });
  });

  it("does not invent effects for catalog skills without an implemented effect", () => {
    const initial = createInitialGameState();
    const selected = dispatchCommand(initial, { type: "equip-skill", slot: "slot1", skillId: "slam" }).state;
    const withTarget = {
      ...selected,
      enemies: [{ ...enemy("durable-target", 0, 0), health: 100, maxHealth: 100 }],
      hero: { ...selected.hero, position: { x: 0, z: 0 } },
    };
    const result = dispatchCommand(withTarget, { type: "cast-skill", skillId: "slam" });
    expect(result.state.skillCooldowns.slam).toBe(0);
    expect(result.state.enemies[0]?.health).toBe(100);
  });
});
