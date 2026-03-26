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
});
