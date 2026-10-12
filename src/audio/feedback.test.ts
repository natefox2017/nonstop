import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameEvent } from "../game/types";
import { createAudioFeedback } from "./feedback";

function makeOscillator(): OscillatorNode {
  const oscillator = new EventTarget() as EventTarget & Record<string, unknown>;
  Object.assign(oscillator, {
    type: "sine",
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  });
  return oscillator as unknown as OscillatorNode;
}

function makeGain(): GainNode {
  return {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  } as unknown as GainNode;
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  oscillators: OscillatorNode[] = [];
  resume = vi.fn(async () => { this.state = "running"; });
  suspend = vi.fn(async () => { this.state = "suspended"; });
  close = vi.fn(async () => { this.state = "closed"; });
  createOscillator = vi.fn(() => {
    const oscillator = makeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  });
  createGain = vi.fn(makeGain);

  constructor() {
    MockAudioContext.instances.push(this);
  }
}

const hit: GameEvent = { type: "hero-hit", damage: 5, healthAfter: 95 };

describe("audio feedback lifecycle", () => {
  beforeEach(() => {
    MockAudioContext.instances = [];
    vi.stubGlobal("AudioContext", MockAudioContext);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("unlocks once on the first user gesture and reuses the context", () => {
    const audio = createAudioFeedback();
    expect(MockAudioContext.instances).toHaveLength(0);

    audio.unlock();
    audio.unlock();

    expect(MockAudioContext.instances).toHaveLength(1);
    expect(MockAudioContext.instances[0]?.resume).toHaveBeenCalledOnce();
  });

  it("does not create audio while initially muted; unmuting from a gesture unlocks it", () => {
    const audio = createAudioFeedback(true);
    audio.unlock();
    expect(MockAudioContext.instances).toHaveLength(0);

    audio.setMuted(false);
    audio.unlock();

    expect(MockAudioContext.instances).toHaveLength(1);
    expect(MockAudioContext.instances[0]?.resume).toHaveBeenCalledOnce();
  });

  it("stops current tones on mute and does not replay them when unmuted", async () => {
    const audio = createAudioFeedback();
    audio.unlock();
    const context = MockAudioContext.instances[0];
    if (!context) throw new Error("AudioContext was not created");
    await vi.waitFor(() => expect(context.state).toBe("running"));

    audio.play([hit]);
    const firstVoice = context.oscillators[0];
    expect(firstVoice).toBeDefined();
    if (!firstVoice) throw new Error("Expected an active tone");
    audio.setMuted(true);
    expect(firstVoice.stop).toHaveBeenCalledTimes(2);
    expect(firstVoice.stop).toHaveBeenLastCalledWith();
    await vi.waitFor(() => expect(context.state).toBe("suspended"));
    audio.setMuted(false);
    await vi.waitFor(() => expect(context.state).toBe("running"));
    expect(context.createOscillator).toHaveBeenCalledOnce();

    audio.play([hit]);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("stops tones on pause and backgrounding without replaying old events", async () => {
    const audio = createAudioFeedback();
    audio.unlock();
    const context = MockAudioContext.instances[0];
    if (!context) throw new Error("AudioContext was not created");
    await vi.waitFor(() => expect(context.state).toBe("running"));

    audio.play([hit]);
    audio.setPaused(true);
    expect(context.oscillators[0]?.stop).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(context.state).toBe("suspended"));
    audio.play([hit]);
    audio.setPaused(false);
    await vi.waitFor(() => expect(context.state).toBe("running"));
    expect(context.createOscillator).toHaveBeenCalledOnce();

    audio.play([hit]);
    audio.setPageVisible(false);
    expect(context.oscillators[1]?.stop).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(context.state).toBe("suspended"));
    audio.play([hit]);
    audio.setPageVisible(true);
    await vi.waitFor(() => expect(context.state).toBe("running"));
    expect(context.createOscillator).toHaveBeenCalledTimes(2);

    audio.play([hit]);
    expect(context.createOscillator).toHaveBeenCalledTimes(3);
  });

  it("suspends again if the page backgrounds while resume is still pending", async () => {
    const audio = createAudioFeedback();
    audio.unlock();
    const context = MockAudioContext.instances[0];
    if (!context) throw new Error("AudioContext was not created");
    await context.resume.mock.results[0]?.value;
    audio.setMuted(true);
    await vi.waitFor(() => expect(context.state).toBe("suspended"));

    let finishResume = () => {};
    context.resume.mockImplementation(() => new Promise<void>((resolve) => {
      finishResume = () => {
        context.state = "running";
        resolve();
      };
    }));
    audio.setMuted(false);
    audio.setPageVisible(false);
    finishResume();

    await vi.waitFor(() => expect(context.state).toBe("suspended"));
  });

  it("stops active tones and closes the context on teardown", () => {
    const audio = createAudioFeedback();
    audio.unlock();
    const context = MockAudioContext.instances[0];
    if (!context) throw new Error("AudioContext was not created");
    audio.play([hit]);

    audio.dispose();

    expect(context.oscillators[0]?.stop).toHaveBeenCalledTimes(2);
    expect(context.close).toHaveBeenCalledOnce();
  });
});
