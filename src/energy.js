const { DEFAULT_PLAYER_ENERGY } = require("./constants");
const { createBalanceConfig } = require("./balance");

const resolveEnergy = (energyOrBalance) => {
  if (typeof energyOrBalance === "number") {
    return energyOrBalance;
  }

  if (energyOrBalance && typeof energyOrBalance === "object") {
    return createBalanceConfig(energyOrBalance).player.energy;
  }

  return DEFAULT_PLAYER_ENERGY;
};

const startPlayerTurn = (combat, energyOrBalance = DEFAULT_PLAYER_ENERGY) => ({
  ...combat,
  turn: "player",
  player: {
    ...combat.player,
    energy: resolveEnergy(energyOrBalance)
  }
});

const canPlayCard = (combat, card) => combat.player.energy >= card.cost;

const playCardWithEnergy = (combat, card) => {
  if (!canPlayCard(combat, card)) {
    return {
      combat,
      rejected: true
    };
  }

  return {
    combat: {
      ...combat,
      player: {
        ...combat.player,
        energy: combat.player.energy - card.cost
      }
    },
    rejected: false
  };
};

module.exports = {
  startPlayerTurn,
  canPlayCard,
  playCardWithEnergy
};
