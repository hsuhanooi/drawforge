const {
  DEFAULT_PLAYER_GOLD,
  DEFAULT_PLAYER_HEALTH,
  RUN_STATE_IN_PROGRESS
} = require("./constants");
const { createStarterDeck } = require("./deck");

const startNewRun = () => ({
  state: RUN_STATE_IN_PROGRESS,
  player: {
    health: DEFAULT_PLAYER_HEALTH,
    gold: DEFAULT_PLAYER_GOLD,
    deck: createStarterDeck()
  },
  combat: null,
  map: {
    currentNodeId: null
  }
});

module.exports = {
  startNewRun
};
