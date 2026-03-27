const { createRewardOptions, addRewardCardToDeck, createVictoryRewards } = require("../src/rewards");

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

    expect(eliteRewards.relic).not.toBeNull();
    expect(bossRewards.gold).toBeGreaterThan(eliteRewards.gold);
  });

  it("elite rewards include card options alongside the removeCard flag", () => {
    const eliteRewards = createVictoryRewards("elite");

    expect(Array.isArray(eliteRewards.cards)).toBe(true);
    expect(eliteRewards.cards.length).toBeGreaterThan(0);
    expect(eliteRewards.removeCard).toBe(true);
  });

  it("normal combat rewards do not set removeCard", () => {
    const combatRewards = createVictoryRewards("combat");

    expect(combatRewards.removeCard).toBeFalsy();
    expect(combatRewards.cards.length).toBeGreaterThan(0);
  });

  it("reward pool includes new cards from the expanded set", () => {
    const options = createRewardOptions(29);
    const ids = options.map((card) => card.id);
    expect(ids).toEqual(expect.arrayContaining([
      "mark_of_ruin", "hexblade", "reapers_clause", "fire_sale", "cremate",
      "grave_fuel", "brand_the_soul", "harvester", "charge_up", "arc_lash",
      "blood_pact", "spite_shield"
    ]));
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
});
