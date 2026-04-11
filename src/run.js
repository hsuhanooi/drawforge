const { RUN_STATE_IN_PROGRESS } = require("./constants");
const { createBalanceConfig } = require("./balance");
const { createStarterDeck } = require("./deck");

const createRunSeed = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

const startNewRun = (balanceOverrides = {}, options = {}) => {
  const balance = createBalanceConfig(balanceOverrides);
  const { seed = createRunSeed() } = options;

  return {
    state: RUN_STATE_IN_PROGRESS,
    act: 1,
    seed,
    player: {
      health: balance.player.health,
      maxHealth: balance.player.health,
      gold: balance.player.gold,
      deck: createStarterDeck()
    },
    potions: [],
    stats: {
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      cardsPlayed: 0,
      turnsPlayed: 0,
      goldEarned: 0,
      goldSpent: 0,
      shopVisits: 0,
      restVisits: 0,
      eventVisits: 0,
      rewardCardChoiceScreens: 0,
      rewardCardsClaimed: 0,
      highestSingleHit: 0,
      cardPlayCounts: {}
    },
    combat: null,
    runFlags: {},
    usedChainFlags: [],
    map: {
      currentNodeId: null
    }
  };
};

module.exports = {
  startNewRun
};
