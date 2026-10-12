import { gameStore } from "../game/store";

const FRAME_STEP = 1 / 30;
const MAX_CATCH_UP = 5;

export async function startRuntime(): Promise<void> {
  await gameStore.initialize();
  let previous = performance.now();
  let accumulator = 0;

  const frame = (now: number) => {
    accumulator += Math.min((now - previous) / 1000, 0.25);
    previous = now;
    let steps = 0;
    while (accumulator >= FRAME_STEP && steps < MAX_CATCH_UP) {
      gameStore.tick();
      accumulator -= FRAME_STEP;
      steps += 1;
    }
    if (steps === MAX_CATCH_UP) accumulator = 0;
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}
