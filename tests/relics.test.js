const { RELICS, createRelicReward, addRelicToRun, getCombatEnergyBonus } = require("../src/relics");

describe("relic system", () => {
  it("creates deterministic relic rewards", () => {
    const relic = createRelicReward(1);

    expect(relic).toHaveProperty("id");
    expect(relic).toHaveProperty("name");
  });

  it("applies relic effects to the run", () => {
    const run = {
      player: { health: 80, gold: 99 },
      relics: []
    };

    const ironCore = RELICS.find((r) => r.id === "iron_core");
    const featherCharm = RELICS.find((r) => r.id === "feather_charm");

    const healed = addRelicToRun(run, ironCore);
    const golded = addRelicToRun(run, featherCharm);

    expect(healed.player.health).toBe(85);
    expect(golded.player.gold).toBe(114);
  });

  it("grants combat energy bonus from ember ring", () => {
    const emberRing = RELICS.find((r) => r.id === "ember_ring");
    const run = { relics: [emberRing] };

    expect(getCombatEnergyBonus(run)).toBe(1);
  });

  it("does not grant energy bonus when ember ring is absent", () => {
    const ironCore = RELICS.find((r) => r.id === "iron_core");
    const run = { relics: [ironCore] };

    expect(getCombatEnergyBonus(run)).toBe(0);
  });

  it("all relics have a rarity field", () => {
    const validRarities = new Set(["common", "uncommon", "rare", "boss"]);
    for (const relic of RELICS) {
      expect(validRarities.has(relic.rarity)).toBe(true);
    }
  });

  it("has 44 relics total", () => {
    expect(RELICS).toHaveLength(44);
  });

  it("tier 1 reward (elite) only returns common or uncommon relics", () => {
    // Run many samples to verify no rare ever comes from tier 1
    for (let i = 0; i < 50; i += 1) {
      const relic = createRelicReward(1);
      expect(["common", "uncommon"]).toContain(relic.rarity);
    }
  });

  it("tier 2 reward (boss) only returns uncommon or rare relics", () => {
    // Run many samples to verify no common ever comes from tier 2
    for (let i = 0; i < 50; i += 1) {
      const relic = createRelicReward(2);
      expect(["uncommon", "rare"]).toContain(relic.rarity);
    }
  });

  it("bone token has no immediate health effect on acquisition", () => {
    const run = { player: { health: 80, gold: 99 }, relics: [] };
    const boneToken = RELICS.find((r) => r.id === "bone_token");
    const result = addRelicToRun(run, boneToken);
    expect(result.player.health).toBe(80);
  });

  it("phoenix ash is rare", () => {
    const phoenixAsh = RELICS.find((r) => r.id === "phoenix_ash");
    expect(phoenixAsh.rarity).toBe("rare");
  });
});
