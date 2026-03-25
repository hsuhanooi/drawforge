const { DEFAULT_PLAYER_ENERGY } = require("./constants");

const startPlayerTurn = (combat, energy = DEFAULT_PLAYER_ENERGY) => ({
  ...combat,
  turn: "player",
  player: {
    ...combat.player,
    energy
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
