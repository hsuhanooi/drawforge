const { RUN_STATE_IN_PROGRESS } = require("./constants");
const { createBalanceConfig } = require("./balance");
const { createStarterDeck } = require("./deck");

const startNewRun = (balanceOverrides = {}) => {
  const balance = createBalanceConfig(balanceOverrides);

  return {
    state: RUN_STATE_IN_PROGRESS,
    player: {
      health: balance.player.health,
      gold: balance.player.gold,
      deck: createStarterDeck()
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
