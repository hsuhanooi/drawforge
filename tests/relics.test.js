const { createRelicReward, addRelicToRun, getCombatEnergyBonus } = require("../src/relics");

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

    const healed = addRelicToRun(run, createRelicReward(0));
    const golded = addRelicToRun(run, createRelicReward(1));

    expect(healed.player.health).toBe(85);
    expect(golded.player.gold).toBe(114);
  });

  it("grants combat energy bonus from ember ring", () => {
    const run = { relics: [createRelicReward(2)] };

    expect(getCombatEnergyBonus(run)).toBe(1);
  });

  it("does not grant energy bonus when ember ring is absent", () => {
    const run = { relics: [createRelicReward(0)] };

    expect(getCombatEnergyBonus(run)).toBe(0);
  });
});
