// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CombatState} CombatState */

/**
 * @param {Card} card
 * @param {CombatState} state
 * @returns {CombatState}
 */
const executeCardEffect = (card, state) => card.effect(state);

module.exports = {
  executeCardEffect
};
