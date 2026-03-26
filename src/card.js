// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardDefinitionInput} CardDefinitionInput */

/**
 * @param {CardDefinitionInput} definition
 * @returns {Card}
 */
const createCard = ({ id, name, cost, type, effect, exhaust = false }) => ({
  id,
  name,
  cost,
  type,
  effect,
  exhaust
});

module.exports = {
  createCard
};
