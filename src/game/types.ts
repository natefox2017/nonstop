export type Point2 = { x: number; z: number };

export type SkillId = "whirl" | "leap" | "void";
export type GamePhase =
  | "exploring"
  | "boss-ready"
  | "boss-battle"
  | "floor-clear";

export type GoalEnemyDefinition = {
  id: string;
  position: Point2;
  maxHealth: number;
};

export type EncounterDefinition = {
  id: string;
  center: Point2;
  goals: readonly GoalEnemyDefinition[];
};

export type FloorTemplate = {
  id: string;
  route: readonly Point2[];
  encounters: readonly EncounterDefinition[];
  bossArena: Point2;
};

export type Enemy = {
  id: string;
  kind: "goal" | "boss";
  encounterId: string;
  position: Point2;
  health: number;
  maxHealth: number;
  attackTimer: number;
};

export type GameState = {
  schemaVersion: 1;
  floorNumber: number;
  highestFloor: number;
  phase: GamePhase;
  encounterIndex: number;
  goalKills: number;
  hero: { position: Point2; health: number; maxHealth: number; attackTimer: number };
  enemies: Enemy[];
  defeatedGoalIds: string[];
  skillCooldowns: Record<SkillId, number>;
  elapsedSeconds: number;
  floorClearTimer: number;
  paused: boolean;
};

export type GameCommand =
  | { type: "cast-skill"; skillId: SkillId }
  | { type: "start-boss" }
  | { type: "toggle-pause" };

export type GameEvent =
  | { type: "enemy-defeated"; enemyId: string; isGoal: boolean }
  | { type: "floor-cleared"; floorNumber: number }
  | { type: "boss-ready"; floorNumber: number }
  | { type: "boss-started"; floorNumber: number }
  | { type: "hero-died"; floorNumber: number };

export type StepResult = { state: GameState; events: GameEvent[] };
