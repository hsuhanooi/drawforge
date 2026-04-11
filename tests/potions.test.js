const {
  POTIONS,
  MAX_POTIONS,
  POTION_DROP_CHANCE,
  createRandomPotion,
  applyPotion
} = require("../src/potions");
const { createBrowserRun, chooseArchetype } = require("../src/browserRunActions");
const { startCombatForNode, usePotionInCombat, discardPotion } = require("../src/browserCombatActions");
const { createVictoryRewards } = require("../src/rewards");

const combatNode = { id: "r0c0", row: 0, col: 0, type: "combat", next: [] };

const makeBaseCombat = (overrides = {}) => ({
  state: "active",
  turn: "player",
  player: { health: 50, maxHealth: 70, energy: 3, block: 0, strength: 0, dexterity: 0, charged: false },
  enemy: { health: 30, block: 0, hex: 0, poison: 0, burn: 0, weak: 0, vulnerable: 0 },
  hand: [],
  drawPile: [],
  discardPile: [],
  exhaustPile: [],
  powers: [],
  combatLog: [],
  ...overrides
});

describe("POTIONS catalog", () => {
  it("has 12 unique potion entries", () => {
    expect(POTIONS).toHaveLength(12);
    const ids = POTIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(12);
  });

  it("every potion has id, name, description, and rarity", () => {
    for (const p of POTIONS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(["common", "uncommon", "rare"]).toContain(p.rarity);
    }
  });

  it("includes archetype-themed potions (poison, burn, charged)", () => {
    const ids = POTIONS.map((p) => p.id);
    expect(ids).toContain("poison_vial");
    expect(ids).toContain("burn_vial");
    expect(ids).toContain("charged_vial");
  });

  it("MAX_POTIONS is 2", () => {
    expect(MAX_POTIONS).toBe(2);
  });

  it("POTION_DROP_CHANCE is between 0 and 1", () => {
    expect(POTION_DROP_CHANCE).toBeGreaterThan(0);
    expect(POTION_DROP_CHANCE).toBeLessThanOrEqual(1);
  });
});

describe("createRandomPotion", () => {
  it("returns a valid potion from the pool", () => {
    const validIds = POTIONS.map((p) => p.id);
    let rngCallCount = 0;
    const rng = () => { rngCallCount += 1; return 0; };
    const potion = createRandomPotion(rng);
    expect(validIds).toContain(potion.id);
    expect(rngCallCount).toBe(1);
  });

  it("is deterministic given the same rng", () => {
    const rng = () => 0.5;
    const a = createRandomPotion(rng);
    const b = createRandomPotion(rng);
    expect(a.id).toBe(b.id);
  });

  it("produces different potions at different rng values", () => {
    const first = createRandomPotion(() => 0);
    const last = createRandomPotion(() => 0.9999);
    // Pool has 12 entries so first and last should differ
    expect(first.id).not.toBe(last.id);
  });
});

