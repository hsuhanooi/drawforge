const { generateMap } = require("../src/map");
const { resolveNode } = require("../src/nodeResolver");
const { createVictoryRewards } = require("../src/rewards");

describe("expanded run content", () => {
  it("generates map content with combat, event, elite, and boss nodes", () => {
    const map = generateMap({ rows: 5, columns: 3 });
    const types = new Set(map.nodes.map((node) => node.type));

    expect(types.has("combat")).toBe(true);
    expect(types.has("event")).toBe(true);
    expect(types.has("elite")).toBe(true);
    expect(types.has("boss")).toBe(true);
  });

  it("resolves event nodes into non-combat rewards", () => {
    const result = resolveNode({
      node: { id: "r1c1", type: "event", row: 1, col: 1 },
      player: { health: 80 }
    });

    expect(result.state).toBe("event");
    expect(result.event).toHaveProperty("kind");
    expect(Array.isArray(result.event.options)).toBe(true);
    expect(result.combat).toBeNull();
  });

  it("generates bigger rewards for elite and boss victories", () => {
    const eliteRewards = createVictoryRewards("elite");
    const bossRewards = createVictoryRewards("boss");

    expect(eliteRewards.relics).toHaveLength(3);
    expect(bossRewards.relic).not.toBeNull();
    expect(bossRewards.gold).toBeGreaterThan(eliteRewards.gold);
  });

  it("elite rewards include 3 relic choices with common or uncommon rarity", () => {
    for (let i = 0; i < 20; i += 1) {
      const eliteRewards = createVictoryRewards("elite");
      expect(eliteRewards.relics).toHaveLength(3);
      eliteRewards.relics.forEach((relic) => {
        expect(["common", "uncommon"]).toContain(relic.rarity);
      });
    }
  });
});
