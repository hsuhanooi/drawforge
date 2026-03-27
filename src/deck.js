const { DEFAULT_STARTER_DECK } = require("./constants");
const { REWARD_POOL } = require("./cards");

const BONUS_STARTER_POOL = REWARD_POOL;

const createStarterDeck = (rng = Math.random) => {
  const index = Math.floor(rng() * BONUS_STARTER_POOL.length);
  const bonusCard = BONUS_STARTER_POOL[index]();
  return [...DEFAULT_STARTER_DECK, bonusCard.id];
};

module.exports = {
  createStarterDeck,
  BONUS_STARTER_POOL
};
