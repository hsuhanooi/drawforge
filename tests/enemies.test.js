const { createEnemyForNode, resolveEnemyIntent } = require("../src/enemies");

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
    const boss = createEnemyForNode({ row: 4, col: 1, type: "boss" });

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
