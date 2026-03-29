const { RUN_STATE_IN_PROGRESS } = require("./constants");
const { createBalanceConfig } = require("./balance");
const { createStarterDeck } = require("./deck");

const startNewRun = (balanceOverrides = {}) => {
  const balance = createBalanceConfig(balanceOverrides);

  return {
    state: RUN_STATE_IN_PROGRESS,
    act: 1,
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
      highestSingleHit: 0,
      cardPlayCounts: {}
    },
    combat: null,
    map: {
      currentNodeId: null
    }
  };
};

module.exports = {
  startNewRun
};
