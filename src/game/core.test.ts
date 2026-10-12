import { describe, expect, it } from "vitest";
import { chooseTarget, createInitialGameState, dispatchCommand, stepGame } from "./core";
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
});
