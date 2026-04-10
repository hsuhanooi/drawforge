const { generateMap } = require("./map");

const ACT2_HEAL_AMOUNT = 10;
const ACT3_HEAL_AMOUNT = 12;

const startNextAct = (run, act, healAmount) => {
  const maxHealth = run.player.maxHealth || run.player.health;
  const newHealth = Math.min(run.player.health + healAmount, maxHealth);

  return {
    ...run,
    act,
    state: "in_progress",
    trueVictory: false,
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

const startAct2 = (run) => startNextAct(run, 2, ACT2_HEAL_AMOUNT);

const startAct3 = (run) => startNextAct(run, 3, ACT3_HEAL_AMOUNT);

module.exports = {
  startAct2,
  startAct3
};
