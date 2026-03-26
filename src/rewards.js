// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardFactory} CardFactory */
/** @typedef {import("./domain").RelicReward} RelicReward */

const {
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
  lingeringCurseCardDefinition,
  markOfRuinCardDefinition,
  hexbladeCardDefinition,
  reaperSClauseCardDefinition,
  fireSaleCardDefinition,
  cremateCardDefinition,
  graveFuelCardDefinition,
  brandTheSoulCardDefinition,
  harvesterCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition,
  bloodPactCardDefinition,
  spiteShieldCardDefinition
} = require("./cards");
const { createBalanceConfig } = require("./balance");
const { createRelicReward } = require("./relics");

/** @type {CardFactory[]} */
const rewardPool = [
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
  lingeringCurseCardDefinition,
  markOfRuinCardDefinition,
  hexbladeCardDefinition,
  reaperSClauseCardDefinition,
  fireSaleCardDefinition,
  cremateCardDefinition,
  graveFuelCardDefinition,
  brandTheSoulCardDefinition,
  harvesterCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition,
  bloodPactCardDefinition,
  spiteShieldCardDefinition
];

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
      // Remove all remaining instances of this factory from the weighted pool
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
 * @param {string[]} deck
 * @param {Card} card
 * @returns {string[]}
 */
const addRewardCardToDeck = (deck, card) => [...deck, card.id];

/**
 * @param {"combat" | "elite" | "boss"} [nodeType]
 * @param {object} [balanceOverrides]
 * @returns {{ cards: Card[], gold: number, relic: RelicReward | null }}
 */
const createVictoryRewards = (nodeType = "combat", balanceOverrides = {}) => {
  const cards = createRewardOptions(undefined, balanceOverrides);
  /** @type {{ cards: Card[], gold: number, relic: RelicReward | null, removeCard: boolean }} */
  const rewards = {
    cards,
    gold: nodeType === "boss" ? 50 : nodeType === "elite" ? 25 : 12,
    relic: null,
    removeCard: nodeType === "elite"
  };

  if (nodeType === "elite" || nodeType === "boss") {
    rewards.relic = createRelicReward(nodeType === "boss" ? 2 : 1);
  }

  return rewards;
};

module.exports = {
  createRewardOptions,
  addRewardCardToDeck,
  createVictoryRewards
};
