import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { disposeObjectResources } from "./dispose";

describe("Three.js resource disposal", () => {
  it("disposes shared material textures once across meshes", () => {
    const texture = new THREE.Texture();
    const textureDispose = vi.spyOn(texture, "dispose");
    const sharedTextureSet = new Set<THREE.Texture>();
    const source = new THREE.Group();
    const clone = new THREE.Group();
    const first = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ map: texture }));
    const second = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial({ map: texture }));
    source.add(first);
    clone.add(second);

    disposeObjectResources(source, sharedTextureSet);
    disposeObjectResources(clone, sharedTextureSet);

    expect(textureDispose).toHaveBeenCalledOnce();
  });
});
