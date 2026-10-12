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

function SkillGlyph({ id }: { id: ActiveSkillId }) {
  if (id === "whirl") {
    return (
      <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
        <path d="M11 22c1-8 10-13 18-10 4 1 7 4 8 8M37 20l1 6-6-1M37 26c-1 8-10 13-18 10-4-1-7-4-8-8M11 28l-1-6 6 1" />
        <path d="m23 14 3 10-7 10 5-10-3-10Z" />
      </svg>
    );
  }
  if (id === "leap") {
    return (
      <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
        <path d="m24 7 13 14-8-1-4 18-6-2 5-17-8 3 8-15Z" />
        <path d="M10 34c3 2 5 3 8 3M11 28l3 1M33 35l5-2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
      <circle cx="24" cy="24" r="15" />
      <circle cx="24" cy="24" r="9" />
      <path d="m24 13 2.4 7.1 7.6 3-7.6 2.8-2.4 8.1-2.4-8.1-7.6-2.8 7.6-3 2.4-7.1Z" />
    </svg>
  );
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

  const activeSkills = state.phase === "exploring" || state.phase === "boss-battle";
  const canCast = activeSkills && state.enemies.length > 0 && !state.paused;
  const isBoss = state.phase === "boss-ready" || state.phase === "boss-battle";

  return (
    <main className="game-shell" aria-label="Nevercrest auto-combat game">
      <header className="top-hud">
        <div className="hud-topline">
          <div className="floor-badge">
            <span className="floor-overline">FLOATING MEADOW</span>
            <strong>FLOOR {formatFloor(state.floorNumber)}</strong>
          </div>
          <div className="header-actions">
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
            <button
              className={`pause-button ${state.paused ? "is-paused" : ""}`}
              type="button"
              aria-label={state.paused ? "Resume battle" : "Pause battle"}
              onClick={() => gameStore.dispatch({ type: "toggle-pause" })}
            >
              <span aria-hidden="true">{state.paused ? "▶" : "Ⅱ"}</span>
            </button>
          </div>
        </div>
        <div className="objective" aria-label={`${state.goalKills} of 20 goals defeated`}>
          <div className="objective-count"><span>GOALS</span><strong>{String(state.goalKills).padStart(2, "0")}</strong><span>/ 20</span></div>
          <div className="encounter-progress" aria-hidden="true">
            {Array.from({ length: 4 }, (_, group) => (
              <span className="encounter-group" key={group}>
                {Array.from({ length: 5 }, (_, item) => {
                  const goalIndex = group * 5 + item;
                  return <i className={goalIndex < state.goalKills ? "is-cleared" : ""} key={goalIndex} />;
                })}
              </span>
            ))}
          </div>
        </div>
        <div className="health-readout" role="meter" aria-label="Hero health" aria-valuemin={0} aria-valuemax={state.hero.maxHealth} aria-valuenow={Math.ceil(state.hero.health)}>
          <span>HP</span><b>{Math.ceil(state.hero.health)}</b><span className="health-max">/ {Math.ceil(state.hero.maxHealth)}</span>
          <i><span style={{ width: `${state.hero.health / state.hero.maxHealth * 100}%` }} /></i>
        </div>
      </header>

      <section className="battle-scene" aria-label="Battlefield">
        <div className="world-root" ref={worldRoot} />
        <div className="scene-wash" aria-hidden="true" />
        <div className="auto-battle-tag"><i /> AUTO-BATTLE</div>
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
              <span className="boss-action-copy"><b>BOSS READY</b><small>Choose when to enter</small></span>
              <button type="button" className="battle-button" onClick={() => gameStore.dispatch({ type: "start-boss" })}>
                <span aria-hidden="true">⚔</span> BATTLE
              </button>
            </>
          )}
        </div>
        <div className="skill-heading"><span>ACTIVE SKILLS</span><span>KEYS 1 · 2 · 3</span></div>
        <div className="skill-row">
          {skills.map((skill, index) => {
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
                  <span className="skill-mark"><SkillGlyph id={skill.id} /></span>
                  {cooldown > 0 && <span className="skill-cooldown-mask" aria-hidden="true" />}
                  <span className="skill-cooldown-value">{ready ? "" : cooldown.toFixed(0)}</span>
                  <span className="skill-index" aria-hidden="true">{index + 1}</span>
                </span>
                <span className="skill-name">{skill.name}</span>
                <span className="skill-state">{formatCooldown(cooldown)}</span>
              </button>
            );
          })}
        </div>
        <div className="footer-note">
          <span aria-live={audioPreferenceMessage ? "polite" : undefined} role={audioPreferenceMessage ? "status" : undefined}>
            {audioPreferenceMessage || (isBoss ? (state.phase === "boss-ready" ? "A choice awaits" : "Hold your ground") : "Your knight fights alone")}
          </span>
          <span className="save-state" aria-live="polite"><i />{saveStatus}</span>
        </div>
      </footer>
    </main>
  );
}
