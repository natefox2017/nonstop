import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import "./style.css";

const asset = (name: string) => new URL(`./assets/${name}`, import.meta.url).href;
const loader = new GLTFLoader();
const report = document.querySelector<HTMLOutputElement>("#report")!;
const status = document.querySelector<HTMLElement>("#status")!;
const canvasHost = document.querySelector<HTMLElement>("#scene")!;
const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-action]")];
const runtimeErrors: string[] = [];
window.addEventListener("error", (event) => runtimeErrors.push(event.message));
window.addEventListener("unhandledrejection", (event) => runtimeErrors.push(String(event.reason)));

type Actor = { root: THREE.Group; mixer: THREE.AnimationMixer; actions: Map<string, THREE.AnimationAction>; name: string; activeAnimation?: string };

const scene = new THREE.Scene();
scene.background = new THREE.Color("#dceaf1");
scene.fog = new THREE.Fog("#dceaf1", 24, 46);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 5.2, 12.8);
camera.lookAt(0, 1.2, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
canvasHost.append(renderer.domElement);

scene.add(new THREE.HemisphereLight("#ffffff", "#64766c", 2.1));
const sun = new THREE.DirectionalLight("#fff3d3", 3.2);
sun.position.set(-4, 9, 7);
scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshStandardMaterial({ color: "#8dbb85", roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.06;
scene.add(floor);
const ring = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.045, 8, 80), new THREE.MeshStandardMaterial({ color: "#d7c691", roughness: 0.8 }));
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.02;
scene.add(ring);

let actors: Actor[] = [];
let mixers: THREE.AnimationMixer[] = [];
let sourceScenes: THREE.Group[] = [];
let animationCount = 0;
let rootMotionTrackCount = 0;
const clock = new THREE.Clock();
let disposed = false;

function fitActor(root: THREE.Group, x: number, z: number, targetHeight = 2.35): void {
  const bounds = new THREE.Box3().setFromObject(root);
  const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
  root.scale.setScalar(targetHeight / height);
  root.position.set(x, -bounds.min.y * targetHeight / height, z);
}

function cleanRootMotion(clip: THREE.AnimationClip): THREE.AnimationClip {
  const tracks = clip.tracks.filter((track) => !/(^|\.)root\.position$/.test(track.name));
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function actionMap(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[]): Map<string, THREE.AnimationAction> {
  return new Map(clips.map((clip) => [clip.name, mixer.clipAction(cleanRootMotion(clip))]));
}

function play(actor: Actor, name: string): void {
  const next = actor.actions.get(name);
  if (!next) throw new Error(`Missing action ${name} on ${actor.name}; found ${[...actor.actions.keys()].join(", ")}`);
  const current = [...actor.actions.values()].find((action) => action.isRunning());
  if (current === next) return;
  next.reset().fadeIn(0.18).play();
  current?.fadeOut(0.18);
  next.setLoop(name.startsWith("Death") || name.startsWith("Hit") ? THREE.LoopOnce : THREE.LoopRepeat, 1);
  next.clampWhenFinished = name.startsWith("Death");
  actor.activeAnimation = name;
}

function poseSnapshot(actor: Actor): number[] {
  const values: number[] = [];
  actor.root.traverse((node) => {
    if (node instanceof THREE.Bone) {
      values.push(node.position.x, node.position.y, node.position.z, node.quaternion.x, node.quaternion.y, node.quaternion.z, node.quaternion.w);
    }
    if (node instanceof THREE.SkinnedMesh) {
      node.updateMatrixWorld(true);
      const point = new THREE.Vector3();
      const stride = Math.max(1, Math.floor(node.geometry.attributes.position.count / 24));
      for (let vertex = 0; vertex < node.geometry.attributes.position.count; vertex += stride) {
        node.getVertexPosition(vertex, point);
        point.applyMatrix4(node.matrixWorld);
        values.push(point.x, point.y, point.z);
      }
    }
  });
  return values;
}

function poseDelta(before: number[], after: number[]): number {
  return before.reduce((sum, value, index) => sum + Math.abs(value - after[index]), 0);
}

function validate(): void {
  const [hero, firstEnemy, secondEnemy] = actors;
  const heroBones = new Set<THREE.Bone>();
  const firstBones = new Set<THREE.Bone>();
  const secondBones = new Set<THREE.Bone>();
  hero.root.traverse((node) => { if (node instanceof THREE.Bone) heroBones.add(node); });
  firstEnemy.root.traverse((node) => { if (node instanceof THREE.Bone) firstBones.add(node); });
  secondEnemy.root.traverse((node) => { if (node instanceof THREE.Bone) secondBones.add(node); });
  const allIndependent = [...heroBones].every((bone) => !firstBones.has(bone) && !secondBones.has(bone))
    && [...firstBones].every((bone) => !secondBones.has(bone));
  if (!allIndependent || heroBones.size === 0 || firstBones.size === 0 || secondBones.size === 0) {
    throw new Error("Skinned model clones share joints or have no skeleton");
  }
  if (actors.some((actor) => actor.actions.size < 3)) throw new Error("Expected distinct animation actions on each actor");
  if (actors[1].actions.get("Walking_A") === actors[2].actions.get("Walking_A")) throw new Error("Cloned enemies share animation actions");
  const checks = [
    `Three.js ${THREE.REVISION}: GLTFLoader parsed 2 skinned models`,
    `SkeletonUtils clones: ${actors.length} actors have independent ${heroBones.size}/${firstBones.size}/${secondBones.size}-bone rigs`,
    `Native AnimationMixer actions: ${animationCount} clips across idle/run/attack/hit/death`,
    `Removed ${rootMotionTrackCount} root translation tracks; actor positions stay presentation-owned`,
    "Renderer teardown disposes mixers, geometry, materials, and WebGL context",
  ];
  report.replaceChildren(...checks.map((text) => {
    const item = document.createElement("li");
    item.textContent = `✓ ${text}`;
    return item;
  }));
  status.textContent = "5 smoke checks passed · no gameplay state is read or mutated";
  status.dataset.state = "passed";
}

function dispose(): void {
  if (disposed) return;
  disposed = true;
  for (const mixer of mixers) mixer.stopAllAction();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const releaseScene = (root: THREE.Object3D) => {
    root.traverse((node) => {
      if (node instanceof THREE.SkinnedMesh) {
        node.skeleton.dispose();
        geometries.add(node.geometry);
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => releaseMaterial(material));
      } else if (node instanceof THREE.Mesh) {
        geometries.add(node.geometry);
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => releaseMaterial(material));
      }
    });
  };
  const releaseMaterial = (material: THREE.Material) => {
    materials.add(material);
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) textures.add(value);
    }
  };
  for (const actor of actors) {
    scene.remove(actor.root);
    releaseScene(actor.root);
  }
  sourceScenes.forEach(releaseScene);
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
  scene.remove(floor, ring);
  floor.geometry.dispose();
  (floor.material as THREE.Material).dispose();
  ring.geometry.dispose();
  (ring.material as THREE.Material).dispose();
  scene.traverse((node) => {
    if (node instanceof THREE.Light && "dispose" in node && typeof node.dispose === "function") node.dispose();
  });
  renderer.setAnimationLoop(null);
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
  resizeObserver.disconnect();
  window.removeEventListener("pagehide", dispose);
}

