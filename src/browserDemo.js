const { startNewRun } = require("./run");

const createBrowserDemoState = (balanceOverrides = {}) => startNewRun(balanceOverrides);

const summarizeRun = (run) => ({
  state: run.state,
  health: run.player.health,
  gold: run.player.gold,
  deckCount: run.player.deck.length,
  currentNodeId: run.map.currentNodeId,
  inCombat: run.combat !== null,
  combatState: run.combat ? run.combat.state : null
});

module.exports = {
  createBrowserDemoState,
  summarizeRun
};
