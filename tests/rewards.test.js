const { createRewardOptions, addRewardCardToDeck, createVictoryRewards } = require("../src/rewards");

const createBaseCombat = () => ({
  state: "victory",
  turn: null,
  player: { health: 10 },
  enemy: { health: 0 }
});

describe("combat rewards", () => {
  it("generates reward card options after victory", () => {
    const combat = createBaseCombat();
    const options = createRewardOptions(3);

    expect(combat.state).toBe("victory");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveProperty("id");
  });

  it("can generate expanded reward cards from the larger pool", () => {
    const options = createRewardOptions(17);
    const ids = options.map((card) => card.id);

    expect(ids).toEqual(expect.arrayContaining(["bash", "barrier", "quick_strike", "focus", "volley", "surge", "hex", "punish", "burnout", "crackdown", "momentum", "wither", "siphon_ward", "detonate_sigil", "lingering_curse"]));
  });

  it("adds the selected reward card to the deck", () => {
    const deck = ["strike", "defend"];
    const options = createRewardOptions(3);

    const nextDeck = addRewardCardToDeck(deck, options[0]);

    expect(nextDeck).toHaveLength(3);
    expect(nextDeck).toContain(options[0].id);
  });

  it("creates larger victory rewards for elite and boss fights", () => {
    const eliteRewards = createVictoryRewards("elite");
    const bossRewards = createVictoryRewards("boss");

    expect(eliteRewards.relic).not.toBeNull();
    expect(bossRewards.gold).toBeGreaterThan(eliteRewards.gold);
  });
});
