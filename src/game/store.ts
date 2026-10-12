import { createInitialGameState, dispatchCommand, stepGame } from "./core";
import { loadGameState, saveGameState } from "./save";
import type { GameCommand, GameEvent, GameState } from "./types";

type Listener = () => void;

class GameStore {
  private state = createInitialGameState();
  private listeners = new Set<Listener>();
  private eventListeners = new Set<(events: readonly GameEvent[]) => void>();
  private writeAllowed = false;
  private ticksSinceSave = 0;
  private saveQueue: Promise<void> = Promise.resolve();
  private ready = false;
  private status = "Loading save…";
  private events: GameEvent[] = [];

  getSnapshot = (): GameState => this.state;
  getStatus = (): string => this.status;
  isReady = (): boolean => this.ready;
  getEvents = (): readonly GameEvent[] => this.events;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeEvents = (listener: (events: readonly GameEvent[]) => void): (() => void) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  subscribeStatus = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async initialize(): Promise<void> {
    const loaded = await loadGameState();
    this.state = loaded.state ?? this.state;
    this.status = loaded.status;
    this.writeAllowed = loaded.writable;
    this.ready = true;
    this.notify();
  }

  dispatch(command: GameCommand): void {
    const previous = this.state;
    const result = dispatchCommand(this.state, command);
    this.state = result.state;
    this.events = result.events;
    this.publishEvents(result.events);
    this.notify();
    if (result.state !== previous) this.persist();
  }

  tick(): void {
    const result = stepGame(this.state);
    if (result.state === this.state) return;
    const previousPhase = this.state.phase;
    this.state = result.state;
    this.events = result.events;
    this.publishEvents(result.events);
    this.notify();
    this.ticksSinceSave += 1;
    if (this.ticksSinceSave >= 30 || this.state.phase !== previousPhase || result.events.length > 0) this.persist();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private publishEvents(events: readonly GameEvent[]): void {
    if (events.length === 0) return;
    for (const listener of this.eventListeners) listener(events);
  }

  private persist(): void {
    if (!this.writeAllowed || !this.ready) return;
    this.ticksSinceSave = 0;
    const snapshot = this.state;
    this.saveQueue = this.saveQueue.then(() => saveGameState(snapshot)).then(() => {
      if (this.status !== "Autosave ready") this.status = "Autosave ready";
    }).catch(() => {
      this.writeAllowed = false;
      this.status = "Save failed; further progress is not being written.";
      this.notify();
    });
  }
}

export const gameStore = new GameStore();
