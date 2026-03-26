// @ts-check

/** @typedef {import("./types").Card} Card */
/** @typedef {import("./types").CardFactory} CardFactory */

const {
  strikeCardDefinition,
  defendCardDefinition,
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition,
  surgeCardDefinition,
  hexCardDefinition,
  punishCardDefinition,
  burnoutCardDefinition,
  crackdownCardDefinition,
  momentumCardDefinition,
  witherCardDefinition,
  siphonWardCardDefinition,
  detonateSigilCardDefinition,
  lingeringCurseCardDefinition
} = require("./cards");
const { createBalanceConfig } = require("./balance");
const { createRelicReward } = require("./relics");

/** @type {CardFactory[]} */
const rewardPool = [
  strikeCardDefinition,
  defendCardDefinition,
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition,
  surgeCardDefinition,
  hexCardDefinition,
  punishCardDefinition,
  burnoutCardDefinition,
  crackdownCardDefinition,
  momentumCardDefinition,
  witherCardDefinition,
  siphonWardCardDefinition,
  detonateSigilCardDefinition,
  lingeringCurseCardDefinition
];

/**
 * @param {number | undefined} count
 * @param {object} [balanceOverrides]
 * @param {() => number} [rng]
 * @returns {Card[]}
 */
const createRewardOptions = (count, balanceOverrides = {}, rng = Math.random) => {
  const balance = createBalanceConfig(balanceOverrides);
  const optionCount = Math.min(count ?? balance.rewards.cardOptionCount, rewardPool.length);
  const pool = [...rewardPool];
  /** @type {Card[]} */
  const options = [];

  for (let i = 0; i < optionCount; i += 1) {
    const index = Math.floor(rng() * pool.length);
    const [factory] = pool.splice(index, 1);
    options.push(factory());
  }

  return options;
};

/**
 * @param {string[]} deck
 * @param {Card} card
 */
const addRewardCardToDeck = (deck, card) => [...deck, card.id];

/**
 * @param {"combat" | "elite" | "boss"} [nodeType]
 * @param {object} [balanceOverrides]
 */
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
