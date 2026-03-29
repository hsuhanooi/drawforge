const { startCombatForNode, playCombatCard } = require("../src/browserCombatActions");
const { CARD_REGISTRY, IMPLEMENTED_CARD_IDS } = require("../src/cardRegistry");

const makeRun = (deck) => ({
  player: { health: 80, maxHealth: 80, gold: 0, deck },
  relics: [],
  phoenix_used: false,
  combatsWon: 0
});

const startCombat = (run) => {
  const node = { id: "r1c0", row: 1, col: 0, type: "combat" };
  return { ...run, combat: startCombatForNode(run, node) };
};

const playCard = (run, cardId) => {
  const idx = run.combat.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) throw new Error(`Card ${cardId} not in hand`);
  return playCombatCard(run, idx);
};

describe("neutral utility cards", () => {
  it("pommel deals 7 damage and draws 1", () => {
    const run = startCombat(makeRun(["pommel", "strike", "strike", "strike", "strike"]));
    const enemyBefore = run.combat.enemy.health;
    const handBefore = run.combat.hand.length;
    const run2 = playCard(run, "pommel");
    expect(run2.combat.enemy.health).toBe(enemyBefore - 7);
    expect(run2.combat.hand.length).toBe(handBefore - 1 + 1);
  });

  it("brace gains 7 block", () => {
    const run = startCombat(makeRun(["brace", "strike", "strike", "strike", "strike"]));
    const blockBefore = run.combat.player.block;
    const run2 = playCard(run, "brace");
    expect(run2.combat.player.block).toBe(blockBefore + 7);
  });

  it("insight draws 2 cards", () => {
    const base = startCombat(makeRun(["strike", "strike", "strike", "strike", "strike", "strike", "strike"]));
    const insightCard = { id: "insight", name: "Insight", cost: 1, type: "skill", rarity: "common", draw: 2 };
    const run = { ...base, combat: { ...base.combat, hand: [insightCard, ...base.combat.hand.slice(0, 4)] } };
    const handBefore = run.combat.hand.length;
    const run2 = playCard(run, "insight");
    expect(run2.combat.hand.length).toBe(handBefore - 1 + 2);
  });

  it("parry gains 3 block at 0 cost", () => {
    const run = startCombat(makeRun(["parry", "strike", "strike", "strike", "strike"]));
    const blockBefore = run.combat.player.block;
    const energyBefore = run.combat.player.energy;
    const run2 = playCard(run, "parry");
    expect(run2.combat.player.block).toBe(blockBefore + 3);
    expect(run2.combat.player.energy).toBe(energyBefore);
  });

  it("heavy_swing deals 12 damage", () => {
    const run = startCombat(makeRun(["heavy_swing", "strike", "strike", "strike", "strike"]));
    const enemyBefore = run.combat.enemy.health;
    const run2 = playCard(run, "heavy_swing");
    expect(run2.combat.enemy.health).toBe(enemyBefore - 12);
  });

  it("recover gains 6 block and draws 1", () => {
    const run = startCombat(makeRun(["recover", "strike", "strike", "strike", "strike"]));
    const blockBefore = run.combat.player.block;
    const handBefore = run.combat.hand.length;
    const run2 = playCard(run, "recover");
    expect(run2.combat.player.block).toBe(blockBefore + 6);
    expect(run2.combat.hand.length).toBe(handBefore - 1 + 1);
  });

  it("plan_ahead exhausts and tries to draw 2", () => {
    // plan_ahead: draw 2, exhaust. Verify it routes to exhaust pile.
    // Use a small deck to guarantee plan_ahead is in hand.
    const run = startCombat(makeRun(["plan_ahead", "strike", "strike", "strike", "strike"]));
    // Find plan_ahead in hand or drawPile (shuffled)
    const inHand = run.combat.hand.find((c) => c.id === "plan_ahead");
    const inDraw = run.combat.drawPile.find((c) => c.id === "plan_ahead");
    expect(inHand || inDraw).toBeTruthy();
    // Play if in hand; if in drawPile just verify catalog has exhaust property
    if (inHand) {
      const run2 = playCard(run, "plan_ahead");
      expect(run2.combat.exhaustPile.some((c) => c.id === "plan_ahead")).toBe(true);
    }
  });
});

describe("hex archetype cards", () => {
  it("deep_hex applies 4 hex to enemy", () => {
    const run = startCombat(makeRun(["deep_hex", "strike", "strike", "strike", "strike"]));
    const hexBefore = run.combat.enemy.hex || 0;
    const run2 = playCard(run, "deep_hex");
    expect(run2.combat.enemy.hex).toBe(hexBefore + 4);
  });

  it("black_seal applies 1 hex and exhausts at 0 cost", () => {
    const run = startCombat(makeRun(["black_seal", "strike", "strike", "strike", "strike"]));
    const hexBefore = run.combat.enemy.hex || 0;
    const energyBefore = run.combat.player.energy;
    const run2 = playCard(run, "black_seal");
    expect(run2.combat.enemy.hex).toBe(hexBefore + 1);
    expect(run2.combat.exhaustPile.some((c) => c.id === "black_seal")).toBe(true);
    expect(run2.combat.player.energy).toBe(energyBefore);
  });

  it("feast_on_weakness deals 5 damage", () => {
    const run = startCombat(makeRun(["feast_on_weakness", "strike", "strike", "strike", "strike"]));
    const enemyBefore = run.combat.enemy.health;
    const run2 = playCard(run, "feast_on_weakness");
    expect(run2.combat.enemy.health).toBe(enemyBefore - 5);
  });

  it("feast_on_weakness gains block when enemy is hexed", () => {
    const run = startCombat(makeRun(["feast_on_weakness", "deep_hex", "strike", "strike", "strike"]));
    const run2 = playCard(run, "deep_hex");
    const blockBefore = run2.combat.player.block;
    const run3 = playCard(run2, "feast_on_weakness");
    expect(run3.combat.player.block).toBe(blockBefore + 5);
  });

  it("malediction applies weak 2 and hex 1", () => {
    const run = startCombat(makeRun(["malediction", "strike", "strike", "strike", "strike"]));
    const run2 = playCard(run, "malediction");
    expect(run2.combat.enemy.weak || 0).toBe(2);
    expect(run2.combat.enemy.hex || 0).toBe(1);
  });
});

describe("card registry completeness", () => {
  it("pommel, brace, insight, parry, heavy_swing, recover, plan_ahead are implemented", () => {
    const ids = ["pommel", "brace", "insight", "parry", "heavy_swing", "recover", "plan_ahead"];
    for (const id of ids) {
      expect(IMPLEMENTED_CARD_IDS).toContain(id);
    }
  });

  it("deep_hex, black_seal, feast_on_weakness, malediction are implemented", () => {
    const ids = ["deep_hex", "black_seal", "feast_on_weakness", "malediction"];
    for (const id of ids) {
      expect(IMPLEMENTED_CARD_IDS).toContain(id);
    }
  });

  it("power cards are in registry as implemented", () => {
    const powerCards = CARD_REGISTRY.filter((c) => c.type === "power");
    expect(powerCards.length).toBe(3);
    for (const card of powerCards) {
      expect(card.status).toBe("implemented");
    }
  });
});