describe("applyPotion — healing and utility", () => {
  it("healing_potion restores 10 HP up to maxHealth", () => {
    const combat = makeBaseCombat({ player: { health: 50, maxHealth: 70, energy: 3, block: 0 } });
    const result = applyPotion(combat, "healing_potion");
    expect(result.player.health).toBe(60);
  });

  it("healing_potion does not exceed maxHealth", () => {
    const combat = makeBaseCombat({ player: { health: 65, maxHealth: 70, energy: 3, block: 0 } });
    const result = applyPotion(combat, "healing_potion");
    expect(result.player.health).toBe(70);
  });

  it("strength_potion grants 2 strength", () => {
    const combat = makeBaseCombat();
    const result = applyPotion(combat, "strength_potion");
    expect(result.player.strength).toBe(2);
  });

  it("strength_potion stacks with existing strength", () => {
    const combat = makeBaseCombat({ player: { ...makeBaseCombat().player, strength: 1 } });
    const result = applyPotion(combat, "strength_potion");
    expect(result.player.strength).toBe(3);
  });

  it("block_potion grants 12 block", () => {
    const combat = makeBaseCombat();
    const result = applyPotion(combat, "block_potion");
    expect(result.player.block).toBe(12);
  });

  it("energy_potion grants 2 energy", () => {
    const combat = makeBaseCombat({ player: { ...makeBaseCombat().player, energy: 1 } });
    const result = applyPotion(combat, "energy_potion");
    expect(result.player.energy).toBe(3);
  });

  it("swift_potion draws 2 cards from draw pile", () => {
    const card1 = { id: "strike", name: "Strike" };
    const card2 = { id: "defend", name: "Defend" };
    const combat = makeBaseCombat({ drawPile: [card1, card2] });
    const result = applyPotion(combat, "swift_potion");
    expect(result.hand).toHaveLength(2);
    expect(result.drawPile).toHaveLength(0);
  });

  it("swift_potion reshuffles discard if draw pile is empty", () => {
    const card1 = { id: "strike", name: "Strike" };
    const card2 = { id: "defend", name: "Defend" };
    const combat = makeBaseCombat({ drawPile: [], discardPile: [card1, card2] });
    const result = applyPotion(combat, "swift_potion");
    expect(result.hand.length + result.drawPile.length).toBe(2);
  });

  it("antidote_potion removes weak and heals 5", () => {
    const combat = makeBaseCombat({
      player: { health: 40, maxHealth: 70, energy: 3, block: 0, weak: 2 }
    });
    const result = applyPotion(combat, "antidote_potion");
    expect(result.player.weak).toBe(0);
    expect(result.player.health).toBe(45);
  });
});

describe("applyPotion — debuff potions", () => {
  it("hex_vial applies Hex 2 to enemy", () => {
    const combat = makeBaseCombat();
    const result = applyPotion(combat, "hex_vial");
    expect(result.enemy.hex).toBe(2);
  });

  it("hex_vial stacks with existing hex", () => {
    const combat = makeBaseCombat({ enemy: { ...makeBaseCombat().enemy, hex: 3 } });
    const result = applyPotion(combat, "hex_vial");
    expect(result.enemy.hex).toBe(5);
  });

  it("vulnerable_potion applies 3 Vulnerable to enemy", () => {
    const combat = makeBaseCombat();
    const result = applyPotion(combat, "vulnerable_potion");
    expect(result.enemy.vulnerable).toBe(3);
  });

  it("weak_potion applies 3 Weak to enemy", () => {
    const combat = makeBaseCombat();
    const result = applyPotion(combat, "weak_potion");
    expect(result.enemy.weak).toBe(3);
  });
});

describe("applyPotion — archetype-themed potions", () => {
  it("poison_vial applies 3 Poison to enemy", () => {
    const combat = makeBaseCombat();
    const result = applyPotion(combat, "poison_vial");
    expect(result.enemy.poison).toBe(3);
  });

  it("poison_vial stacks with existing poison up to cap of 20", () => {
    const combat = makeBaseCombat({ enemy: { ...makeBaseCombat().enemy, poison: 18 } });
    const result = applyPotion(combat, "poison_vial");
    expect(result.enemy.poison).toBe(20);
  });

  it("burn_vial applies 3 Burn to enemy", () => {
    const combat = makeBaseCombat();
    const result = applyPotion(combat, "burn_vial");
    expect(result.enemy.burn).toBe(3);
  });

  it("burn_vial stacks with existing burn up to cap of 20", () => {
    const combat = makeBaseCombat({ enemy: { ...makeBaseCombat().enemy, burn: 19 } });
    const result = applyPotion(combat, "burn_vial");
    expect(result.enemy.burn).toBe(20);
  });

  it("charged_vial sets player Charged and grants 1 Energy", () => {
    const combat = makeBaseCombat({ player: { ...makeBaseCombat().player, energy: 1 } });
    const result = applyPotion(combat, "charged_vial");
    expect(result.player.charged).toBe(true);
    expect(result.player.energy).toBe(2);
  });

  it("applyPotion throws for unknown potion id", () => {
    const combat = makeBaseCombat();
    expect(() => applyPotion(combat, "nonexistent_potion")).toThrow("Unknown potion");
  });
});

