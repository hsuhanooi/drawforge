const { generateMap } = require("./map");

const ACT2_HEAL_AMOUNT = 10;

const startAct2 = (run) => {
  const maxHealth = run.player.maxHealth || run.player.health;
  const newHealth = Math.min(run.player.health + ACT2_HEAL_AMOUNT, maxHealth);

  return {
    ...run,
    act: 2,
    state: "in_progress",
    player: {
      ...run.player,
      health: newHealth
    },
    combat: null,
    pendingRewards: null,
    event: null,
    map: {
      ...generateMap({}, {}),
      currentNodeId: null
    }
  };
};

module.exports = {
  startAct2
};
