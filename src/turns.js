// @ts-check

/** @typedef {import("./domain").CombatState} CombatState */

const { startPlayerTurn } = require("./energy");
const { drawCards } = require("./deckZones");

/**
 * @param {CombatState} combat
 * @returns {CombatState}
 */
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

/**
 * @param {CombatState} combat
 * @returns {CombatState}
 */
const endPlayerTurn = (combat) => ({
  ...combat,
  turn: "enemy",
  enemyPhase: "action"
});

/**
 * @param {CombatState} combat
 * @param {number} [drawCount]
 * @returns {CombatState}
 */
const startPlayerTurnAfterEnemy = (combat, drawCount = 5) => {
  const refreshed = startNextPlayerTurn(combat);
  const drawn = drawCards(
    {
      ...refreshed,
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
