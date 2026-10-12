const STORAGE_KEY = "nevercrest-audio-preferences";

type AudioPreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function getStorage(): AudioPreferenceStorage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function readAudioMuted(storage: AudioPreferenceStorage | undefined = getStorage()): boolean {
  if (!storage) return false;
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    return typeof value === "object" && value !== null && "muted" in value && value.muted === true;
  } catch {
    return false;
  }
}

export function writeAudioMuted(muted: boolean, storage: AudioPreferenceStorage | undefined = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ muted }));
    return true;
  } catch {
    return false;
  }
}
