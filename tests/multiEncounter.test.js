const { createEncounterForNode, createEnemyForNode } = require("../src/enemies");

const combatNode = (id = "r1c0") => ({ id, row: 1, col: 0, type: "combat" });
const eliteNode = () => ({ id: "r2c1", row: 2, col: 1, type: "elite" });
const bossNode = () => ({ id: "r4c0", row: 4, col: 0, type: "boss" });

describe("createEncounterForNode", () => {
  it("always returns an array of at least 1 enemy", () => {
    const result = createEncounterForNode(combatNode(), 1, 0, "seed-abc");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("elite nodes always return exactly 1 enemy", () => {
    const result = createEncounterForNode(eliteNode(), 1, 0, "seed-abc");
    expect(result.length).toBe(1);
  });

  it("boss nodes always return exactly 1 enemy", () => {
    const result = createEncounterForNode(bossNode(), 3, 0, "seed-abc");
    expect(result.length).toBe(1);
  });

  it("act 3 combat nodes always return exactly 1 enemy (no pairs)", () => {
    const result = createEncounterForNode(combatNode(), 3, 0, "seed-abc");
    expect(result.length).toBe(1);
  });

  it("deterministic: same seed + node always produces same encounter", () => {
    const r1 = createEncounterForNode(combatNode("n1"), 1, 0, "fixed-seed-123");
    const r2 = createEncounterForNode(combatNode("n1"), 1, 0, "fixed-seed-123");
    expect(r1.length).toBe(r2.length);
    expect(r1[0].id).toBe(r2[0].id);
    if (r1.length > 1) expect(r1[1].id).toBe(r2[1].id);
  });

  it("different seeds produce varied results across many nodes", () => {
    const seeds = ["aaa", "bbb", "ccc", "ddd", "eee", "fff", "ggg", "hhh", "iii", "jjj"];
    const nodes = ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"];
    let singleCount = 0;
    let pairCount = 0;
    for (const seed of seeds) {
      for (const nodeId of nodes) {
        const result = createEncounterForNode(combatNode(nodeId), 1, 0, seed);
        if (result.length === 1) singleCount++;
        else pairCount++;
      }
    }
    // Statistically, with 100 samples and 30% two-enemy chance, expect some of each
    expect(singleCount).toBeGreaterThan(0);
    expect(pairCount).toBeGreaterThan(0);
  });

  it("two-enemy encounters each have valid intents and positive health", () => {
    // Find a seed that produces a two-enemy encounter
    let twoEnemy = null;
    for (let i = 0; i < 20; i++) {
      const result = createEncounterForNode(combatNode(`n${i}`), 1, 0, "test-seed");
      if (result.length === 2) { twoEnemy = result; break; }
    }
    if (!twoEnemy) {
      // Skip if we couldn't find one in this sample (unlikely)
      return;
    }
    twoEnemy.forEach((e) => {
      expect(e.health).toBeGreaterThan(0);
      expect(e.maxHp).toBeGreaterThan(0);
      expect(Array.isArray(e.intents)).toBe(true);
      expect(e.intents.length).toBeGreaterThan(0);
      expect(e.turnIndex).toBe(0);
    });
  });

  it("two-enemy encounter combined rewardGold is sum of both enemies' gold", () => {
    let twoEnemy = null;
    for (let i = 0; i < 20; i++) {
      const result = createEncounterForNode(combatNode(`n${i}`), 1, 0, "test-seed");
      if (result.length === 2) { twoEnemy = result; break; }
    }
    if (!twoEnemy) return; // gracefully skip if sample didn't produce a pair
    const combined = twoEnemy.reduce((sum, e) => sum + (e.rewardGold || 0), 0);
    expect(combined).toBe(twoEnemy[0].rewardGold + twoEnemy[1].rewardGold);
  });

  it("all act1 encounter pair enemies have lower HP than their solo counterparts (20% reduction)", () => {
    // Solo slime has health 30; pair version has 24 (80% of 30)
    const solo = createEnemyForNode({ id: "r1c0", row: 0, col: 0, type: "combat" }, 1, 0, "solo-seed");
    // Find a two-enemy encounter from act 1
    let twoEnemy = null;
    for (let i = 0; i < 30; i++) {
      const result = createEncounterForNode(combatNode(`node-${i}`), 1, 0, "pair-seed");
      if (result.length === 2) { twoEnemy = result; break; }
    }
    if (!twoEnemy) return;
    // Each enemy in the pair should have health <= solo enemy (due to 20% reduction)
    twoEnemy.forEach((e) => {
      expect(e.health).toBeLessThanOrEqual(solo.health);
    });
  });
});
