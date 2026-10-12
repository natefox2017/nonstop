import * as THREE from "three";
import { FLOOR_ONE } from "../game/floor";
import { gameStore } from "../game/store";
import type { GameEvent, GameState, Point2 } from "../game/types";
import { disposeObjectResources } from "./dispose";

const material = (color: string, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
const ACTOR_ASSET_ROOT = "/assets/cc0-test-set/";

type AnimatedActor = {
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  current?: string;
  busyUntil: number;
  groundOffset: number;
  dyingUntil?: number;
};

type RingEffect = { mesh: THREE.Mesh; startedAt: number; duration: number; baseScale: number };

function actorActions(root: THREE.Group, clips: THREE.AnimationClip[]): AnimatedActor {
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map(clips.map((clip) => {
    const tracks = clip.tracks.filter((track) => !/(^|\\.)root\\.position$/.test(track.name));
    const clean = new THREE.AnimationClip(clip.name, clip.duration, tracks);
    return [clean.name, mixer.clipAction(clean)];
  }));
  return { root, mixer, actions, busyUntil: 0, groundOffset: 0 };
}

function playActor(actor: AnimatedActor, name: string, seconds: number, repeat = false): void {
  const next = actor.actions.get(name);
  if (!next) return;
  if (actor.current === name && next.isRunning()) return;
  const current = actor.current ? actor.actions.get(actor.current) : undefined;
  next.reset().setLoop(repeat ? THREE.LoopRepeat : THREE.LoopOnce, repeat ? Infinity : 1);
  next.clampWhenFinished = !repeat;
  next.fadeIn(0.11).play();
  current?.fadeOut(0.11);
  actor.current = name;
  actor.busyUntil = repeat ? 0 : performance.now() / 1000 + seconds;
}

function fitActor(root: THREE.Group, targetHeight: number): number {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
  root.scale.setScalar(targetHeight / height);
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  const ground = -fitted.min.y;
  root.position.y = ground;
  return ground;
}

function releaseObject(root: THREE.Object3D): void {
  disposeObjectResources(root);
}

function makeHero(): THREE.Group {
  const hero = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 18), material("#d48a45"));
  body.scale.set(0.88, 1.05, 0.78);
  body.position.y = 0.65;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 28, 22), material("#f7d9a8", 0.68));
  head.position.y = 1.58;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.73, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.43), material("#533d35"));
  hair.position.y = 1.76;
  const eyeMat = material("#354846", 0.38);
  for (const x of [-0.23, 0.23]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), eyeMat);
    eye.position.set(x, 1.54, 0.65);
    hero.add(eye);
  }
  const cape = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.3, 5), material("#d76e57"));
  cape.position.set(0, 0.76, -0.52);
  cape.rotation.x = -0.2;
  const boots = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.2, 0.9), material("#704a36"));
  boots.position.set(0, 0.12, 0.05);
  hero.add(body, head, hair, cape, boots);
  return hero;
}

function makeEnemy(isBoss: boolean): THREE.Group {
  const enemy = new THREE.Group();
  const coat = material(isBoss ? "#657299" : "#8c8a75", 0.88);
  const body = new THREE.Mesh(new THREE.SphereGeometry(isBoss ? 0.95 : 0.56, 20, 16), coat);
  body.scale.set(1, isBoss ? 1.1 : 0.82, 0.82);
  body.position.y = isBoss ? 1.02 : 0.52;
  const head = new THREE.Mesh(new THREE.SphereGeometry(isBoss ? 0.75 : 0.49, 22, 18), material(isBoss ? "#777e9d" : "#b3aa87"));
  head.position.y = isBoss ? 2.15 : 1.24;
  const eyeMaterial = material("#f5e7bb", 0.35);
  for (const x of [-0.18, 0.18]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(isBoss ? 0.08 : 0.06, 10, 8), eyeMaterial);
    eye.position.set(x * (isBoss ? 1.35 : 1), isBoss ? 2.12 : 1.23, isBoss ? 0.65 : 0.4);
    enemy.add(eye);
  }
  if (isBoss) {
    for (const x of [-0.5, 0.5]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.65, 6), material("#d8b995"));
      horn.position.set(x, 2.86, 0);
      horn.rotation.z = x < 0 ? 0.22 : -0.22;
      enemy.add(horn);
    }
  }
  enemy.add(body, head);
  return enemy;
}

