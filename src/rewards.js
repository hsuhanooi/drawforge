// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardFactory} CardFactory */
/** @typedef {import("./domain").RelicReward} RelicReward */

const { REWARD_POOL: rewardPool } = require("./cards");
const { createBalanceConfig } = require("./balance");
const { createRelicReward, createRelicChoices: createTieredRelicChoices } = require("./relics");

/** @type {Record<string, number>} */
const RARITY_WEIGHTS = {
  common: 3,
  uncommon: 2,
  rare: 1
};

/**
 * Build a weighted pool where each factory appears according to its rarity weight.
 * Duplicates within the weighted pool are resolved when sampling (splice removes entries).
 * @param {CardFactory[]} factories
 * @returns {CardFactory[]}
 */
const buildWeightedPool = (factories) => {
  /** @type {CardFactory[]} */
  const weighted = [];
  for (const factory of factories) {
    const card = factory();
    const weight = RARITY_WEIGHTS[card.rarity || "common"] || 1;
    for (let i = 0; i < weight; i += 1) {
      weighted.push(factory);
    }
  }
  return weighted;
};

/**
 * @param {number | undefined} count
 * @param {object} [balanceOverrides]
 * @param {() => number} [rng]
 * @returns {Card[]}
 */
const createRewardOptions = (count, balanceOverrides = {}, rng = Math.random) => {
  const balance = createBalanceConfig(balanceOverrides);
  const optionCount = Math.min(count ?? balance.rewards.cardOptionCount, rewardPool.length);
  const weightedPool = buildWeightedPool(rewardPool);
  /** @type {Set<string>} */
  const selectedIds = new Set();
  /** @type {Card[]} */
  const options = [];

  while (options.length < optionCount && weightedPool.length > 0) {
    const index = Math.floor(rng() * weightedPool.length);
    const factory = weightedPool.splice(index, 1)[0];
    const card = factory();
    if (!selectedIds.has(card.id)) {
      selectedIds.add(card.id);
      options.push(card);
      for (let i = weightedPool.length - 1; i >= 0; i -= 1) {
        if (weightedPool[i] === factory) {
          weightedPool.splice(i, 1);
        }
      }
    }
  }

  return options;
};

/**
 * @param {number} count
 * @returns {RelicReward[]}
 */
const createRelicChoices = (count = 3) => {
  /** @type {RelicReward[]} */
  const choices = [];
  const seen = new Set();

  while (choices.length < count) {
    const relic = createRelicReward(1);
    if (seen.has(relic.id)) {
      continue;
    }
    seen.add(relic.id);
    choices.push(relic);
  }

  return choices;
};

/**
 * @param {string[]} deck
 * @param {Card} card
 * @returns {string[]}
 */
const addRewardCardToDeck = (deck, card) => [...deck, card.id];

const hasRunRelic = (run, id) => run && (run.relics || []).some((r) => r.id === id);

/**
 * @param {"combat" | "elite" | "boss"} [nodeType]
 * @param {object} [run]
 * @param {object} [balanceOverrides]
 * @returns {{ cards: Card[], gold: number, relic: RelicReward | null, relics: RelicReward[], removeCard: boolean }}
 */
const createVictoryRewards = (nodeType = "combat", run = null, balanceOverrides = {}) => {
  const extraCards = (hasRunRelic(run, "merchant_ledger") || hasRunRelic(run, "golden_brand")) ? 1 : 0;
  const cards = createRewardOptions((createBalanceConfig(balanceOverrides).rewards.cardOptionCount) + extraCards, balanceOverrides);
  /** @type {{ cards: Card[], gold: number, relic: RelicReward | null, relics: RelicReward[], removeCard: boolean }} */
  const rewards = {
    cards,
    gold: nodeType === "boss" ? 50 : nodeType === "elite" ? 25 : 12,
    relic: null,
    relics: [],
    removeCard: false
  };

  if (nodeType === "elite") {
    rewards.relics = createRelicChoices(3);
  }
  else if (nodeType === "boss") {
    const vaultKey = hasRunRelic(run, "vault_key");
    if (vaultKey && run) {
      rewards.relics = createTieredRelicChoices(run.relics || [], "boss", true);
    } else {
      rewards.relic = createRelicReward(2);
    }
  }

  return rewards;
};

module.exports = {
  createRewardOptions,
  createRelicChoices,
  addRewardCardToDeck,
  createVictoryRewards
};
