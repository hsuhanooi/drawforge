const { startPlayerTurn } = require("./energy");
const { drawCards } = require("./deckZones");

const startNextPlayerTurn = (combat) => {
  const cleared = {
    ...combat,
    player: {
      ...combat.player,
      block: 0
    }
  };

  return startPlayerTurn(cleared);
};

const endPlayerTurn = (combat) => ({
  ...combat,
  turn: "enemy",
  enemyPhase: "action"
});

const startPlayerTurnAfterEnemy = (combat, drawCount = 5) => {
  const refreshed = startNextPlayerTurn(combat);
  const drawn = drawCards(
    {
      drawPile: refreshed.drawPile || [],
      hand: refreshed.hand || [],
      discardPile: refreshed.discardPile || []
    },
    drawCount
  );

  return {
    ...refreshed,
    hand: drawn.hand,
    drawPile: drawn.drawPile,
    discardPile: drawn.discardPile
  };
};

module.exports = {
  startNextPlayerTurn,
  endPlayerTurn,
  startPlayerTurnAfterEnemy
};