function makeIsland(): THREE.Mesh {
  const outline = new THREE.Shape();
  outline.moveTo(-23, -11);
  outline.bezierCurveTo(-27, -5, -25, 5, -19, 10);
  outline.bezierCurveTo(-14, 16, -6, 17, 0, 13);
  outline.bezierCurveTo(6, 17, 16, 15, 20, 9);
  outline.bezierCurveTo(26, 3, 26, -6, 20, -11);
  outline.bezierCurveTo(15, -16, 6, -16, 0, -12);
  outline.bezierCurveTo(-8, -17, -18, -16, -23, -11);
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 3.4,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.45,
    bevelThickness: 0.4,
  });
  geometry.rotateX(Math.PI / 2);
  const top = material("#7eb978");
  const side = material("#745b48");
  return new THREE.Mesh(geometry, [top, side]);
}

function makeCloud(x: number, y: number, z: number, scale: number): THREE.Group {
  const cloud = new THREE.Group();
  const puff = material("#f4fbf3", 0.94);
  for (const [px, py, pz, size] of [
    [0, 0, 0, 1],
    [0.8, 0.12, 0.1, 0.75],
    [-0.75, 0.08, -0.08, 0.7],
    [0.2, 0.38, -0.1, 0.62],
  ]) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), puff);
    sphere.scale.set(1.25, 0.66, 1);
    sphere.position.set(px, py, pz);
    cloud.add(sphere);
  }
  cloud.position.set(x, y, z);
  cloud.scale.setScalar(scale);
  return cloud;
}

function point3(point: Point2, y = 0): THREE.Vector3 {
  return new THREE.Vector3(point.x, y, point.z);
}

