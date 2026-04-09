// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardDefinitionInput} CardDefinitionInput */

/**
 * @param {CardDefinitionInput} definition
 * @returns {Card}
 */
const createCard = ({
  id,
  name,
  cost,
  type,
  effect,
  effects,
  exhaust = false,
  rarity = "common",
  keywords = [],
  ...rest
}) => ({
  id,
  name,
  cost,
  type,
  effect,
  effects,
  exhaust,
  rarity,
  keywords,
  ...rest
});

module.exports = {
  createCard
};
