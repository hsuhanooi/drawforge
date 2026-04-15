const { createRewardOptions, addRewardCardToDeck, createVictoryCardRewards, createVictoryRewards } = require("../src/rewards");

const createBaseCombat = () => ({
  state: "victory",
  turn: null,
  player: { health: 10 },
  enemy: { health: 0 }
});

const createSequenceRng = (...values) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
};

describe("combat rewards", () => {
  it("generates reward card options after victory", () => {
    const combat = createBaseCombat();
    const options = createRewardOptions(3, {}, createSequenceRng(0.0, 0.5, 0.9));

    expect(combat.state).toBe("victory");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveProperty("id");
  });

  it("can generate reward cards only from the current reward pool", () => {
    const { REWARD_POOL } = require("../src/cards");
    const poolIds = REWARD_POOL.map((f) => f().id);
    const options = createRewardOptions(poolIds.length, {}, createSequenceRng(...poolIds.map((_, i) => i / poolIds.length)));
    const ids = options.map((card) => card.id);

    // All returned cards must come from the reward pool
    ids.forEach((id) => expect(poolIds).toContain(id));
    // Old cards must not appear
    ["bash", "barrier", "quick_strike", "focus", "volley", "surge", "hex"].forEach((id) => {
      expect(ids).not.toContain(id);
    });
  });

  it("adds the selected reward card to the deck", () => {
    const deck = ["strike", "defend"];
    const options = createRewardOptions(3, {}, createSequenceRng(0.0, 0.5, 0.9));

    const nextDeck = addRewardCardToDeck(deck, options[0]);

    expect(nextDeck).toHaveLength(3);
    expect(nextDeck).toContain(options[0].id);
  });

  it("does not duplicate cards within a single reward choice set", () => {
    const options = createRewardOptions(8, {}, createSequenceRng(0.25, 0.25, 0.25, 0.25));
    const ids = options.map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("creates larger victory rewards for elite and boss fights", () => {
    const eliteRewards = createVictoryRewards("elite");
    const bossRewards = createVictoryRewards("boss");

    expect(eliteRewards.relics).toHaveLength(3);
    expect(bossRewards.relic).not.toBeNull();
    expect(bossRewards.gold).toBeGreaterThan(eliteRewards.gold);
  });

  it("elite rewards start with card options, then 3 relic choices, then removal later", () => {
    const eliteRewards = createVictoryRewards("elite");

    expect(Array.isArray(eliteRewards.cards)).toBe(true);
    expect(eliteRewards.cards.length).toBeGreaterThan(0);
    expect(eliteRewards.relics).toHaveLength(3);
    expect(eliteRewards.removeCard).toBe(false);
    expect(eliteRewards.relic).toBeNull();
  });

  it("normal combat rewards do not set removeCard", () => {
    const combatRewards = createVictoryRewards("combat");

    expect(combatRewards.removeCard).toBeFalsy();
    expect(combatRewards.cards.length).toBeGreaterThan(0);
  });

  it("reward pool includes cards from all archetypes (charged, exhaust, hex, defense)", () => {
    // Draw enough cards to cover the whole pool; deduplicate across many draws
    const { REWARD_POOL } = require("../src/cards");
    const poolSize = REWARD_POOL.length;
    const options = createRewardOptions(poolSize * 3);
    const ids = new Set(options.map((card) => card.id));
    // Spot-check one card from each major archetype group
    const archetypeReps = [
      "mark_of_ruin",    // Hex
      "charge_up",       // Charged
      "fire_sale",       // Exhaust
      "war_cry",         // Strength/debuff
      "static_guard",    // Charged (new M10)
      "hollow_ward",     // Defense (new M10)
      "doom_engine",     // Hex/Exhaust hybrid (new M10)
      "hexburst"         // Hex finisher (new M10)
    ];
    for (const id of archetypeReps) {
      expect(ids).toContain(id);
    }
  });

  it("biases rewards toward Hex/Debuff cards for hex_witch archetype", () => {
    const hexArchetypes = ["Hex", "Hex / Exhaust"];
    const run = { act: 1, relics: [], archetype: "hex_witch" };
    // Draw 20 reward rounds to reliably observe the bias
    const allCards = [];
    for (let i = 0; i < 20; i++) {
      allCards.push(...createVictoryCardRewards("combat", run, {}, Math.random));
    }
    const hexCards = allCards.filter((c) => hexArchetypes.some((t) => (c.archetype || "").includes(t)));
    // With 50% bias over 60 draws, at least 1 should be themed
    expect(hexCards.length).toBeGreaterThanOrEqual(1);
  });

  it("biases rewards toward Poison cards for poison_vanguard archetype", () => {
    const run = { act: 1, relics: [], archetype: "poison_vanguard" };
    // At least 1 Poison card in rewards when archetype is poison_vanguard
    // (probabilistic — run enough candidate pool to make this reliable)
    const allCards = [];
    for (let i = 0; i < 20; i++) {
      allCards.push(...createVictoryCardRewards("combat", run, {}, Math.random));
    }
    const anyPoison = allCards.some((c) => (c.archetype || "").includes("Poison"));
    expect(anyPoison).toBe(true);
  });

  it("biased reward cards contain no duplicates", () => {
    const run = { act: 1, relics: [], archetype: "hex_witch" };
    const cards = createVictoryCardRewards("combat", run, {}, Math.random);
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("falls back to unbiased pool when archetype is null", () => {
    const run = { act: 1, relics: [], archetype: null };
    const cards = createVictoryCardRewards("combat", run, {}, Math.random);
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((c) => expect(c).toHaveProperty("id"));
  });

  it("weighted rarity pool produces more commons than rares over many samples", () => {
    // Run 100 reward draws of 1 card each and count rarity occurrences
    let commonCount = 0;
    let rareCount = 0;
    for (let i = 0; i < 100; i += 1) {
      const [card] = createRewardOptions(1);
      if (card.rarity === "common") commonCount += 1;
      if (card.rarity === "rare") rareCount += 1;
    }
    expect(commonCount).toBeGreaterThan(rareCount);
  });

  it("offers an extra combat reward card from act 2 onward to help deck growth", () => {
    const act1Rewards = createVictoryRewards("combat", { act: 1, relics: [] });
    const act2Rewards = createVictoryRewards("combat", { act: 2, relics: [] });

    expect(act1Rewards.cards).toHaveLength(3);
    expect(act2Rewards.cards).toHaveLength(4);
  });

  it("biases later-act victory rewards toward stronger rarity mixes", () => {
    const cards = createVictoryCardRewards("combat", { act: 3, relics: [] }, {}, createSequenceRng(0.1, 0.4, 0.7, 0.2, 0.5, 0.8));

    expect(cards).toHaveLength(4);
    expect(cards.some((card) => ["uncommon", "rare"].includes(card.rarity))).toBe(true);
  });
});
