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
export function createAudioFeedback() {
  let context: AudioContext | undefined;

  function unlock(): void {
    if (!context) context = new AudioContext();
    resume();
  }

  function resume(): void {
    if (context?.state === "suspended") void context.resume().catch(() => {});
  }

  function play(events: readonly GameEvent[]): void {
    if (!context || context.state !== "running") return;
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
      oscillator.start(now);
      oscillator.stop(now + tone.duration + 0.01);
    }
  }

  function dispose(): void {
    if (context && context.state !== "closed") void context.close();
    context = undefined;
  }

  return { unlock, resume, play, dispose };
}
