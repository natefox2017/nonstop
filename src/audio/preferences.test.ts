import { describe, expect, it } from "vitest";
import { readAudioMuted, writeAudioMuted } from "./preferences";

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe("audio preference persistence", () => {
  it("defaults to audio on and restores the saved mute state", () => {
    const storage = memoryStorage();
    expect(readAudioMuted(storage)).toBe(false);
    expect(writeAudioMuted(true, storage)).toBe(true);
    expect(readAudioMuted(storage)).toBe(true);
    expect(writeAudioMuted(false, storage)).toBe(true);
    expect(readAudioMuted(storage)).toBe(false);
  });

  it("ignores malformed stored preferences without changing the default", () => {
    const storage = memoryStorage();
    storage.setItem("nevercrest-audio-preferences", "not json");
    expect(readAudioMuted(storage)).toBe(false);
  });

  it("reports storage failures so the UI can explain that the setting was not saved", () => {
    const blocked = {
      getItem: () => null,
      setItem: () => { throw new Error("Storage unavailable"); },
    };
    expect(writeAudioMuted(true, blocked)).toBe(false);
  });
});