describe("usePotionInCombat — run-level integration", () => {
  // startCombatForNode returns the combat object; wrap it into a run with combat
  const makeRunWithPotion = (potionId) => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    const combat = startCombatForNode(run, combatNode);
    const potion = POTIONS.find((p) => p.id === potionId);
    return { ...run, combat, potions: [{ ...potion }] };
  };

  it("removes the potion from the run after use", () => {
    const run = makeRunWithPotion("healing_potion");
    expect(run.potions).toHaveLength(1);
    const after = usePotionInCombat(run, "healing_potion");
    expect(after.potions).toHaveLength(0);
  });

  it("applies the potion effect to combat state", () => {
    const run = makeRunWithPotion("block_potion");
    run.combat.player.block = 0;
    const after = usePotionInCombat(run, "block_potion");
    expect(after.combat.player.block).toBe(12);
  });

  it("healing potion uses run maxHealth as cap", () => {
    const run = makeRunWithPotion("healing_potion");
    run.player.maxHealth = 70;
    run.combat.player.health = 65;
    const after = usePotionInCombat(run, "healing_potion");
    expect(after.combat.player.health).toBe(70);
    expect(after.player.health).toBe(70);
  });

  it("throws if the potion id is not in run.potions", () => {
    const run = makeRunWithPotion("healing_potion");
    // run has healing_potion but not block_potion
    expect(() => usePotionInCombat(run, "block_potion")).toThrow("Potion not found");
  });

  it("throws if there is no active combat", () => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    const potion = POTIONS.find((p) => p.id === "healing_potion");
    const runNoCombat = { ...run, potions: [potion] };
    expect(() => usePotionInCombat(runNoCombat, "healing_potion")).toThrow("No active combat");
  });
});

describe("discardPotion", () => {
  it("removes the potion from the run without combat requirement", () => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    const potion = POTIONS.find((p) => p.id === "healing_potion");
    const runWithPotion = { ...run, potions: [{ ...potion }] };
    const after = discardPotion(runWithPotion, "healing_potion");
    expect(after.potions).toHaveLength(0);
  });

  it("throws if the potion is not found", () => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    expect(() => discardPotion({ ...run, potions: [] }, "healing_potion")).toThrow("Potion not found");
  });

  it("only removes the first matching potion when duplicates exist", () => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    const potion = POTIONS.find((p) => p.id === "healing_potion");
    const runWith2 = { ...run, potions: [{ ...potion }, { ...potion }] };
    const after = discardPotion(runWith2, "healing_potion");
    expect(after.potions).toHaveLength(1);
  });
});

describe("potion reward drops", () => {
  it("elite nodes can drop potions (POTION_DROP_CHANCE)", () => {
    let dropped = false;
    for (let i = 0; i < 200; i += 1) {
      const rewards = createVictoryRewards("elite", { potions: [] }, {}, Math.random);
      if (rewards.potion) { dropped = true; break; }
    }
    expect(dropped).toBe(true);
  });

  it("regular combat nodes can also drop potions (at reduced rate)", () => {
    let dropped = false;
    for (let i = 0; i < 500; i += 1) {
      const rewards = createVictoryRewards("combat", { potions: [] }, {}, Math.random);
      if (rewards.potion) { dropped = true; break; }
    }
    expect(dropped).toBe(true);
  });

  it("boss nodes never drop potions", () => {
    for (let i = 0; i < 50; i += 1) {
      const rewards = createVictoryRewards("boss", { potions: [] }, {}, Math.random);
      expect(rewards.potion).toBeNull();
    }
  });

  it("cannot receive a potion if already at MAX_POTIONS capacity", () => {
    const fullPotions = [POTIONS[0], POTIONS[1]];
    for (let i = 0; i < 50; i += 1) {
      const rewards = createVictoryRewards("elite", { potions: fullPotions }, {}, () => 0);
      expect(rewards.potion).toBeNull();
    }
  });
});
