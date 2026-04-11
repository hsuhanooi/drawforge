// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardFactory} CardFactory */
/** @typedef {import("./domain").RelicReward} RelicReward */

const { REWARD_POOL: rewardPool } = require("./cards");
const { createBalanceConfig } = require("./balance");
const { createRelicReward, createRelicChoices: createTieredRelicChoices } = require("./relics");
const { createRandomPotion, POTION_DROP_CHANCE, MAX_POTIONS } = require("./potions");

/** @type {Record<string, string[]>} */
const ARCHETYPE_CARD_THEMES = {
  hex_witch: ["Hex", "Hex / Exhaust", "Debuff"],
  ashen_knight: ["Exhaust", "Hex / Exhaust", "Burn"],
  static_duelist: ["Charged", "Defense"],
  poison_vanguard: ["Poison", "Debuff"]
};

const RARITY_SCORE = {
  common: 1,
  uncommon: 2,
  rare: 3
};

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
 * Build a weighted pool biased 50% toward the current run archetype's themed cards.
 * Falls back to the unbiased pool when archetype is null or unrecognized.
 * @param {CardFactory[]} factories
 * @param {string | null | undefined} archetype
 * @returns {CardFactory[]}
 */
const buildBiasedPool = (factories, archetype) => {
  const themes = ARCHETYPE_CARD_THEMES[archetype];
  if (!themes) return buildWeightedPool(factories);
  const themed = factories.filter((f) => {
    const card = f();
    return themes.some((t) => (card.archetype || "").includes(t));
  });
  const general = factories.filter((f) => !themed.includes(f));
  const half = Math.ceil(factories.length / 2);
  const themedPool = buildWeightedPool(themed.length > 0 ? themed : factories);
  const generalPool = buildWeightedPool(general.length > 0 ? general : factories);
  return [...themedPool.slice(0, half), ...generalPool.slice(0, half)];
};

/**
 * @param {number | undefined} count
 * @param {object} [balanceOverrides]
 * @param {() => number} [rng]
 * @param {CardFactory[] | null} [poolOverride]
 * @returns {Card[]}
 */
const createRewardOptions = (count, balanceOverrides = {}, rng = Math.random, poolOverride = null) => {
  const balance = createBalanceConfig(balanceOverrides);
  const optionCount = Math.min(count ?? balance.rewards.cardOptionCount, rewardPool.length);
  const weightedPool = poolOverride ? [...poolOverride] : buildWeightedPool(rewardPool);
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

const scoreRewardCard = (card) => (RARITY_SCORE[card.rarity] || 0) * 100 + ((card.cost === 0 ? 5 : 0) + (card.keywords?.length || 0));

const createVictoryCardRewards = (nodeType = "combat", run = null, balanceOverrides = {}, rng = Math.random) => {
  const act = run?.act || 1;
  const extraCards = (hasRunRelic(run, "merchant_ledger") || hasRunRelic(run, "golden_brand")) ? 1 : 0;
  const baseCount = createBalanceConfig(balanceOverrides).rewards.cardOptionCount;
  const optionCount = baseCount + extraCards + (act >= 2 && nodeType === "combat" ? 1 : 0);
  const candidateCount = Math.min(rewardPool.length, Math.max(optionCount + 3, optionCount * 2));
  const biasedPool = run?.archetype ? buildBiasedPool(rewardPool, run.archetype) : null;
  const candidates = createRewardOptions(candidateCount, balanceOverrides, rng, biasedPool);
  const rarityFloor = nodeType === "boss" ? 2 : nodeType === "elite" || act >= 3 ? 1.5 : 1;
  const filtered = candidates.filter((card) => (RARITY_SCORE[card.rarity] || 0) >= rarityFloor || card.rarity === "rare");
  const pool = (filtered.length >= optionCount ? filtered : candidates)
    .sort((left, right) => scoreRewardCard(right) - scoreRewardCard(left));
  return pool.slice(0, optionCount);
};

/**
 * @param {"combat" | "elite" | "boss"} [nodeType]
 * @param {object} [run]
 * @param {object} [balanceOverrides]
 * @param {() => number} [rng]
 * @returns {{ cards: Card[], gold: number, relic: RelicReward | null, relics: RelicReward[], removeCard: boolean, potion: object | null }}
 */
const createVictoryRewards = (nodeType = "combat", run = null, balanceOverrides = {}, rng = Math.random) => {
  const cards = createVictoryCardRewards(nodeType, run, balanceOverrides, rng);
  const currentPotions = run ? (run.potions || []) : [];
  const canReceivePotion = currentPotions.length < MAX_POTIONS;
  const potionDrops = nodeType === "elite" ? POTION_DROP_CHANCE : 0;
  const potion = canReceivePotion && rng() < potionDrops ? createRandomPotion(rng) : null;
  /** @type {{ cards: Card[], gold: number, relic: RelicReward | null, relics: RelicReward[], removeCard: boolean, potion: object | null }} */
  const rewards = {
    cards,
    gold: nodeType === "boss" ? 50 : nodeType === "elite" ? 25 : 12,
    relic: null,
    relics: [],
    removeCard: false,
    potion
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
  createVictoryCardRewards,
  createVictoryRewards
};
