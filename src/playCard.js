// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CombatState} CombatState */

const { executeCardEffect } = require("./combatEngine");
const { checkCombatEnd } = require("./combatState");
const { playCardWithEnergy } = require("./energy");

/**
 * @param {Card[]} hand
 * @param {Card} card
 * @returns {Card[]}
 */
const removeCardFromHand = (hand, card) => {
  const index = hand.indexOf(card);
  if (index === -1) {
    return hand;
  }

  return [...hand.slice(0, index), ...hand.slice(index + 1)];
};

/**
 * @param {CombatState} combat
 * @param {Card} card
 */
const playCard = (combat, card) => {
  if (!combat.hand.includes(card)) {
    return {
      combat,
      rejected: true
    };
  }

  const energyResult = playCardWithEnergy(combat, card);
  if (energyResult.rejected) {
    return energyResult;
  }

  const afterEffect = checkCombatEnd(
    executeCardEffect(card, energyResult.combat)
  );
  const nextHand = removeCardFromHand(afterEffect.hand, card);

  const destinationKey = card.exhaust ? "exhaustPile" : "discardPile";

  return {
    rejected: false,
    combat: {
      ...afterEffect,
      hand: nextHand,
      [destinationKey]: [...(afterEffect[destinationKey] || []), card]
    }
  };
};

module.exports = {
  playCard
};