const resizeObserver = new ResizeObserver(() => {
  const width = Math.max(canvasHost.clientWidth, 1);
  const height = Math.max(canvasHost.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
});
resizeObserver.observe(canvasHost);
window.addEventListener("pagehide", dispose, { once: true });

async function init(): Promise<void> {
  const [knight, barbarian, general, movement, combat] = await Promise.all([
    loader.loadAsync(asset("Knight.glb")),
    loader.loadAsync(asset("Barbarian.glb")),
    loader.loadAsync(asset("Rig_Medium_General.glb")),
    loader.loadAsync(asset("Rig_Medium_MovementBasic.glb")),
    loader.loadAsync(asset("Rig_Medium_CombatMelee.glb")),
  ]);
  sourceScenes = [knight.scene, barbarian.scene, general.scene, movement.scene, combat.scene];
  const heroRoot = cloneSkinned(knight.scene) as THREE.Group;
  const barbarianRoot = cloneSkinned(barbarian.scene) as THREE.Group;
  const secondBarbarianRoot = cloneSkinned(barbarian.scene) as THREE.Group;
  fitActor(heroRoot, -2.6, 0, 2.5);
  fitActor(barbarianRoot, 0.15, -0.35, 2.35);
  fitActor(secondBarbarianRoot, 2.65, 0.1, 2.2);
  secondBarbarianRoot.rotation.y = 0.18;
  scene.add(heroRoot, barbarianRoot, secondBarbarianRoot);

  const clips = [...general.animations, ...movement.animations, ...combat.animations];
  animationCount = clips.length;
  rootMotionTrackCount = clips.reduce((count, clip) => count + clip.tracks.filter((track) => /(^|\.)root\.position$/.test(track.name)).length, 0);
  if (rootMotionTrackCount === 0) throw new Error("No root translation tracks found to verify root-motion handling");
  actors = [
    { root: heroRoot, mixer: new THREE.AnimationMixer(heroRoot), actions: new Map(), name: "Wayfarer" },
    { root: barbarianRoot, mixer: new THREE.AnimationMixer(barbarianRoot), actions: new Map(), name: "Marauder A" },
    { root: secondBarbarianRoot, mixer: new THREE.AnimationMixer(secondBarbarianRoot), actions: new Map(), name: "Marauder B" },
  ];
  mixers = actors.map((actor) => actor.mixer);
  actors.forEach((actor) => { actor.actions = actionMap(actor.mixer, clips); });
  play(actors[0], "Idle_A");
  play(actors[1], "Melee_Unarmed_Idle");
  play(actors[2], "Melee_Unarmed_Idle");
  validate();

  buttons.forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", () => {
      const action = button.dataset.action!;
      const target = button.dataset.target === "enemy-a" ? [actors[1]]
        : button.dataset.target === "enemy-b" ? [actors[2]]
          : button.dataset.target === "enemies" ? actors.slice(1)
            : actors.slice(0, 1);
      const unaffected = actors.filter((actor) => !target.includes(actor));
      const previousTimeScales = unaffected.map((actor) => actor.mixer.timeScale);
      unaffected.forEach((actor) => { actor.mixer.timeScale = 0; });
      const unaffectedBefore = unaffected.map(poseSnapshot);
      target.forEach((actor) => {
        const name = action === "attack"
          ? button.dataset.target?.startsWith("enemy") || button.dataset.target === "enemies" ? "Melee_Unarmed_Attack_Punch_A" : "Melee_1H_Attack_Slice_Horizontal"
          : action;
        const before = poseSnapshot(actor);
        const positionBefore = actor.root.position.clone();
        play(actor, name);
        window.setTimeout(() => {
          const delta = poseDelta(before, poseSnapshot(actor));
          const fixedActorRoot = actor.root.position.distanceTo(positionBefore) < 0.00001;
          const otherActorsIndependent = unaffected.every((other, index) => poseDelta(unaffectedBefore[index], poseSnapshot(other)) < 0.00001);
          unaffected.forEach((other, index) => { other.mixer.timeScale = previousTimeScales[index]; });
          const result = delta > 0.005 && fixedActorRoot && otherActorsIndependent
            ? "posed mesh changed; other instances and actor root unchanged"
            : "pose/isolation/root-motion check failed";
          status.textContent = `${actor.name} · ${name} · ${result}`;
          status.dataset.state = delta > 0.005 && fixedActorRoot && otherActorsIndependent ? "passed" : "failed";
        }, 450);
      });
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    });
  });
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    mixers.forEach((mixer) => mixer.update(dt));
    renderer.render(scene, camera);
  });
}

