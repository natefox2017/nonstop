import { useEffect, useRef, useSyncExternalStore } from "react";
import { gameStore } from "../game/store";
import { createAudioFeedback } from "../audio/feedback";
import type { SkillId } from "../game/types";
import "./styles.css";

const skills: { id: SkillId; name: string; mark: string }[] = [
  { id: "whirl", name: "Whirl", mark: "↻" },
  { id: "leap", name: "Leap", mark: "↗" },
  { id: "void", name: "Void", mark: "✦" },
];

function formatFloor(value: number): string {
  return String(value).padStart(2, "0");
}

function formatCooldown(value: number): string {
  return value > 0 ? `${value.toFixed(1)}s` : "Ready";
}

export function App() {
  const state = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot, gameStore.getSnapshot);
  const saveStatus = useSyncExternalStore(gameStore.subscribeStatus, gameStore.getStatus, gameStore.getStatus);
  const worldRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = worldRoot.current;
    if (!root) return;
    let dispose = () => {};
    let cancelled = false;
    void import("../render/WorldRenderer").then(({ mountWorld: createWorld }) => {
      if (cancelled) return;
      dispose = createWorld(root);
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  useEffect(() => {
    const audio = createAudioFeedback();
    const unlock = () => audio.unlock();
    const resumeWhenVisible = () => {
      if (document.visibilityState === "visible") audio.resume();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("pageshow", resumeWhenVisible);
    const unsubscribe = gameStore.subscribeEvents(audio.play);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("pageshow", resumeWhenVisible);
      unsubscribe();
      audio.dispose();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && ["BUTTON", "INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        const skill = skills[Number(event.key) - 1];
        if (skill) gameStore.dispatch({ type: "cast-skill", skillId: skill.id });
      }
      if (event.key.toLowerCase() === "p") gameStore.dispatch({ type: "toggle-pause" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeSkills = state.phase === "exploring" || state.phase === "boss-battle";
  const canCast = activeSkills && state.enemies.length > 0 && !state.paused;
  const isBoss = state.phase === "boss-ready" || state.phase === "boss-battle";

  return (
    <main className="game-shell" aria-label="Nevercrest auto-combat game">
      <header className="top-hud">
        <div className="floor-badge">
          <span className="floor-overline">FLOATING MEADOW</span>
          <strong>FLOOR {formatFloor(state.floorNumber)}</strong>
        </div>
        <div className="objective" aria-live="polite">
          <div className="objective-label">GOAL ENEMIES</div>
          <div className="objective-count"><strong>{String(state.goalKills).padStart(2, "0")}</strong><span>/ 20</span></div>
        </div>
        <button
          className={`pause-button ${state.paused ? "is-paused" : ""}`}
          type="button"
          aria-label={state.paused ? "Resume battle" : "Pause battle"}
          onClick={() => gameStore.dispatch({ type: "toggle-pause" })}
        >
          <span aria-hidden="true">{state.paused ? "▶" : "Ⅱ"}</span>
        </button>
      </header>

      <section className="battle-scene" aria-label="Battlefield">
        <div className="world-root" ref={worldRoot} />
        <div className="scene-wash" aria-hidden="true" />
        <div className="auto-battle-tag"><i /> AUTO-BATTLE</div>
        <div className="encounter-track" aria-label={`${Math.min(state.encounterIndex + 1, 4)} of 4 encounters`}>
          {[0, 1, 2, 3].map((index) => (
            <span
              className={index < Math.ceil(state.goalKills / 5) ? "is-cleared" : index === state.encounterIndex ? "is-current" : ""}
              key={index}
            />
          ))}
        </div>

        {state.phase === "boss-ready" && (
          <div className="boss-callout" role="status">
            <span className="boss-kicker">THE WAY IS CLEAR</span>
            <strong>Boss ready</strong>
            <span>Choose when to enter the arena.</span>
            <button type="button" className="battle-button" onClick={() => gameStore.dispatch({ type: "start-boss" })}>
              <span aria-hidden="true">⚔</span> BATTLE
            </button>
          </div>
        )}

        {state.phase === "boss-battle" && (
          <div className="boss-health" aria-label={`Boss health ${Math.ceil((state.enemies[0]?.health ?? 0) / Math.max(state.enemies[0]?.maxHealth ?? 1, 1) * 100)} percent`}>
            <div><span>ARENA GUARDIAN</span><b>{Math.ceil((state.enemies[0]?.health ?? 0) / Math.max(state.enemies[0]?.maxHealth ?? 1, 1) * 100)}%</b></div>
            <i><span style={{ width: `${Math.max(0, (state.enemies[0]?.health ?? 0) / Math.max(state.enemies[0]?.maxHealth ?? 1, 1) * 100)}%` }} /></i>
          </div>
        )}

        {state.phase === "floor-clear" && (
          <div className="clear-callout" role="status">
            <span className="clear-spark" aria-hidden="true">✦</span>
            <strong>Floor cleared</strong>
            <span>Onward to Floor {formatFloor(state.floorNumber + 1)}</span>
          </div>
        )}

        {state.paused && (
          <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Battle paused">
            <div className="pause-card">
              <span className="pause-kicker">TAKE A BREATH</span>
              <strong>Paused</strong>
              <span>Your progress is saved as you go.</span>
              <button type="button" className="resume-button" onClick={() => gameStore.dispatch({ type: "toggle-pause" })}>
                Resume adventure
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="bottom-hud">
        <div className="hero-status">
          <div className="hero-name"><span className="hero-avatar">N</span><div><strong>Wayfarer</strong><small>ON THE MOVE</small></div></div>
          <div className="health-readout"><span>HP</span><b>{Math.ceil(state.hero.health)}</b><i><span style={{ width: `${state.hero.health / state.hero.maxHealth * 100}%` }} /></i></div>
        </div>
        <div className="skill-heading"><span>ACTIVE SKILLS</span><span>KEYS 1 · 2 · 3</span></div>
        <div className="skill-row">
          {skills.map((skill, index) => {
            const cooldown = state.skillCooldowns[skill.id];
            const ready = cooldown <= 0;
            return (
              <button
                className={`skill-button skill-${skill.id} ${ready ? "is-ready" : "is-cooling"}`}
                type="button"
                key={skill.id}
                aria-label={`${skill.name}. ${formatCooldown(cooldown)}${ready ? ". Activate skill." : ". Cooling down."}`}
                disabled={!canCast || !ready}
                onClick={() => gameStore.dispatch({ type: "cast-skill", skillId: skill.id })}
              >
                <span className="skill-mark" aria-hidden="true">{skill.mark}</span>
                <span className="skill-name">{skill.name}</span>
                <span className="skill-cooldown">{formatCooldown(cooldown)}</span>
                <span className="skill-index" aria-hidden="true">{index + 1}</span>
              </button>
            );
          })}
        </div>
        <div className="footer-note">
          <span>{isBoss ? (state.phase === "boss-ready" ? "A choice awaits" : "Hold your ground") : "Your knight fights alone"}</span>
          <span className="save-state" aria-live="polite"><i />{saveStatus}</span>
        </div>
      </footer>
    </main>
  );
}
