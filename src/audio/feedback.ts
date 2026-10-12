import type { GameEvent } from "../game/types";

type Tone = { frequency: number; duration: number; waveform: OscillatorType; endFrequency?: number };

function toneFor(event: GameEvent): Tone | undefined {
  switch (event.type) {
    case "skill-cast":
      return { frequency: event.skillId === "leap" ? 540 : event.skillId === "void" ? 180 : 310, endFrequency: 760, duration: 0.16, waveform: "sine" };
    case "enemy-hit":
      return { frequency: event.source === "basic" ? 190 : 260, endFrequency: 90, duration: 0.075, waveform: "triangle" };
    case "enemy-defeated":
      return { frequency: event.isGoal ? 620 : 430, endFrequency: 840, duration: 0.12, waveform: "sine" };
    case "hero-hit":
      return { frequency: 145, endFrequency: 72, duration: 0.12, waveform: "triangle" };
    case "boss-started":
      return { frequency: 260, endFrequency: 390, duration: 0.28, waveform: "sawtooth" };
    case "floor-cleared":
      return { frequency: 660, endFrequency: 990, duration: 0.34, waveform: "sine" };
    default:
      return undefined;
  }
}

/** Small original Web Audio feedback. It consumes only authoritative game events. */
export function createAudioFeedback(initiallyMuted = false) {
  let context: AudioContext | undefined;
  let muted = initiallyMuted;
  let paused = false;
  let pageVisible = true;
  let resumePending = false;
  let suspendPending = false;
  const voices = new Set<OscillatorNode>();

  function stopVoices(): void {
    for (const oscillator of voices) {
      try { oscillator.stop(); } catch { /* The voice may already have ended. */ }
    }
    voices.clear();
  }

  function suspend(): void {
    stopVoices();
    if (!context || context.state !== "running" || suspendPending) return;
    suspendPending = true;
    void context.suspend().catch(() => {}).finally(() => {
      suspendPending = false;
      if (!muted && !paused && pageVisible) resume();
    });
  }

  function unlock(): void {
    if (muted || !pageVisible) return;
    if (!context) context = new AudioContext();
    resume();
  }

  function resume(): void {
    if (muted || paused || !pageVisible || !context || context.state !== "suspended" || resumePending) return;
    resumePending = true;
    void context.resume().catch(() => {}).finally(() => {
      resumePending = false;
      if (muted || paused || !pageVisible) suspend();
    });
  }

  function setMuted(value: boolean): void {
    if (muted === value) return;
    muted = value;
    if (muted) suspend();
    else resume();
  }

  function setPaused(value: boolean): void {
    if (paused === value) return;
    paused = value;
    if (paused) suspend();
    else resume();
  }

  function setPageVisible(value: boolean): void {
    if (pageVisible === value) return;
    pageVisible = value;
    if (pageVisible) resume();
    else suspend();
  }

  function play(events: readonly GameEvent[]): void {
    if (muted || paused || !pageVisible || !context || context.state !== "running") return;
    const now = context.currentTime;
    for (const event of events) {
      const tone = toneFor(event);
      if (!tone) continue;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = tone.waveform;
      oscillator.frequency.setValueAtTime(tone.frequency, now);
      if (tone.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, now + tone.duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(event.type === "hero-hit" ? 0.09 : 0.055, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      voices.add(oscillator);
      oscillator.addEventListener("ended", () => voices.delete(oscillator), { once: true });
      oscillator.start(now);
      oscillator.stop(now + tone.duration + 0.01);
    }
  }

  function dispose(): void {
    stopVoices();
    if (context && context.state !== "closed") void context.close();
    context = undefined;
  }

  return { unlock, resume, setMuted, setPaused, setPageVisible, play, dispose };
}
