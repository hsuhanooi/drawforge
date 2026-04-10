const { startNewRun } = require("../src/run");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");
const { applyVictoryToRun } = require("../src/browserPostNodeActions");

const makeRun = () => ({
  ...startNewRun(),
  relics: [],
  potions: [],
  phoenix_used: false,
  pendingRewards: null,
  event: null
});

const combatNode = { id: "n1", type: "combat", row: 2, col: 1 };

const makeRunWithCombat = () => {
  const run = makeRun();
  return { ...run, combat: startCombatForNode(run, combatNode) };
};

const forceHand = (run, cards) => ({
  ...run,
  combat: {
    ...run.combat,
    hand: cards,
    player: { ...run.combat.player, energy: 3 }
  }
});

const strikeCard = { id: "strike", name: "Strike", cost: 1, type: "attack", rarity: "common", damage: 6 };

describe("Run stats initialization", () => {
  it("startNewRun includes stats object with all fields zeroed", () => {
    const run = startNewRun();
    expect(run.stats).toBeDefined();
    expect(run.stats.enemiesKilled).toBe(0);
    expect(run.stats.damageDealt).toBe(0);
    expect(run.stats.damageTaken).toBe(0);
    expect(run.stats.cardsPlayed).toBe(0);
    expect(run.stats.turnsPlayed).toBe(0);
    expect(run.stats.goldEarned).toBe(0);
    expect(run.stats.goldSpent).toBe(0);
    expect(run.stats.shopVisits).toBe(0);
    expect(run.stats.restVisits).toBe(0);
    expect(run.stats.eventVisits).toBe(0);
    expect(run.stats.rewardCardChoiceScreens).toBe(0);
    expect(run.stats.rewardCardsClaimed).toBe(0);
    expect(run.stats.highestSingleHit).toBe(0);
    expect(run.stats.cardPlayCounts).toEqual({});
  });
});

describe("Stats: cards played tracking", () => {
  it("increments cardsPlayed after each card play", () => {
    const run = makeRunWithCombat();
    const withHand = forceHand(run, [strikeCard]);
    const result = playCombatCard(withHand, 0);
    expect(result.stats.cardsPlayed).toBe(1);
  });

  it("accumulates cardsPlayed across multiple plays", () => {
    const run = makeRunWithCombat();
    const r1 = playCombatCard(forceHand(run, [strikeCard]), 0);
    const r2 = playCombatCard(forceHand(r1, [strikeCard]), 0);
    const r3 = playCombatCard(forceHand(r2, [strikeCard]), 0);
    expect(r3.stats.cardsPlayed).toBe(3);
  });

  it("tracks cardPlayCounts per card id", () => {
    const run = makeRunWithCombat();
    const r1 = playCombatCard(forceHand(run, [strikeCard]), 0);
    const r2 = playCombatCard(forceHand(r1, [strikeCard]), 0);
    expect(r2.stats.cardPlayCounts.strike).toBe(2);
  });

  it("identifies mostPlayedCardId", () => {
    const run = makeRunWithCombat();
    const defendCard = { id: "defend", name: "Defend", cost: 1, type: "skill", rarity: "common", block: 5 };
    const r1 = playCombatCard(forceHand(run, [strikeCard]), 0);
    const r2 = playCombatCard(forceHand(r1, [strikeCard]), 0);
    const r3 = playCombatCard(forceHand(r2, [defendCard]), 0);
    expect(r3.stats.mostPlayedCardId).toBe("strike");
  });
});

describe("Stats: damage dealt", () => {
  it("tracks HP damage dealt to enemy (not blocked)", () => {
    const run = makeRunWithCombat();
    const withHand = forceHand(run, [strikeCard]);
    const result = playCombatCard(withHand, 0);
    // Strike deals 6 damage; enemy has no block initially
    expect(result.stats.damageDealt).toBeGreaterThan(0);
    expect(result.stats.damageDealt).toBe(6);
  });

  it("tracks highestSingleHit", () => {
    const run = makeRunWithCombat();
    const bigCard = { id: "heavy_swing", name: "Heavy Swing", cost: 2, type: "attack", rarity: "common", damage: 12 };
    const r1 = playCombatCard(forceHand(run, [strikeCard]), 0);
    const r2 = playCombatCard(forceHand(r1, [bigCard]), 0);
    expect(r2.stats.highestSingleHit).toBe(12);
  });

  it("highestSingleHit does not decrease", () => {
    const run = makeRunWithCombat();
    const bigCard = { id: "heavy_swing", name: "Heavy Swing", cost: 2, type: "attack", rarity: "common", damage: 12 };
    const r1 = playCombatCard(forceHand(run, [bigCard]), 0);
    const r2 = playCombatCard(forceHand(r1, [strikeCard]), 0);
    expect(r2.stats.highestSingleHit).toBe(12);
  });
});

describe("Stats: damage taken and turns", () => {
  it("tracks damageTaken after enemy attacks", () => {
    const run = makeRunWithCombat();
    const hpBefore = run.combat.player.health;
    const result = endCombatTurn(run);
    const hpAfter = result.combat?.player?.health ?? result.player?.health ?? hpBefore;
    const expectedDmg = Math.max(0, hpBefore - hpAfter);
    expect(result.stats.damageTaken).toBe(expectedDmg);
  });

  it("increments turnsPlayed after each end turn", () => {
    const run = makeRunWithCombat();
    const r1 = endCombatTurn(run);
    expect(r1.stats.turnsPlayed).toBe(1);
    if (r1.combat?.state === "active") {
      const r2 = endCombatTurn(r1);
      expect(r2.stats.turnsPlayed).toBe(2);
    }
  });
});

describe("Stats: victory tracking", () => {
  it("increments enemiesKilled on victory", () => {
    const run = makeRun();
    const fakeCombat = { nodeType: "combat", player: { health: 70 }, pendingCurses: [] };
    const result = applyVictoryToRun(run, fakeCombat);
    expect(result.stats.enemiesKilled).toBe(1);
  });

  it("accumulates enemiesKilled across multiple victories", () => {
    const run = makeRun();
    const fakeCombat = { nodeType: "combat", player: { health: 70 }, pendingCurses: [] };
    const r1 = applyVictoryToRun(run, fakeCombat);
    // Simulate finishing rewards to get pendingRewards cleared
    const r2 = applyVictoryToRun({ ...r1, pendingRewards: null }, fakeCombat);
    expect(r2.stats.enemiesKilled).toBe(2);
  });

  it("tracks goldEarned from combat rewards", () => {
    const run = makeRun();
    const fakeCombat = { nodeType: "combat", player: { health: 70 }, pendingCurses: [] };
    const result = applyVictoryToRun(run, fakeCombat);
    expect(result.stats.goldEarned).toBeGreaterThan(0);
  });

  it("tracks reward-card choice screens on victory rewards", () => {
    const run = makeRun();
    const fakeCombat = { nodeType: "combat", player: { health: 70 }, pendingCurses: [] };
    const result = applyVictoryToRun(run, fakeCombat);
    expect(result.stats.rewardCardChoiceScreens).toBe(1);
  });

  it("goldEarned accumulates across victories", () => {
    const run = makeRun();
    const fakeCombat = { nodeType: "combat", player: { health: 70 }, pendingCurses: [] };
    const r1 = applyVictoryToRun(run, fakeCombat);
    const r2 = applyVictoryToRun({ ...r1, pendingRewards: null }, fakeCombat);
    expect(r2.stats.goldEarned).toBeGreaterThan(r1.stats.goldEarned);
  });
});
