const { strikeCardDefinition, defendCardDefinition } = require("./cards");

const createRewardOptions = (count = 3) => {
  const pool = [strikeCardDefinition, defendCardDefinition];
  const options = [];
  for (let i = 0; i < count; i += 1) {
    const factory = pool[i % pool.length];
    options.push(factory());
  }
  return options;
};

const addRewardCardToDeck = (deck, card) => [...deck, card.id];

module.exports = {
  createRewardOptions,
  addRewardCardToDeck
};
