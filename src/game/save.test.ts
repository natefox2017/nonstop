import { IDBFactory, IDBObjectStore as FakeIDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "./core";
import { loadGameState, saveGameState } from "./save";
import type { GameState } from "./types";

const DATABASE = "nevercrest-save";
const STORE = "snapshots";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeRecord(key: string, value: unknown): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

async function readRecord(key: string): Promise<unknown> {
  const database = await openDatabase();
  const value = await new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return value;
}

function stateAtFloor(floorNumber: number): GameState {
  return { ...createInitialGameState(), floorNumber, highestFloor: floorNumber };
}

describe("IndexedDB save recovery", () => {
  beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()));
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("commits the previous valid snapshot as last good with the current snapshot", async () => {
    const first = stateAtFloor(1);
    const second = stateAtFloor(2);
    await saveGameState(first);
    await saveGameState(second);

    expect(await readRecord("current")).toEqual(second);
    expect(await readRecord("last-good")).toEqual(first);
    expect(await loadGameState()).toMatchObject({ state: second, writable: true, status: "Progress restored" });
  });

  it("recovers a damaged current record and quarantines it on the next save", async () => {
    const first = stateAtFloor(1);
    const second = stateAtFloor(2);
    const resumed = { ...first, paused: true };
    await saveGameState(first);
    await saveGameState(second);
    const damaged = { ...second, hero: { ...second.hero, health: Number.NaN } };
    await writeRecord("current", damaged);

    const loaded = await loadGameState();
    expect(loaded.state).toEqual(first);
    expect(loaded.writable).toBe(true);
    expect(loaded.status).toContain("Recovered last good save");

    await saveGameState(resumed);
    expect(await readRecord("current")).toEqual(resumed);
    expect(await readRecord("quarantined-current")).toEqual(damaged);
  });

  it("refuses future-schema progress and leaves it intact", async () => {
    const current = stateAtFloor(1);
    await saveGameState(current);
    const future = { ...stateAtFloor(7), schemaVersion: 3 };
    await writeRecord("current", future);

    const loaded = await loadGameState();
    expect(loaded).toMatchObject({ state: null, writable: false });
    expect(loaded.status).toContain("newer version");
    await expect(saveGameState(current)).rejects.toThrow("newer version");
    expect(await readRecord("current")).toEqual(future);
  });

  it("blocks a database opened by a newer save schema", async () => {
    const future = { ...stateAtFloor(9), schemaVersion: 3 };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 2);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE);
        store.put(future, "current");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();

    const loaded = await loadGameState();
    expect(loaded).toMatchObject({ state: null, writable: false });
    expect(loaded.status).toContain("newer version");
    await expect(saveGameState(stateAtFloor(1))).rejects.toMatchObject({ name: "VersionError" });
  });

  it("migrates valid version-1 cooldown saves without losing current progress", async () => {
    const old = stateAtFloor(6);
    const legacy = {
      ...old,
      schemaVersion: 1,
      skillLoadout: undefined,
      skillCooldowns: { whirl: 2.5, leap: 3.5, void: 4.5 },
    };
    await writeRecord("current", legacy);

    const loaded = await loadGameState();
    expect(loaded.state).toMatchObject({
      schemaVersion: 2,
      floorNumber: 6,
      skillLoadout: { slot1: "whirl", slot2: "leap", slot3: "void" },
      skillCooldowns: { whirl: 2.5, slam: 0, leap: 3.5, slash: 0, clone: 0, void: 4.5 },
    });

    if (!loaded.state) throw new Error("Expected the legacy save to migrate.");
    await saveGameState(loaded.state);
    expect(await readRecord("last-good")).toMatchObject({ schemaVersion: 2, floorNumber: 6 });
    expect(await readRecord("current")).toMatchObject({ schemaVersion: 2, floorNumber: 6 });
  });

  it("rejects a skill equipped in a slot outside its documented family", async () => {
    const invalid = {
      ...stateAtFloor(1),
      skillLoadout: { slot1: "slash", slot2: "leap", slot3: "void" },
    };
    await expect(saveGameState(invalid as GameState)).rejects.toThrow("invalid game snapshot");
  });

  it("rolls back both snapshot writes when the current write fails", async () => {
    const first = stateAtFloor(1);
    const second = stateAtFloor(2);
    const third = stateAtFloor(3);
    await saveGameState(first);
    await saveGameState(second);

    const originalPut = FakeIDBObjectStore.prototype.put;
    vi.spyOn(FakeIDBObjectStore.prototype, "put").mockImplementation(function (
      this: IDBObjectStore,
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (key === "current") throw new Error("simulated current write failure");
      return originalPut.call(this, value, key);
    });

    await expect(saveGameState(third)).rejects.toThrow("simulated current write failure");
    expect(await readRecord("current")).toEqual(second);
    expect(await readRecord("last-good")).toEqual(first);
  });
});