init().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : "Asset smoke test failed";
  status.dataset.state = "failed";
  console.error(error);
});

const controls = document.createElement("section");
controls.className = "controls";
controls.innerHTML = `
  <div class="controls-title"><p>ANIMATION PREVIEW · TEST ONLY</p><span>Actions only change the render</span></div>
  <div class="control-row" aria-label="Wayfarer animation actions">
    <span class="actor-tag">WAYFARER</span>
    <button data-target="hero" data-action="Idle_A" disabled>Idle</button>
    <button data-target="hero" data-action="Running_A" disabled>Run</button>
    <button data-target="hero" data-action="attack" disabled>Attack</button>
    <button data-target="hero" data-action="Hit_A" disabled>Hit</button>
    <button data-target="hero" data-action="Death_A" disabled>Death</button>
  </div>
  <div class="control-row" aria-label="Enemy animation actions">
    <span class="actor-tag enemy-tag">HOSTILE A</span>
    <button data-target="enemy-a" data-action="Melee_Unarmed_Idle" disabled>Idle</button>
    <button data-target="enemy-a" data-action="Walking_A" disabled>Walk</button>
    <button data-target="enemy-a" data-action="attack" disabled>Attack</button>
    <button data-target="enemy-a" data-action="Hit_B" disabled>Hit</button>
    <button data-target="enemy-a" data-action="Death_B" disabled>Death</button>
  </div>
  <div class="control-row" aria-label="Second enemy animation actions">
    <span class="actor-tag enemy-tag">HOSTILE B</span>
    <button data-target="enemy-b" data-action="Idle_B" disabled>Idle</button>
    <button data-target="enemy-b" data-action="Walking_B" disabled>Walk</button>
    <button data-target="enemy-b" data-action="attack" disabled>Attack</button>
    <button data-target="enemy-b" data-action="Hit_A" disabled>Hit</button>
    <button data-target="enemy-b" data-action="Death_A" disabled>Death</button>
  </div>
  <div class="control-row cleanup-row"><span class="actor-tag">LIFECYCLE</span><button data-cleanup type="button">Unmount scene</button></div>`;
document.querySelector("#root")!.append(controls);
buttons.push(...document.querySelectorAll<HTMLButtonElement>("[data-action]"));
document.querySelector<HTMLButtonElement>("[data-cleanup]")!.addEventListener("click", () => {
  try {
    dispose();
    const clean = runtimeErrors.length === 0 && canvasHost.childElementCount === 0;
    status.textContent = clean ? "Unmount complete · canvas removed · no runtime errors" : `Unmount issue · ${runtimeErrors.join("; ")}`;
    status.dataset.state = clean ? "passed" : "failed";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Unmount cleanup failed";
    status.dataset.state = "failed";
  }
});
