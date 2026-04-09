// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardDefinitionInput} CardDefinitionInput */

/**
 * @param {CardDefinitionInput} definition
 * @returns {Card}
 */
const createCard = ({ id, name, cost, type, effect, effects, exhaust = false, rarity = "common", keywords = [] }) => ({
  id,
  name,
  cost,
  type,
  effect,
  effects,
  exhaust,
  rarity,
  keywords
});

module.exports = {
  createCard
};
