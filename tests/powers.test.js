const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");

const makeRun = (deckOverride = ["iron_will", "strike", "strike", "strike", "strike"]) => ({
  player: { health: 80, maxHealth: 80, gold: 0, deck: deckOverride },
  relics: [],
  phoenix_used: false,
  combatsWon: 0
});

const combatNode = () => ({ id: "r1c0", row: 1, col: 0, type: "combat" });

const startCombat = (run) => ({ ...run, combat: startCombatForNode(run, combatNode()) });

describe("power card routing", () => {
  it("power card goes to combat.powers not discard", () => {
    const run = startCombat(makeRun());
    const idx = run.combat.hand.findIndex((c) => c.id === "iron_will");
    const run2 = playCombatCard(run, idx);
    expect(run2.combat.powers.some((p) => p.id === "iron_will")).toBe(true);
    expect(run2.combat.discardPile.some((c) => c.id === "iron_will")).toBe(false);
    expect(run2.combat.exhaustPile.some((c) => c.id === "iron_will")).toBe(false);
  });

  it("power card has id and label in powers array", () => {
    const run = startCombat(makeRun());
    const idx = run.combat.hand.findIndex((c) => c.id === "iron_will");
    const run2 = playCombatCard(run, idx);
    const power = run2.combat.powers.find((p) => p.id === "iron_will");
    expect(power).toHaveProperty("id", "iron_will");
    expect(power).toHaveProperty("label");
  });
});

describe("iron_will power", () => {
  it("gains 1 dexterity at start of each turn", () => {
    const run = startCombat(makeRun());
    const idx = run.combat.hand.findIndex((c) => c.id === "iron_will");
    const run2 = playCombatCard(run, idx);
    const dexBefore = run2.combat.player.dexterity || 0;
    const run3 = endCombatTurn(run2);
    expect(run3.combat.player.dexterity).toBe(dexBefore + 1);
  });

  it("stacks dexterity each turn", () => {
    const run = startCombat(makeRun(["iron_will", "strike", "strike", "strike", "strike"]));
    const idx = run.combat.hand.findIndex((c) => c.id === "iron_will");
    const run2 = playCombatCard(run, idx);
    const run3 = endCombatTurn(run2);
    const run4 = endCombatTurn(run3);
    expect(run4.combat.player.dexterity).toBeGreaterThanOrEqual(2);
  });
});

describe("burning_aura power", () => {
  it("deals 3 damage to enemy at start of each turn", () => {
    const run = startCombat(makeRun(["burning_aura", "strike", "strike", "strike", "strike"]));
    const idx = run.combat.hand.findIndex((c) => c.id === "burning_aura");
    const run2 = playCombatCard(run, idx);
    const enemyHealthBefore = run2.combat.enemy.health;
    const run3 = endCombatTurn(run2);
    if (run3.combat && run3.combat.state === "active") {
      expect(run3.combat.enemy.health).toBeLessThanOrEqual(enemyHealthBefore - 3);
    }
  });

  it("burning_aura respects enemy block", () => {
    const run = startCombat(makeRun(["burning_aura", "strike", "strike", "strike", "strike"]));
    const idx = run.combat.hand.findIndex((c) => c.id === "burning_aura");
    const run2 = playCombatCard(run, idx);
    // Give enemy 10 block manually by cloning
    const withBlock = { ...run2, combat: { ...run2.combat, enemy: { ...run2.combat.enemy, block: 10 } } };
    const run3 = endCombatTurn(withBlock);
    if (run3.combat && run3.combat.state === "active") {
      expect(run3.combat.enemy.block).toBeLessThan(10);
    }
  });
});

describe("hex_resonance power", () => {
  it("applies 1 hex to enemy at start of each turn", () => {
    const run = startCombat(makeRun(["hex_resonance", "strike", "strike", "strike", "strike"]));
    const idx = run.combat.hand.findIndex((c) => c.id === "hex_resonance");
    const run2 = playCombatCard(run, idx);
    const hexBefore = run2.combat.enemy.hex || 0;
    const run3 = endCombatTurn(run2);
    if (run3.combat && run3.combat.state === "active") {
      expect(run3.combat.enemy.hex || 0).toBeGreaterThan(hexBefore);
    }
  });
});

describe("multiple powers", () => {
  it("all powers fire on the same turn", () => {
    // Use ember_ring to get 4 energy, plus ashen_idol for +1 on first turn = 5 energy
    const runBase = makeRun(["iron_will", "burning_aura", "hex_resonance", "strike", "strike"]);
    const runWithRelics = {
      ...runBase,
      relics: [{ id: "ember_ring", name: "Ember Ring" }, { id: "ashen_idol", name: "Ashen Idol" }]
    };
    const run = startCombat(runWithRelics);
    let r = run;
    for (const card of ["iron_will", "burning_aura", "hex_resonance"]) {
      const idx = r.combat.hand.findIndex((c) => c.id === card);
      r = playCombatCard(r, idx);
    }
    expect(r.combat.powers.length).toBe(3);
    const dexBefore = r.combat.player.dexterity || 0;
    const hexBefore = r.combat.enemy.hex || 0;
    const r2 = endCombatTurn(r);
    if (r2.combat && r2.combat.state === "active") {
      expect(r2.combat.player.dexterity).toBe(dexBefore + 1);
      expect(r2.combat.enemy.hex || 0).toBeGreaterThan(hexBefore);
    }
  });
});
