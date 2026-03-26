// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CombatState} CombatState */

const { DEFAULT_PLAYER_ENERGY } = require("./constants");
const { createBalanceConfig } = require("./balance");

/**
 * @param {number | object | undefined} energyOrBalance
 * @returns {number}
 */
const resolveEnergy = (energyOrBalance) => {
  if (typeof energyOrBalance === "number") {
    return energyOrBalance;
  }

  if (energyOrBalance && typeof energyOrBalance === "object") {
    return createBalanceConfig(energyOrBalance).player.energy;
  }

  return DEFAULT_PLAYER_ENERGY;
};

/**
 * @param {CombatState} combat
 * @param {number | object} [energyOrBalance]
 * @returns {CombatState}
 */
const startPlayerTurn = (combat, energyOrBalance = DEFAULT_PLAYER_ENERGY) => ({
  ...combat,
  turn: "player",
  player: {
    ...combat.player,
    energy: resolveEnergy(energyOrBalance)
  }
});

/**
 * @param {CombatState} combat
 * @param {Card} card
 * @returns {boolean}
 */
const canPlayCard = (combat, card) => (combat.player.energy ?? 0) >= card.cost;

/**
 * @param {CombatState} combat
 * @param {Card} card
 */
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
        energy: (combat.player.energy ?? 0) - card.cost
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
