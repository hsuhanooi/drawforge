const { DEFAULT_STARTER_DECK } = require("./constants");
const {
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition,
  markOfRuinCardDefinition,
  hexbladeCardDefinition,
  fireSaleCardDefinition,
  cremateCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition
} = require("./cards");

const BONUS_STARTER_POOL = [
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition,
  markOfRuinCardDefinition,
  hexbladeCardDefinition,
  fireSaleCardDefinition,
  cremateCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition
];

const createStarterDeck = (rng = Math.random) => {
  const index = Math.floor(rng() * BONUS_STARTER_POOL.length);
  const bonusCard = BONUS_STARTER_POOL[index]();
  return [...DEFAULT_STARTER_DECK, bonusCard.id];
};

module.exports = {
  createStarterDeck,
  BONUS_STARTER_POOL
};
