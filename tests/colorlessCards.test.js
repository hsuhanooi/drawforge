// Tests for the 5 new Neutral / colorless utility cards:
// Calculated Risk, Compress, Momentum, Bulwark, Desperation

const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");
const { toRenderableCard } = require("../src/cardCatalog");

const makeNode = () => ({ id: "r0c0", row: 0, col: 0, type: "combat", next: [] });

const makeRun = (deck = []) => ({
  player: { health: 60, maxHealth: 80, deck, gold: 0 },
  relics: [],
  phoenix_used: false
});

const startCombat = (run) => ({ ...run, combat: startCombatForNode(run, makeNode()) });

const injectHand = (run, cards) => ({
  ...run,
  combat: {
    ...run.combat,
    hand: cards.map((c) => toRenderableCard(c)),
    drawPile: []
  }
});

// ── Calculated Risk ──────────────────────────────────────────────────────────

describe("Calculated Risk", () => {
  it("gains 2 energy and loses 4 HP on play", () => {
    const run = makeRun(["calculated_risk"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["calculated_risk"]);
    const hpBefore = withCombat.combat.player.health;
    const energyBefore = withCombat.combat.player.energy;
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "calculated_risk");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.player.health).toBe(hpBefore - 4);
    expect(result.combat.player.energy).toBe(energyBefore - 0 + 2); // cost 0, gain 2
  });

  it("exhausts on play", () => {
    const run = makeRun(["calculated_risk"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["calculated_risk"]);
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "calculated_risk");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.exhaustPile.some((c) => c.id === "calculated_risk")).toBe(true);
  });
});

// ── Compress ─────────────────────────────────────────────────────────────────

describe("Compress", () => {
  it("exhausts 2 cards from hand and draws 3", () => {
    const run = makeRun(["compress", "strike", "defend", "strike", "defend"]);
    let withCombat = startCombat(run);
    // Give a known hand: compress + 4 others
    withCombat = injectHand(withCombat, ["compress", "strike", "defend", "strike"]);
    // Add more to draw pile so draw can work
    withCombat = {
      ...withCombat,
      combat: {
        ...withCombat.combat,
        drawPile: [toRenderableCard("defend"), toRenderableCard("strike"), toRenderableCard("strike")]
      }
    };
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "compress");
    const handSizeBefore = withCombat.combat.hand.length;
    const exhaustBefore = withCombat.combat.exhaustPile.length;
    const result = playCombatCard(withCombat, idx);
    // Played compress (removed from hand): hand -1 for compress play
    // Exhaust 2 from remaining hand
    // Draw 3
    // Net: handSizeBefore - 1 (compress) - 2 (exhaust) + 3 (draw) = handSizeBefore
    expect(result.combat.exhaustPile.length).toBe(exhaustBefore + 2);
    expect(result.combat.hand.length).toBe(handSizeBefore - 1 - 2 + 3);
  });
});

// ── Momentum ─────────────────────────────────────────────────────────────────

describe("Momentum", () => {
  it("draws 1 card when fewer than 3 cards played this turn", () => {
    const run = makeRun(["momentum_card", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["momentum_card"]);
    withCombat = {
      ...withCombat,
      combat: {
        ...withCombat.combat,
        cardsPlayedThisTurn: 1, // below threshold of 3
        drawPile: [toRenderableCard("strike"), toRenderableCard("strike"), toRenderableCard("strike")]
      }
    };
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "momentum_card");
    const handBefore = withCombat.combat.hand.length;
    const result = playCombatCard(withCombat, idx);
    // hand: -1 (momentum) + 1 (draw 1) = net 0 change
    expect(result.combat.hand.length).toBe(handBefore - 1 + 1);
  });

  it("draws 2 cards when 3+ cards played this turn", () => {
    const run = makeRun(["momentum_card", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["momentum_card"]);
    withCombat = {
      ...withCombat,
      combat: {
        ...withCombat.combat,
        cardsPlayedThisTurn: 3, // at threshold of 3
        drawPile: [toRenderableCard("strike"), toRenderableCard("strike"), toRenderableCard("strike")]
      }
    };
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "momentum_card");
    const handBefore = withCombat.combat.hand.length;
    const result = playCombatCard(withCombat, idx);
    // hand: -1 (momentum) + 2 (draw 2) = net +1
    expect(result.combat.hand.length).toBe(handBefore - 1 + 2);
  });

  it("resets cardsPlayedThisTurn to 0 at end of turn", () => {
    const run = makeRun(["strike", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = { ...withCombat, combat: { ...withCombat.combat, cardsPlayedThisTurn: 5 } };
    const result = endCombatTurn(withCombat);
    expect(result.combat.cardsPlayedThisTurn).toBe(0);
  });
});

// ── Bulwark ───────────────────────────────────────────────────────────────────

describe("Bulwark", () => {
  it("gives 4 block with no active powers", () => {
    const run = makeRun(["bulwark", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["bulwark"]);
    withCombat.combat.powers = [];
    const blockBefore = withCombat.combat.player.block;
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "bulwark");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.player.block).toBe(blockBefore + 4);
  });

  it("gives 4 + 2*powers block with 2 active powers", () => {
    const run = makeRun(["bulwark", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["bulwark"]);
    withCombat.combat.powers = [{ id: "iron_will", label: "Iron Will" }, { id: "burning_aura", label: "Burning Aura" }];
    const blockBefore = withCombat.combat.player.block;
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "bulwark");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.player.block).toBe(blockBefore + 4 + 2 * 2);
  });
});

// ── Desperation ───────────────────────────────────────────────────────────────

describe("Desperation", () => {
  it("deals 5 damage at full HP", () => {
    const run = makeRun(["desperation", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["desperation"]);
    withCombat.combat.player.health = 80; // above threshold
    const enemyHpBefore = withCombat.combat.enemy.health;
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "desperation");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 5);
  });

  it("deals 12 damage at 25 HP or below", () => {
    const run = makeRun(["desperation", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["desperation"]);
    withCombat.combat.player.health = 25; // at threshold
    const enemyHpBefore = withCombat.combat.enemy.health;
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "desperation");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 12);
  });

  it("deals 12 damage below threshold (15 HP)", () => {
    const run = makeRun(["desperation", "strike", "strike", "strike", "strike"]);
    let withCombat = startCombat(run);
    withCombat = injectHand(withCombat, ["desperation"]);
    withCombat.combat.player.health = 15;
    const enemyHpBefore = withCombat.combat.enemy.health;
    const idx = withCombat.combat.hand.findIndex((c) => c.id === "desperation");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 12);
  });
});
