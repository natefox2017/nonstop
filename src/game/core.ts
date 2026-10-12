import { FLOOR_ONE } from "./floor";
import { GRAYBOX_TUNING } from "./tuning";
import type { Enemy, GameCommand, GameEvent, GameState, Point2, SkillId, SkillSlot, StepResult } from "./types";

const STEP = 1 / 30;
const EPSILON = 0.0001;
const SKILL_FAMILIES: Record<SkillSlot, readonly SkillId[]> = {
  slot1: ["whirl", "slam"],
  slot2: ["leap", "slash"],
  slot3: ["clone", "void"],
};

function slotForSkill(skillId: SkillId): SkillSlot {
  if (SKILL_FAMILIES.slot1.includes(skillId)) return "slot1";
  if (SKILL_FAMILIES.slot2.includes(skillId)) return "slot2";
  return "slot3";
}

function distance(a: Point2, b: Point2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function moveToward(from: Point2, to: Point2, amount: number): Point2 {
  const length = distance(from, to);
  if (length <= amount || length <= EPSILON) return { ...to };
  const ratio = amount / length;
  return { x: from.x + (to.x - from.x) * ratio, z: from.z + (to.z - from.z) * ratio };
}

function spawnGoals(encounterIndex: number): Enemy[] {
  const encounter = FLOOR_ONE.encounters[encounterIndex];
  if (!encounter) return [];
  return encounter.goals.map((goal) => ({
    id: goal.id,
    kind: "goal",
    encounterId: encounter.id,
    position: { ...goal.position },
    health: goal.maxHealth,
    maxHealth: goal.maxHealth,
    attackTimer: 0.5,
  }));
}

export function createInitialGameState(): GameState {
  const start = FLOOR_ONE.route[0] ?? { x: -17, z: -5 };
  return {
    schemaVersion: 2,
    floorNumber: 1,
    highestFloor: 1,
    phase: "exploring",
    encounterIndex: 0,
    goalKills: 0,
    hero: { position: { ...start }, health: 100, maxHealth: 100, attackTimer: 0 },
    enemies: [],
    defeatedGoalIds: [],
    skillLoadout: { slot1: "whirl", slot2: "leap", slot3: "void" },
    skillCooldowns: { whirl: 0, slam: 0, leap: 0, slash: 0, clone: 0, void: 0 },
    elapsedSeconds: 0,
    floorClearTimer: 0,
    paused: false,
  };
}

/** Reachable distance is straight-line on this unobstructed authored prototype route. */
export function chooseTarget(position: Point2, enemies: readonly Enemy[]): Enemy | undefined {
  return enemies
    .filter((enemy) => enemy.health > 0)
    .slice()
    .sort((a, b) => distance(position, a.position) - distance(position, b.position) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
}

function clearFloor(state: GameState, events: GameEvent[]): void {
  state.phase = "floor-clear";
  state.enemies = [];
  state.floorClearTimer = GRAYBOX_TUNING.floorTransitionSeconds;
  events.push({ type: "floor-cleared", floorNumber: state.floorNumber });
}

function advanceFloor(state: GameState): GameState {
  const floorNumber = state.floorNumber + 1;
  return {
    ...createInitialGameState(),
    floorNumber,
    highestFloor: Math.max(floorNumber, state.highestFloor),
    elapsedSeconds: state.elapsedSeconds,
    paused: state.paused,
  };
}

function defeatEnemy(state: GameState, enemy: Enemy, events: GameEvent[]): void {
  state.enemies = state.enemies.filter((candidate) => candidate.id !== enemy.id);
  const encounter = FLOOR_ONE.encounters[state.encounterIndex];
  const isRegisteredGoal = enemy.kind === "goal"
    && encounter?.id === enemy.encounterId
    && encounter.goals.some((goal) => goal.id === enemy.id);
  events.push({ type: "enemy-defeated", enemyId: enemy.id, isGoal: isRegisteredGoal });
  if (isRegisteredGoal && !state.defeatedGoalIds.includes(enemy.id)) {
    state.defeatedGoalIds.push(enemy.id);
    state.goalKills += 1;
  }
  if (enemy.kind === "boss") {
    clearFloor(state, events);
    return;
  }
  if (state.goalKills === 20) {
    if (state.floorNumber % 3 === 0) {
      state.phase = "boss-ready";
      state.enemies = [];
      events.push({ type: "boss-ready", floorNumber: state.floorNumber });
    } else {
      clearFloor(state, events);
    }
  }
}

function applyDamage(state: GameState, enemy: Enemy, damage: number, events: GameEvent[], source: "basic" | "whirl" | "leap" | "void"): void {
  const current = state.enemies.find((candidate) => candidate.id === enemy.id);
  if (!current || current.health <= 0 || damage <= 0) return;
  current.health = Math.max(0, current.health - damage);
  events.push({ type: "enemy-hit", enemyId: current.id, damage, healthAfter: current.health, source, position: { ...current.position } });
  if (current.health === 0) defeatEnemy(state, current, events);
}

export function dispatchCommand(state: GameState, command: GameCommand): StepResult {
  if (command.type === "toggle-pause") {
    return { state: { ...state, paused: !state.paused }, events: [] };
  }
  if (state.paused) return { state, events: [] };

  if (command.type === "equip-skill") {
    if (!SKILL_FAMILIES[command.slot]?.includes(command.skillId)) return { state, events: [] };
    if (state.skillLoadout[command.slot] === command.skillId) return { state, events: [] };
    return {
      state: { ...state, skillLoadout: { ...state.skillLoadout, [command.slot]: command.skillId } },
      events: [{ type: "skill-equipped", slot: command.slot, skillId: command.skillId }],
    };
  }

  if (command.type === "start-boss") {
    if (state.phase !== "boss-ready" || state.floorNumber % 3 !== 0) return { state, events: [] };
    const boss: Enemy = {
      id: `boss-${state.floorNumber}`,
      kind: "boss",
      encounterId: `boss-arena-${state.floorNumber}`,
      position: { ...FLOOR_ONE.bossArena },
      health: GRAYBOX_TUNING.bossHealth,
      maxHealth: GRAYBOX_TUNING.bossHealth,
      attackTimer: 1.2,
    };
    return {
      state: {
        ...state,
        phase: "boss-battle",
        enemies: [boss],
        skillCooldowns: {
          ...state.skillCooldowns,
          [state.skillLoadout.slot1]: 0,
          [state.skillLoadout.slot2]: 0,
          [state.skillLoadout.slot3]: 0,
        },
      },
      events: [{ type: "boss-started", floorNumber: state.floorNumber }],
    };
  }

  if (state.skillLoadout[slotForSkill(command.skillId)] !== command.skillId) return { state, events: [] };
  const skill = GRAYBOX_TUNING.skills[command.skillId as keyof typeof GRAYBOX_TUNING.skills];
  if (!skill) return { state, events: [] };
  const remaining = state.skillCooldowns[command.skillId];
  if (state.phase !== "exploring" && state.phase !== "boss-battle") return { state, events: [] };
  if (remaining > 0) return { state, events: [] };
  const target = chooseTarget(state.hero.position, state.enemies);
  if (!target) return { state, events: [] };

  const next: GameState = {
    ...state,
    hero: { ...state.hero, position: { ...state.hero.position } },
    enemies: state.enemies.map((enemy) => ({ ...enemy, position: { ...enemy.position } })),
    skillCooldowns: { ...state.skillCooldowns, [command.skillId]: skill.cooldownSeconds },
    defeatedGoalIds: [...state.defeatedGoalIds],
  };
  const events: GameEvent[] = [];
  const heroFrom = { ...next.hero.position };
  if (command.skillId === "leap") {
    next.hero.position = moveToward(next.hero.position, target.position, 4.2);
  }
  const origin = command.skillId === "leap" ? target.position : next.hero.position;
  const affectedEnemyIds: string[] = [];
  for (const enemy of [...next.enemies]) {
    const inRange = command.skillId === "void"
      ? enemy.id === target.id
      : distance(origin, enemy.position) <= skill.radius;
    if (inRange) {
      affectedEnemyIds.push(enemy.id);
      applyDamage(next, enemy, skill.damage, events, command.skillId as "whirl" | "leap" | "void");
    }
  }
  events.unshift({ type: "skill-cast", skillId: command.skillId as "whirl" | "leap" | "void", heroFrom, heroTo: { ...next.hero.position }, targetId: target.id, affectedEnemyIds });
  return { state: next, events };
}

export function stepGame(state: GameState, deltaSeconds = STEP): StepResult {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return { state, events: [] };
  if (state.paused) return { state, events: [] };

  const dt = Math.min(deltaSeconds, 0.1);
  const next: GameState = {
    ...state,
    hero: { ...state.hero, position: { ...state.hero.position } },
    enemies: state.enemies.map((enemy) => ({ ...enemy, position: { ...enemy.position } })),
    skillCooldowns: {
      whirl: Math.max(0, state.skillCooldowns.whirl - dt),
      slam: Math.max(0, state.skillCooldowns.slam - dt),
      leap: Math.max(0, state.skillCooldowns.leap - dt),
      slash: Math.max(0, state.skillCooldowns.slash - dt),
      clone: Math.max(0, state.skillCooldowns.clone - dt),
      void: Math.max(0, state.skillCooldowns.void - dt),
    },
    defeatedGoalIds: [...state.defeatedGoalIds],
    elapsedSeconds: state.elapsedSeconds + dt,
  };
  const events: GameEvent[] = [];

  if (next.phase === "floor-clear") {
    next.floorClearTimer -= dt;
    if (next.floorClearTimer <= 0) return { state: advanceFloor(next), events };
    return { state: next, events };
  }

  if (next.phase === "boss-ready") return { state: next, events };

  if (next.phase === "exploring" && next.enemies.length === 0) {
    const encounter = FLOOR_ONE.encounters[next.encounterIndex];
    if (!encounter) return { state: next, events };
    if (distance(next.hero.position, encounter.center) > 0.7) {
      next.hero.position = moveToward(next.hero.position, encounter.center, GRAYBOX_TUNING.heroSpeed * dt);
    } else {
      next.enemies = spawnGoals(next.encounterIndex);
    }
    return { state: next, events };
  }

  const target = chooseTarget(next.hero.position, next.enemies);
  if (!target) return { state: next, events };
  const targetDistance = distance(next.hero.position, target.position);
  if (targetDistance > GRAYBOX_TUNING.meleeRange) {
    next.hero.position = moveToward(next.hero.position, target.position, GRAYBOX_TUNING.heroSpeed * dt);
  } else {
    next.hero.attackTimer = Math.max(0, next.hero.attackTimer - dt);
    if (next.hero.attackTimer === 0) {
      next.hero.attackTimer = GRAYBOX_TUNING.heroAttackSeconds;
      const current = next.enemies.find((enemy) => enemy.id === target.id);
      if (current) {
        events.push({ type: "basic-attack", targetId: current.id, position: { ...current.position } });
        applyDamage(next, current, GRAYBOX_TUNING.heroAttackDamage, events, "basic");
      }
    }
  }

  for (const enemy of [...next.enemies]) {
    if (distance(next.hero.position, enemy.position) > GRAYBOX_TUNING.meleeRange + 0.6) continue;
    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    if (enemy.attackTimer === 0) {
      enemy.attackTimer = enemy.kind === "boss"
        ? GRAYBOX_TUNING.bossAttackSeconds
        : GRAYBOX_TUNING.enemyAttackSeconds;
      next.hero.health = Math.max(0, next.hero.health - (
        enemy.kind === "boss" ? GRAYBOX_TUNING.bossAttackDamage : GRAYBOX_TUNING.enemyAttackDamage
      ));
      events.push({ type: "hero-hit", damage: enemy.kind === "boss" ? GRAYBOX_TUNING.bossAttackDamage : GRAYBOX_TUNING.enemyAttackDamage, healthAfter: next.hero.health });
    }
  }

  if (next.hero.health === 0) {
    const lostFloor = next.floorNumber;
    if (next.phase === "boss-battle") {
      next.phase = "boss-ready";
      next.enemies = [];
      next.hero.health = next.hero.maxHealth;
      events.push({ type: "hero-died", floorNumber: lostFloor });
      return { state: next, events };
    } else {
      const reset = createInitialGameState();
      const skillLoadout = next.skillLoadout;
      Object.assign(next, reset, {
        floorNumber: lostFloor,
        highestFloor: next.highestFloor,
        elapsedSeconds: next.elapsedSeconds,
        skillLoadout,
      });
      events.push({ type: "hero-died", floorNumber: lostFloor });
      return { state: next, events };
    }
  }

  if (next.phase === "exploring" && next.enemies.length === 0 && next.goalKills < 20) {
    next.encounterIndex += 1;
  }
  return { state: next, events };
}

export function isBossFloor(floorNumber: number): boolean {
  return floorNumber > 0 && floorNumber % 3 === 0;
}