export function mountWorld(container: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", "Three dimensional floating island battle scene");
  container.append(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#b9dfec");
  scene.fog = new THREE.FogExp2("#b9dfec", 0.009);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 180);
  camera.position.set(3, 19, 26);
  camera.lookAt(0, 0, 0);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  } catch {
    container.dataset.webglError = "true";
    return () => canvas.remove();
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const hemi = new THREE.HemisphereLight("#f7fff8", "#655849", 2.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff4d7", 3.1);
  sun.position.set(-12, 25, 15);
  scene.add(sun);

  const island = makeIsland();
  island.position.y = -0.2;
  scene.add(island);

  const routePoints = FLOOR_ONE.route.map((point) => point3(point, 0.04));
  const routeCurve = new THREE.CatmullRomCurve3(routePoints);
  const route = new THREE.Mesh(
    new THREE.TubeGeometry(routeCurve, 120, 0.19, 8, false),
    material("#dac58c"),
  );
  scene.add(route);

  for (const [index, encounter] of FLOOR_ONE.encounters.entries()) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.8, 0.1, 8, 44),
      material(index % 2 === 0 ? "#d6c37f" : "#e0c58d"),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(encounter.center.x, 0.08, encounter.center.z);
    scene.add(ring);
    for (let rock = 0; rock < 4; rock += 1) {
      const angle = (rock / 4) * Math.PI * 2 + index * 0.35;
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), material("#bfab7c"));
      pebble.position.set(encounter.center.x + Math.cos(angle) * 4.2, 0.06, encounter.center.z + Math.sin(angle) * 4.2);
      scene.add(pebble);
    }
  }

  const bossMarker = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.12, 8, 44),
    material("#d3b8a5"),
  );
  bossMarker.rotation.x = Math.PI / 2;
  bossMarker.position.set(FLOOR_ONE.bossArena.x, 0.08, FLOOR_ONE.bossArena.z);
  scene.add(bossMarker);

  for (const [x, z, size] of [[-17, 15, 1.7], [8, 15, 2.1], [24, 10, 1.8], [-25, -11, 1.5], [19, -15, 2.2]] as const) {
    scene.add(makeCloud(x, -1.2, z, size));
  }

  const hero = makeHero();
  scene.add(hero);
  const enemyMeshes = new Map<string, THREE.Group>();
  const modelEnemies = new Map<string, AnimatedActor>();
  const ringEffects: RingEffect[] = [];
  const pendingEvents: GameEvent[] = [];
  const modelMixers: THREE.AnimationMixer[] = [];
  const sourceScenes: THREE.Group[] = [];
  let cloneSkinned: typeof import("three/addons/utils/SkeletonUtils.js").clone | undefined;
  let modelHero: AnimatedActor | undefined;
  let barbarianSource: THREE.Group | undefined;
  let modelClips: THREE.AnimationClip[] = [];
  let usingModels = false;
  let disposed = false;
  let previousFrameAt: number | undefined;
  let latest = gameStore.getSnapshot();
  const unsubscribe = gameStore.subscribe(() => { latest = gameStore.getSnapshot(); });
  const unsubscribeEvents = gameStore.subscribeEvents((events) => pendingEvents.push(...events));

  const makeModel = (source: THREE.Group, height: number): AnimatedActor => {
    const root = cloneSkinned?.(source) as THREE.Group | undefined;
    if (!root) throw new Error("Skinned model clone helper was not loaded.");
    const actor = actorActions(root, modelClips);
    actor.groundOffset = fitActor(root, height);
    modelMixers.push(actor.mixer);
    return actor;
  };
  const addEnemyModel = (enemy: GameState["enemies"][number]) => {
    if (!barbarianSource || modelEnemies.has(enemy.id)) return;
    const actor = makeModel(barbarianSource, enemy.kind === "boss" ? 3.4 : 2.35);
    modelEnemies.set(enemy.id, actor);
    scene.add(actor.root);
    playActor(actor, "Melee_Unarmed_Idle", 0, true);
  };
  void Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/utils/SkeletonUtils.js"),
  ]).then(async ([{ GLTFLoader }, skeletonUtils]) => {
    cloneSkinned = skeletonUtils.clone;
    const loader = new GLTFLoader();
    const [knight, barbarian, general, movement, combat] = await Promise.all([
      loader.loadAsync(`${ACTOR_ASSET_ROOT}Knight.glb`),
      loader.loadAsync(`${ACTOR_ASSET_ROOT}Barbarian.glb`),
      loader.loadAsync(`${ACTOR_ASSET_ROOT}Rig_Medium_General.glb`),
      loader.loadAsync(`${ACTOR_ASSET_ROOT}Rig_Medium_MovementBasic.glb`),
      loader.loadAsync(`${ACTOR_ASSET_ROOT}Rig_Medium_CombatMelee.glb`),
    ]);
    const loadedScenes = [knight.scene, barbarian.scene, general.scene, movement.scene, combat.scene];
    if (disposed) {
      loadedScenes.forEach(releaseObject);
      return;
    }
    sourceScenes.push(...loadedScenes);
    barbarianSource = barbarian.scene;
    modelClips = [...general.animations, ...movement.animations, ...combat.animations];
    modelHero = makeModel(knight.scene, 2.5);
    scene.add(modelHero.root);
    playActor(modelHero, "Idle_A", 0, true);
    for (const enemy of latest.enemies) addEnemyModel(enemy);
    usingModels = true;
    hero.visible = false;
    for (const mesh of enemyMeshes.values()) mesh.visible = false;
  }).catch((error: unknown) => {
    if (disposed) return;
    container.dataset.modelFallback = "true";
    console.warn("Temporary CC0 actor models could not be loaded; using procedural graybox actors.", error);
  });

  const emitRing = (point: Point2, color: string, scale: number, duration: number, now: number) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.055, 8, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, depthWrite: false }),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(point.x, 0.16, point.z);
    mesh.scale.setScalar(0.28);
    scene.add(mesh);
    ringEffects.push({ mesh, startedAt: now, duration, baseScale: scale });
  };

  const processEvents = (now: number) => {
    for (const event of pendingEvents.splice(0)) {
      if (event.type === "skill-cast") {
        if (modelHero) {
          const clip = event.skillId === "whirl" ? "Melee_2H_Attack_Spinning"
            : event.skillId === "leap" ? "Jump_Full_Short" : "Use_Item";
          playActor(modelHero, clip, event.skillId === "leap" ? 0.55 : 0.72);
        }
        if (event.skillId === "whirl") emitRing(event.heroTo, "#f7ba51", 4.2, 0.45, now);
        if (event.skillId === "leap") emitRing(event.heroTo, "#68d4e6", 2.9, 0.38, now);
      } else if (event.type === "basic-attack") {
        if (modelHero) playActor(modelHero, "Melee_1H_Attack_Slice_Horizontal", 0.52);
      } else if (event.type === "enemy-hit") {
        const actor = modelEnemies.get(event.enemyId);
        if (actor) playActor(actor, "Hit_A", 0.3);
        emitRing(event.position, event.source === "basic" ? "#fff0ba" : "#86e9ed", 1.4, 0.2, now);
      } else if (event.type === "hero-hit") {
        if (modelHero) playActor(modelHero, "Hit_A", 0.32);
      } else if (event.type === "enemy-defeated") {
        const actor = modelEnemies.get(event.enemyId);
        if (actor) {
          actor.dyingUntil = now + 1.05;
          playActor(actor, "Death_A", 0.9);
        }
      }
    }
  };

  const resize = () => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    const state: GameState = latest;
    const frameAt = performance.now();
    const dt = previousFrameAt === undefined ? 0 : Math.min((frameAt - previousFrameAt) / 1000, 0.05);
    previousFrameAt = frameAt;
    const now = frameAt / 1000;
    processEvents(now);
    hero.visible = !usingModels;
    hero.position.set(state.hero.position.x, 0, state.hero.position.z);
    const target = state.enemies[0];
    if (target) {
      hero.rotation.y = Math.atan2(target.position.x - state.hero.position.x, target.position.z - state.hero.position.z);
    }
    const desiredCamera = new THREE.Vector3(state.hero.position.x + 1.5, 18, state.hero.position.z + 23);
    camera.position.lerp(desiredCamera, 0.045);
    camera.lookAt(state.hero.position.x, 0.7, state.hero.position.z - 0.3);

    const visibleEnemyIds = new Set(state.enemies.map((enemy) => enemy.id));
    for (const [id, mesh] of enemyMeshes) {
      if (!visibleEnemyIds.has(id)) {
        scene.remove(mesh);
        disposeObjectResources(mesh);
        enemyMeshes.delete(id);
      }
    }
    for (const enemy of state.enemies) {
      let mesh = enemyMeshes.get(enemy.id);
      if (!mesh) {
        mesh = makeEnemy(enemy.kind === "boss");
        enemyMeshes.set(enemy.id, mesh);
        scene.add(mesh);
      }
      mesh.visible = !usingModels;
      mesh.position.set(enemy.position.x, 0, enemy.position.z);
      const bob = state.elapsedSeconds * 2 + enemy.id.length;
      mesh.position.y += Math.sin(bob) * 0.055;
      const facing = Math.atan2(state.hero.position.x - enemy.position.x, state.hero.position.z - enemy.position.z);
      mesh.rotation.y = facing;
    }

    if (usingModels && modelHero) {
      const moving = Math.hypot(state.hero.position.x - modelHero.root.position.x, state.hero.position.z - modelHero.root.position.z) > 0.025;
      modelHero.root.position.set(state.hero.position.x, modelHero.groundOffset, state.hero.position.z);
      if (target) modelHero.root.rotation.y = Math.atan2(target.position.x - state.hero.position.x, target.position.z - state.hero.position.z);
      if (now >= modelHero.busyUntil) playActor(modelHero, moving ? "Running_A" : "Idle_A", 0, true);
      modelHero.mixer.update(dt);

      for (const enemy of state.enemies) addEnemyModel(enemy);
      for (const [id, actor] of modelEnemies) {
        const enemy = state.enemies.find((candidate) => candidate.id === id);
        if (!enemy && (!actor.dyingUntil || now >= actor.dyingUntil)) {
          scene.remove(actor.root);
          modelEnemies.delete(id);
          continue;
        }
        if (enemy) {
          const dx = enemy.position.x - state.hero.position.x;
          const dz = enemy.position.z - state.hero.position.z;
          const distance = Math.hypot(dx, dz) || 1;
          const visualSeparation = enemy.kind === "boss" ? 0.6 : 0.3;
          actor.root.position.set(
            enemy.position.x + dx / distance * visualSeparation,
            actor.groundOffset,
            enemy.position.z + dz / distance * visualSeparation,
          );
          actor.root.rotation.y = Math.atan2(state.hero.position.x - enemy.position.x, state.hero.position.z - enemy.position.z);
          if (now >= actor.busyUntil && !actor.dyingUntil) playActor(actor, "Melee_Unarmed_Idle", 0, true);
        }
        actor.mixer.update(dt);
      }
    }

    for (let i = ringEffects.length - 1; i >= 0; i -= 1) {
      const effect = ringEffects[i];
      const progress = Math.min((now - effect.startedAt) / effect.duration, 1);
      effect.mesh.scale.setScalar(0.28 + (effect.baseScale - 0.28) * progress);
      const fade = 1 - progress;
      (effect.mesh.material as THREE.MeshBasicMaterial).opacity = 0.78 * fade;
      if (progress >= 1) {
        scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        (effect.mesh.material as THREE.MeshBasicMaterial).dispose();
        ringEffects.splice(i, 1);
      }
    }
    renderer.render(scene, camera);
  });

  return () => {
    disposed = true;
    unsubscribe();
    unsubscribeEvents();
    observer.disconnect();
    renderer.setAnimationLoop(null);
    modelMixers.forEach((mixer) => mixer.stopAllAction());
    const disposedTextures = new Set<THREE.Texture>();
    sourceScenes.forEach((source) => disposeObjectResources(source, disposedTextures));
    for (const mesh of [hero, ...enemyMeshes.values()]) {
      disposeObjectResources(mesh, disposedTextures);
    }
    disposeObjectResources(scene, disposedTextures);
    renderer.dispose();
    canvas.remove();
  };
}
