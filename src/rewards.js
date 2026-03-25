const { strikeCardDefinition, defendCardDefinition } = require("./cards");
const { createBalanceConfig } = require("./balance");
const { createRelicReward } = require("./relics");

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

const createVictoryRewards = (nodeType = "combat", balanceOverrides = {}) => {
  const cards = createRewardOptions(undefined, balanceOverrides);
  const rewards = {
    cards,
    gold: nodeType === "boss" ? 50 : nodeType === "elite" ? 25 : 12,
    relic: null
  };

  if (["elite", "boss"].includes(nodeType)) {
    rewards.relic = createRelicReward(nodeType === "boss" ? 2 : 1);
  }

  return rewards;
};

module.exports = {
  createRewardOptions,
  addRewardCardToDeck,
  createVictoryRewards
};
