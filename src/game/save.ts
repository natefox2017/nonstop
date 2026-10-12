import type { GameState, Point2 } from "./types";
import { FLOOR_ONE } from "./floor";

const DATABASE = "nevercrest-save";
const VERSION = 1;
const STORE = "snapshots";
const KEY = "current";

export type SaveLoadResult = {
  state: GameState | null;
  status: string;
  writable: boolean;
};

function isPoint(value: unknown): value is Point2 {
  if (!value || typeof value !== "object") return false;
  const point = value as Point2;
  return Number.isFinite(point.x) && Number.isFinite(point.z);
}

function isCurrentActor(enemy: GameState["enemies"][number], state: GameState): boolean {
  if (enemy.kind === "boss") {
    return state.phase === "boss-battle"
      && enemy.id === `boss-${state.floorNumber}`
      && enemy.encounterId === `boss-arena-${state.floorNumber}`;
  }
  const encounter = FLOOR_ONE.encounters[state.encounterIndex];
  return state.phase === "exploring"
    && encounter?.id === enemy.encounterId
    && encounter.goals.some((goal) => goal.id === enemy.id);
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as GameState;
  const phases = ["exploring", "boss-ready", "boss-battle", "floor-clear"];
  const skillIds = ["whirl", "leap", "void"];
  return state.schemaVersion === 1
    && Number.isInteger(state.floorNumber) && state.floorNumber >= 1 && state.floorNumber <= 1000
    && Number.isInteger(state.highestFloor) && state.highestFloor >= state.floorNumber
    && phases.includes(state.phase)
    && Number.isInteger(state.encounterIndex) && state.encounterIndex >= 0 && state.encounterIndex <= 4
    && Number.isInteger(state.goalKills) && state.goalKills >= 0 && state.goalKills <= 20
    && isPoint(state.hero?.position)
    && Number.isFinite(state.hero?.health) && Number.isFinite(state.hero?.maxHealth)
    && state.hero.health >= 0 && state.hero.health <= state.hero.maxHealth && state.hero.maxHealth > 0
    && Number.isFinite(state.hero.attackTimer)
    && Array.isArray(state.enemies) && state.enemies.every((enemy) =>
      typeof enemy.id === "string"
      && (enemy.kind === "goal" || enemy.kind === "boss")
      && isPoint(enemy.position)
      && Number.isFinite(enemy.health) && Number.isFinite(enemy.maxHealth)
      && enemy.health >= 0 && enemy.health <= enemy.maxHealth && enemy.maxHealth > 0
      && Number.isFinite(enemy.attackTimer))
    && state.enemies.every((enemy) => isCurrentActor(enemy, state))
    && Array.isArray(state.defeatedGoalIds)
    && new Set(state.defeatedGoalIds).size === state.defeatedGoalIds.length
    && state.defeatedGoalIds.length === state.goalKills
    && state.defeatedGoalIds.every((id) => FLOOR_ONE.encounters.some((encounter) => encounter.goals.some((goal) => goal.id === id)))
    && skillIds.every((id) => Number.isFinite(state.skillCooldowns?.[id as keyof GameState["skillCooldowns"]])
      && state.skillCooldowns[id as keyof GameState["skillCooldowns"]] >= 0)
    && Number.isFinite(state.elapsedSeconds) && state.elapsedSeconds >= 0
    && Number.isFinite(state.floorClearTimer)
    && typeof state.paused === "boolean"
    && (state.phase !== "boss-ready" || (state.floorNumber % 3 === 0 && state.goalKills === 20 && state.enemies.length === 0))
    && (state.phase !== "boss-battle" || (state.floorNumber % 3 === 0 && state.goalKills === 20 && state.enemies.length === 1))
    && (state.phase !== "floor-clear" || (state.goalKills === 20 && state.enemies.length === 0))
    && (state.phase !== "exploring" || (state.goalKills < 20 && state.enemies.every((enemy) => enemy.kind === "goal")));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open game save."));
  });
}

export async function loadGameState(): Promise<SaveLoadResult> {
  if (typeof indexedDB === "undefined") return { state: null, status: "Browser storage is unavailable.", writable: false };
  try {
    const database = await openDatabase();
    const value = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not read game save."));
    });
    database.close();
    if (value === undefined) return { state: null, status: "Autosave ready", writable: true };
    if (!isGameState(value)) return { state: null, status: "Save could not be validated; preserved without overwriting.", writable: false };
    return { state: value, status: "Progress restored", writable: true };
  } catch {
    return { state: null, status: "Could not open save storage; progress may not persist.", writable: false };
  }
}

export async function saveGameState(state: GameState): Promise<void> {
  if (!isGameState(state)) throw new Error("Refusing to save an invalid game snapshot.");
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(state, KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save game progress."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Game save was cancelled."));
    });
  } finally {
    database.close();
  }
}
