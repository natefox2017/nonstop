import type { EncounterDefinition, FloorTemplate, Point2 } from "./types";

const centers: readonly Point2[] = [
  { x: -10, z: -2 },
  { x: -3, z: 4 },
  { x: 4, z: -4 },
  { x: 11, z: 2 },
];

const offsets: readonly Point2[] = [
  { x: -2.2, z: -0.9 },
  { x: 0, z: -1.8 },
  { x: 2.1, z: -0.4 },
  { x: -1.3, z: 1.8 },
  { x: 1.2, z: 1.7 },
];

const encounters: EncounterDefinition[] = centers.map((center, encounterIndex) => ({
  id: `encounter-${encounterIndex + 1}`,
  center,
  goals: offsets.map((offset, goalIndex) => ({
    id: `goal-${encounterIndex + 1}-${goalIndex + 1}`,
    position: { x: center.x + offset.x, z: center.z + offset.z },
    maxHealth: 24,
  })),
}));

export const FLOOR_ONE: FloorTemplate = {
  id: "floating-meadow-v1",
  route: [
    { x: -17, z: -5 },
    ...centers,
    { x: 18, z: 0 },
  ],
  encounters,
  bossArena: { x: 17, z: -7 },
};

export function validateFloorTemplate(floor: FloorTemplate): string[] {
  const errors: string[] = [];
  if (floor.encounters.length !== 4) errors.push("Floor must contain four ordered encounters.");
  if (floor.encounters.some((encounter) => encounter.goals.length !== 5)) {
    errors.push("Each encounter must contain five registered goal enemies.");
  }
  const ids = floor.encounters.flatMap((encounter) => encounter.goals.map((goal) => goal.id));
  if (new Set(ids).size !== ids.length) errors.push("Goal IDs must be unique.");
  const coordinates = [
    ...floor.route,
    floor.bossArena,
    ...floor.encounters.flatMap((encounter) => [encounter.center, ...encounter.goals.map((goal) => goal.position)]),
  ];
  if (coordinates.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.z))) {
    errors.push("Floor coordinates must be finite.");
  }
  if (floor.route.length < floor.encounters.length + 1) errors.push("Route must connect all encounters and the exit.");
  return errors;
}
