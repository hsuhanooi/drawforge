const { strikeCardDefinition, defendCardDefinition } = require("./cards");
const { createBalanceConfig } = require("./balance");

const createRewardOptions = (count, balanceOverrides = {}) => {
  const balance = createBalanceConfig(balanceOverrides);
  const optionCount = count ?? balance.rewards.cardOptionCount;
  const pool = [strikeCardDefinition, defendCardDefinition];
  const options = [];

  for (let i = 0; i < optionCount; i += 1) {
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
