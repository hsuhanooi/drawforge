const { createEnemyForNode, resolveEnemyIntent, selectBossForAct, act1BossPool, act2BossPool, act3BossPool } = require("../src/enemies");

describe("enemy selection", () => {
  it("creates deterministic basic enemies for combat nodes", () => {
    const enemy = createEnemyForNode({ row: 0, col: 1, type: "combat" });

    expect(enemy).toHaveProperty("id");
    expect(enemy).toHaveProperty("health");
    expect(enemy).toHaveProperty("damage");
    expect(Array.isArray(enemy.intents)).toBe(true);
  });

  it("creates stronger enemies for elite and boss nodes", () => {
    const elite = createEnemyForNode({ row: 3, col: 0, type: "elite" });
    // Use act 2 boss to ensure pool boss is clearly stronger than act 1 elites
    const boss = createEnemyForNode({ row: 4, col: 1, type: "boss" }, 2);

    expect(elite.health).toBeGreaterThan(30);
    expect(boss.health).toBeGreaterThan(elite.health);
    expect(boss.damage).toBeGreaterThan(elite.damage);
  });

  it("provides readable intent labels", () => {
    const fangling = createEnemyForNode({ row: 0, col: 1, type: "combat" });
    const intent = resolveEnemyIntent(fangling, 0);

    expect(intent).toHaveProperty("label");
    expect(typeof intent.label).toBe("string");
  });

  it("adds presentation asset metadata for enemies", () => {
    const enemy = createEnemyForNode({ row: 0, col: 0, type: "combat" });

    expect(enemy.assetRef).toBe(`enemies/${enemy.id}`);
    expect(enemy.presentation.enemy.assetRef).toBe(`enemies/${enemy.id}`);
    expect(enemy.presentation.icon.assetRef).toBe(`icons/${enemy.id}`);
    expect(enemy.presentation.background.assetRef).toBe("backgrounds/combat_default");
  });

  it("includes poison and burn enemy intents in the combat pool", () => {
    const seen = new Set();
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        seen.add(createEnemyForNode({ row, col, type: "combat" }).id);
      }
    }

    expect(seen.has("plague_rat")).toBe(true);
    expect(seen.has("cinder_shade")).toBe(true);
    expect(seen.has("venomfang")).toBe(true);
  });

  it("scales boss enemies for higher ascension levels", () => {
    const baseBoss = createEnemyForNode({ row: 4, col: 1, type: "boss" }, 3, 0);
    const ascBoss = createEnemyForNode({ row: 4, col: 1, type: "boss" }, 3, 5);

    expect(ascBoss.health).toBeGreaterThan(baseBoss.health);
    expect(ascBoss.damage).toBeGreaterThan(baseBoss.damage);
    expect(ascBoss.phase).toBe(2);
  });
});

describe("boss pool randomization", () => {
  it("Act 1 boss pool has 3 entries", () => {
    expect(act1BossPool).toHaveLength(3);
    const names = act1BossPool.map((f) => f().name);
    expect(names).toContain("Spire Guardian");
    expect(names).toContain("Crypt Warden");
    expect(names).toContain("Stone Idol");
  });

  it("Act 2 boss pool has 3 entries", () => {
    expect(act2BossPool).toHaveLength(3);
    const names = act2BossPool.map((f) => f().name);
    expect(names).toContain("Void Sovereign");
    expect(names).toContain("Hex Lord");
    expect(names).toContain("Bone Emperor");
  });

  it("Act 3 boss pool always returns The Undying", () => {
    expect(act3BossPool).toHaveLength(1);
    expect(selectBossForAct(3, "seed_a").name).toBe("The Undying");
    expect(selectBossForAct(3, "seed_b").name).toBe("The Undying");
  });

  it("selectBossForAct is deterministic for the same seed", () => {
    const boss1 = selectBossForAct(1, "run-42");
    const boss2 = selectBossForAct(1, "run-42");
    expect(boss1.name).toBe(boss2.name);
  });

  it("different seeds can produce different Act 1 bosses", () => {
    const names = new Set();
    for (let i = 0; i < 50; i++) {
      names.add(selectBossForAct(1, `seed-${i}`).name);
    }
    expect(names.size).toBeGreaterThan(1);
  });

  it("different seeds can produce different Act 2 bosses", () => {
    const names = new Set();
    for (let i = 0; i < 50; i++) {
      names.add(selectBossForAct(2, `seed-${i}`).name);
    }
    expect(names.size).toBeGreaterThan(1);
  });
});
