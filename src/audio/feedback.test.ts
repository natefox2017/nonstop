import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioFeedback } from "./feedback";

class MockAudioContext {
  static instances: MockAudioContext[] = [];
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  resume = vi.fn(async () => { this.state = "running"; });
  close = vi.fn(async () => { this.state = "closed"; });
  createOscillator = vi.fn();
  createGain = vi.fn();

  constructor() {
    MockAudioContext.instances.push(this);
  }
}

describe("audio feedback lifecycle", () => {
  beforeEach(() => {
    MockAudioContext.instances = [];
    vi.stubGlobal("AudioContext", MockAudioContext);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("waits for the first user gesture before creating audio", () => {
    const audio = createAudioFeedback();
    expect(MockAudioContext.instances).toHaveLength(0);

    audio.unlock();

    expect(MockAudioContext.instances).toHaveLength(1);
    expect(MockAudioContext.instances[0]?.resume).toHaveBeenCalledOnce();
  });

  it("resumes a suspended context when the page becomes visible again", async () => {
    const audio = createAudioFeedback();
    audio.unlock();
    const context = MockAudioContext.instances[0];
    expect(context).toBeDefined();
    if (!context) throw new Error("AudioContext was not created");
    await context.resume.mock.results[0]?.value;
    context.state = "suspended";

    audio.resume();

    expect(context.resume).toHaveBeenCalledTimes(2);
  });

  it("closes the context on teardown", () => {
    const audio = createAudioFeedback();
    audio.unlock();
    const context = MockAudioContext.instances[0];
    expect(context).toBeDefined();
    if (!context) throw new Error("AudioContext was not created");

    audio.dispose();

    expect(context.close).toHaveBeenCalledOnce();
  });
});
