const { startCombatForNode, playCombatCard } = require("../src/browserCombatActions");
const { MAX_POWERS } = require("../src/constants");

const makeRun = (deck = ["iron_will", "iron_will", "iron_will", "iron_will", "burning_aura"]) => ({
  player: { health: 80, maxHealth: 80, gold: 0, deck },
  relics: [],
  phoenix_used: false,
  stats: {}
});

const combatNode = () => ({ id: "r1c0", row: 1, col: 0, type: "combat" });
const startCombat = (run) => ({ ...run, combat: startCombatForNode(run, combatNode()) });

// Play all power cards from hand (any type === "power")
const playAllPowers = (run) => {
  let current = run;
  let safetyCounter = 0;
  while (safetyCounter < 20) {
    safetyCounter += 1;
    const idx = current.combat.hand.findIndex((c) => c.type === "power");
    if (idx === -1) break;
    if (current.combat.player.energy < current.combat.hand[idx].cost) break;
    current = playCombatCard(current, idx);
  }
  return current;
};

describe("power slot cap", () => {
  it("MAX_POWERS constant is 3", () => {
    expect(MAX_POWERS).toBe(3);
  });

  it("playing up to 3 powers works normally", () => {
    const run = startCombat(makeRun(["iron_will", "iron_will", "iron_will", "strike", "strike"]));
    // Give enough energy to play 3 powers (each costs 2, but we'll need extra turns)
    // Force energy high enough
    const highEnergyRun = {
      ...run,
      combat: { ...run.combat, player: { ...run.combat.player, energy: 10 } }
    };
    const after = playAllPowers(highEnergyRun);
    expect(after.combat.powers.length).toBe(3);
  });

  it("4th power card is exhausted instead of added when slots full", () => {
    // Deck: 4 iron_will (cost 2 each) + 1 strike
    const run = startCombat(makeRun(["iron_will", "iron_will", "iron_will", "iron_will", "strike"]));
    const highEnergyRun = {
      ...run,
      combat: { ...run.combat, player: { ...run.combat.player, energy: 12 } }
    };
    const after = playAllPowers(highEnergyRun);
    // Should have exactly MAX_POWERS active powers
    expect(after.combat.powers.length).toBe(MAX_POWERS);
    // The 4th power should have been exhausted
    const exhaustedPowers = (after.combat.exhaustPile || []).filter((c) => c.type === "power");
    expect(exhaustedPowers.length).toBeGreaterThan(0);
  });

  it("combat.powers.length never exceeds MAX_POWERS", () => {
    const run = startCombat(makeRun(["iron_will", "iron_will", "iron_will", "iron_will", "iron_will"]));
    const highEnergyRun = {
      ...run,
      combat: { ...run.combat, player: { ...run.combat.player, energy: 20 } }
    };
    let current = highEnergyRun;
    for (let i = 0; i < 10; i++) {
      const idx = current.combat.hand.findIndex((c) => c.type === "power");
      if (idx === -1) break;
      current = playCombatCard(current, idx);
      expect(current.combat.powers.length).toBeLessThanOrEqual(MAX_POWERS);
    }
  });

  it("combat log includes 'Power slots full' when cap exceeded", () => {
    const run = startCombat(makeRun(["iron_will", "iron_will", "iron_will", "iron_will", "strike"]));
    const highEnergyRun = {
      ...run,
      combat: { ...run.combat, player: { ...run.combat.player, energy: 12 } }
    };
    const after = playAllPowers(highEnergyRun);
    const allLogs = (after.combat.combatLog || []).map((l) => l.text).join(" ");
    expect(allLogs).toMatch(/Power slots full/i);
  });

  it("playing power under the cap still works normally", () => {
    const run = startCombat(makeRun(["iron_will", "strike", "strike", "strike", "strike"]));
    const idx = run.combat.hand.findIndex((c) => c.id === "iron_will");
    const run2 = playCombatCard(run, idx);
    expect(run2.combat.powers.some((p) => p.id === "iron_will")).toBe(true);
    expect(run2.combat.powers.length).toBe(1);
    expect(run2.combat.exhaustPile.some((c) => c.id === "iron_will")).toBe(false);
  });
});
