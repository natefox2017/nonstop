import * as THREE from "three";

export function disposeObjectResources(
  root: THREE.Object3D,
  disposedTextures = new Set<THREE.Texture>(),
): void {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        const textures = Array.isArray(value) ? value : [value];
        for (const texture of textures) {
          if (texture instanceof THREE.Texture && !disposedTextures.has(texture)) {
            disposedTextures.add(texture);
            texture.dispose();
          }
        }
      }
      material.dispose();
    }
  });
}
