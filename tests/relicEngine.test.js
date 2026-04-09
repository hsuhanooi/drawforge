const { addRelicToRun, getCombatEnergyBonus, RELICS } = require("../src/relics");
const { startCombatForNode, endCombatTurn } = require("../src/browserCombatActions");
const { applyVictoryToRun } = require("../src/browserPostNodeActions");

const makeRun = (relicIds = [], overrides = {}) => ({
  player: {
    health: 80,
    maxHealth: 80,
    gold: 0,
    deck: ["strike", "strike", "defend", "defend", "strike"],
    ...overrides.player
  },
  relics: relicIds.map((id) => {
    const relic = RELICS.find((entry) => entry.id === id);
    return relic || { id, name: id };
  }),
  combatsWon: 0,
  phoenix_used: false,
  ...overrides
});

describe("relic engine", () => {
  it("applies passive acquisition effects deterministically", () => {
    const ironCore = RELICS.find((relic) => relic.id === "iron_core");
    const goldenBrand = RELICS.find((relic) => relic.id === "golden_brand");

    const healed = addRelicToRun(makeRun(), ironCore);
    const enriched = addRelicToRun(makeRun(), goldenBrand);

    expect(healed.player.health).toBe(85);
    expect(healed.player.maxHealth).toBe(85);
    expect(enriched.player.gold).toBe(25);
  });

  it("applies start-of-combat relic hooks through combat setup", () => {
    const run = makeRun(["storm_diadem", "hex_crown", "brass_lantern"]);

    const combat = startCombatForNode(run, { id: "elite-1", row: 1, col: 0, type: "elite" });

    expect(combat.player.charged).toBe(true);
    expect(combat.enemy.hex).toBe(1);
    expect(combat.player.energy).toBe(4);
  });

  it("applies triggered relic behavior during combat and post-combat flows", () => {
    const combatRun = makeRun(["thorn_crest"]);
    const started = { ...combatRun, combat: startCombatForNode(combatRun, { id: "combat-1", row: 1, col: 0, type: "combat" }) };
    const enemyBefore = started.combat.enemy.health;
    const afterEnemyTurn = endCombatTurn(started);

    expect(afterEnemyTurn.combat.enemy.health).toBeLessThan(enemyBefore);

    const rewardRun = makeRun(["bone_token"], { player: { health: 78, maxHealth: 80, gold: 0, deck: ["strike"] } });
    const rewarded = applyVictoryToRun(rewardRun, { state: "victory", nodeType: "combat", player: { health: 78 } });
    expect(rewarded.player.health).toBe(80);
  });

  it("fails safely for unsupported relic definitions", () => {
    const strangeRelic = { id: "unknown_relic", name: "Unknown Relic" };
    const run = makeRun();

    const next = addRelicToRun(run, strangeRelic);

    expect(next.player).toEqual(run.player);
    expect(next.relics).toContain(strangeRelic);
    expect(getCombatEnergyBonus({ relics: [strangeRelic] }, "combat")).toBe(0);
  });
});
