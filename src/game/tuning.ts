/** Provisional graybox values for movement feel and combat pacing; these are not parity claims. */
export const GRAYBOX_TUNING = {
  heroSpeed: 6.8,
  meleeRange: 1.25,
  heroAttackSeconds: 0.68,
  heroAttackDamage: 12,
  enemyAttackSeconds: 2.8,
  enemyAttackDamage: 2,
  bossHealth: 240,
  bossAttackSeconds: 1.8,
  bossAttackDamage: 4,
  floorTransitionSeconds: 1.8,
  skills: {
    whirl: { label: "Whirl", cooldownSeconds: 8, radius: 3.8, damage: 18 },
    leap: { label: "Leap", cooldownSeconds: 10, radius: 2.8, damage: 26 },
    void: { label: "Void", cooldownSeconds: 14, radius: 0, damage: 54 },
  },
} as const;
