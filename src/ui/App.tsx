import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { gameStore } from "../game/store";
import { createAudioFeedback } from "../audio/feedback";
import { readAudioMuted, writeAudioMuted } from "../audio/preferences";
import { GRAYBOX_TUNING } from "../game/tuning";
import "./styles.css";

type ActiveSkillId = keyof typeof GRAYBOX_TUNING.skills;

const skills: { id: ActiveSkillId; name: string }[] = [
  { id: "whirl", name: "Whirl" },
  { id: "leap", name: "Leap" },
  { id: "void", name: "Void" },
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
  const audioFeedback = useRef<ReturnType<typeof createAudioFeedback> | null>(null);
  const [audioMuted, setAudioMuted] = useState(readAudioMuted);
  const [audioPreferenceMessage, setAudioPreferenceMessage] = useState("");

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
    const audio = createAudioFeedback(audioMuted);
    audioFeedback.current = audio;
    const unlock = () => {
      audio.setPaused(gameStore.getSnapshot().paused);
      audio.unlock();
    };
    const updatePageVisibility = () => audio.setPageVisible(document.visibilityState === "visible");
    const onPageHide = () => audio.setPageVisible(false);
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", updatePageVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", updatePageVisibility);
    audio.setPageVisible(document.visibilityState === "visible");
    const unsubscribe = gameStore.subscribeEvents(audio.play);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", updatePageVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", updatePageVisibility);
      unsubscribe();
      audio.dispose();
      audioFeedback.current = null;
    };
  }, []);

  useEffect(() => {
    audioFeedback.current?.setMuted(audioMuted);
    audioFeedback.current?.setPaused(state.paused);
  }, [audioMuted, state.paused]);

  const toggleAudio = () => {
    const nextMuted = !audioMuted;
    audioFeedback.current?.setPaused(gameStore.getSnapshot().paused);
    setAudioMuted(nextMuted);
    const saved = writeAudioMuted(nextMuted);
    setAudioPreferenceMessage(saved ? "" : "Audio changed for this session, but the preference could not be saved.");
    audioFeedback.current?.setMuted(nextMuted);
    if (!nextMuted) audioFeedback.current?.unlock();
  };

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

  const saveNeedsAttention = !["Autosave ready", "Progress restored", "Loading save…"].includes(saveStatus);
  const activeSkills = state.phase === "exploring" || state.phase === "boss-battle";
  const canCast = activeSkills && state.enemies.length > 0 && !state.paused;

  return (
    <main className="game-shell" aria-label="Nevercrest auto-combat game">
      <header className="top-hud">
        <div className="health-readout" role="meter" aria-label="Hero health" aria-valuemin={0} aria-valuemax={state.hero.maxHealth} aria-valuenow={Math.ceil(state.hero.health)} title={`${Math.ceil(state.hero.health)} / ${Math.ceil(state.hero.maxHealth)} HP`}>
          <img className="health-frame" src="/assets/hud/health-heart-frame-v1.png" alt="" width={1983} height={793} />
          <span className="health-fill-window" style={{ clipPath: `inset(0 ${100 - state.hero.health / state.hero.maxHealth * 100}% 0 0)` }}>
            <img className="health-fill-texture" src="/assets/hud/health-fill-green-v1.png" alt="" width={2172} height={724} />
          </span>
        </div>
        <div className="objective" data-wide-floor={state.floorNumber >= 100} role="group" aria-label={`Floor ${state.floorNumber}. ${state.goalKills} of 20 goals defeated. ${Math.floor(state.goalKills / 5)} of 4 encounters cleared.`}>
          <div className="objective-count" aria-hidden="true">
            <img className="progress-backplate" src="/assets/hud/progress-backplate-blank-v1.png" alt="" width={2172} height={724} />
            <img className="floor-badge-art" src="/assets/hud/floor-badge-blank-v1.png" alt="" width={1254} height={1254} />
            <strong className="floor-number" data-wide={state.floorNumber >= 100}>{state.floorNumber}</strong>
            <strong className="goal-count">{state.goalKills}/20</strong>
          </div>
          <div className="encounter-progress" aria-hidden="true">
            {Array.from({ length: 4 }, (_, group) => (
              <img key={group} src={`/assets/hud/encounter-diamond-${state.goalKills >= (group + 1) * 5 ? "active" : "inactive"}-v1.png`} alt="" width={1254} height={1254} />
            ))}
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`pause-button ${state.paused ? "is-paused" : ""}`}
            type="button"
            aria-label={state.paused ? "Resume battle" : "Pause battle"}
            onClick={() => gameStore.dispatch({ type: "toggle-pause" })}
          >
            <img src={`/assets/hud/${state.paused ? "resume" : "pause"}-button-v1.png`} alt="" draggable={false} width={1254} height={1254} />
          </button>
          <button
            className={`audio-button ${audioMuted ? "is-muted" : ""}`}
            type="button"
            aria-label="Audio feedback"
            aria-pressed={audioMuted}
            title={audioMuted ? "Audio muted" : "Audio on"}
            onClick={toggleAudio}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 10h3l4-3v10l-4-3H4z" />
              {audioMuted ? <path d="m15 9 5 6m0-6-5 6" /> : <><path d="M15 9a4 4 0 0 1 0 6" /><path d="M17.5 6.5a7.5 7.5 0 0 1 0 11" /></>}
            </svg>
          </button>
        </div>
      </header>

      <section className="battle-scene" aria-label="Battlefield">
        <div className="world-root" ref={worldRoot} />
        <div className="scene-wash" aria-hidden="true" />
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
        <div className={`boss-action-row ${state.phase === "boss-ready" ? "is-ready" : ""}`} aria-hidden={state.phase !== "boss-ready"}>
          {state.phase === "boss-ready" && (
            <>
              <button type="button" className="battle-button" disabled={state.paused} onClick={() => gameStore.dispatch({ type: "start-boss" })}>
                <img src="/assets/hud/battle-button-blank-v1.png" alt="" draggable={false} width={2172} height={724} />
                <span>BATTLE</span>
              </button>
            </>
          )}
        </div>
        <div className="skill-row">
          {skills.map((skill) => {
            const cooldown = state.skillCooldowns[skill.id];
            const ready = cooldown <= 0;
            const cooldownRatio = Math.min(Math.max(cooldown / GRAYBOX_TUNING.skills[skill.id].cooldownSeconds, 0), 1);
            return (
              <button
                className={`skill-button skill-${skill.id} ${ready ? "is-ready" : "is-cooling"}`}
                type="button"
                key={skill.id}
                aria-label={`${skill.name}. ${formatCooldown(cooldown)}${ready ? ". Activate skill." : ". Cooling down."}`}
                disabled={!canCast || !ready}
                onClick={() => gameStore.dispatch({ type: "cast-skill", skillId: skill.id })}
              >
                <span className="skill-orb" style={{ "--cooldown-angle": `${cooldownRatio * 360}deg` } as CSSProperties}>
                  <img className="skill-art" src={`/assets/hud/skill-${skill.id}-ready-v1.png`} alt="" draggable={false} width={1254} height={1254} />
                  {cooldown > 0 && <span className="skill-cooldown-mask" aria-hidden="true" />}
                  <span className="skill-cooldown-value">{ready ? "" : `${Math.ceil(cooldown)}s`}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="footer-note">
          <span aria-live={audioPreferenceMessage ? "polite" : undefined} role={audioPreferenceMessage ? "status" : undefined}>
            {audioPreferenceMessage}
          </span>
          <span className={saveNeedsAttention ? "save-warning" : "save-state"} role="status">{saveStatus}</span>
        </div>
      </footer>
    </main>
  );
}
