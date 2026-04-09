// @ts-check

/** @typedef {import("./domain").RelicReward} RelicReward */

const { RELIC_REGISTRY } = require("./relicRegistry");

/** @type {(RelicReward & { rarity: string, tier: string, effectText: string, triggerType: string, assetRef: string, status: string })[]} */
const RELICS = RELIC_REGISTRY.map((relic) => ({
  id: relic.id,
  name: relic.name,
  description: relic.effectText,
  rarity: relic.rarity,
  tier: relic.tier,
  effectText: relic.effectText,
  triggerType: relic.triggerType,
  assetRef: relic.assetRef,
  status: relic.status
}));

const COMMON_RELICS = RELICS.filter((r) => r.rarity === "common");
const UNCOMMON_RELICS = RELICS.filter((r) => r.rarity === "uncommon");
const RARE_RELICS = RELICS.filter((r) => r.rarity === "rare");
const BOSS_RELICS = RELICS.filter((r) => r.rarity === "boss");

/**
 * @param {RelicReward[]} owned
 * @param {(RelicReward & { rarity: string })[]} pool
 * @param {number} count
 * @returns {(RelicReward & { rarity: string })[]}
 */
const pickRelics = (owned, pool, count) => {
  const ownedIds = new Set((owned || []).map((r) => r.id));
  const available = pool.filter((r) => !ownedIds.has(r.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * @param {RelicReward[]} ownedRelics
 * @param {"elite" | "boss"} tier
 * @param {boolean} [vaultKey]
 * @returns {(RelicReward & { rarity: string })[]}
 */
const createRelicChoices = (ownedRelics, tier, vaultKey = false) => {
  const count = vaultKey ? 2 : 1;
  if (tier === "boss") {
    return pickRelics(ownedRelics, [...RARE_RELICS, ...BOSS_RELICS], count);
  }
  return pickRelics(ownedRelics, [...COMMON_RELICS, ...UNCOMMON_RELICS], count);
};

/**
 * @param {number} [tier] - kept for backward compat; use createRelicChoices for new code
 * @returns {RelicReward & { rarity: string }}
 */
const createRelicReward = (tier = 1) => {
  const pool = tier === 2
    ? [...UNCOMMON_RELICS, ...RARE_RELICS]
    : [...COMMON_RELICS, ...UNCOMMON_RELICS];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

/**
 * @param {{ player: { health: number, gold: number, maxHealth?: number }, relics?: RelicReward[] } & Record<string, unknown>} run
 * @param {RelicReward} relic
 */
const addRelicToRun = (run, relic) => {
  const relics = [...(run.relics || []), relic];
  const nextPlayer = { ...run.player };

  if (relic.id === "iron_core") {
    nextPlayer.health += 5;
    nextPlayer.maxHealth = (nextPlayer.maxHealth || nextPlayer.health) + 5;
  }

  if (relic.id === "feather_charm") {
    nextPlayer.gold += 15;
  }

  if (relic.id === "lucky_coin") {
    nextPlayer.gold += 10;
  }

  if (relic.id === "pilgrims_map") {
    nextPlayer.gold += 10;
  }

  if (relic.id === "golden_brand") {
    nextPlayer.gold += 25;
  }

  if (relic.id === "crown_of_cinders") {
    const maxH = nextPlayer.maxHealth || nextPlayer.health;
    nextPlayer.maxHealth = Math.max(1, maxH - 2);
    nextPlayer.health = Math.min(nextPlayer.health, nextPlayer.maxHealth);
  }

  return {
    ...run,
    relics,
    player: nextPlayer
  };
};

/**
 * @param {{ relics?: RelicReward[] }} run
 * @param {string} [nodeType]
 * @returns {number}
 */
const getCombatEnergyBonus = (run, nodeType) => {
  let bonus = 0;
  const relics = run.relics || [];
  if (relics.some((r) => r.id === "ember_ring")) bonus += 1;
  if (relics.some((r) => r.id === "crown_of_cinders")) bonus += 1;
  if (relics.some((r) => r.id === "infernal_battery")) bonus += 1;
  if (relics.some((r) => r.id === "brass_lantern") && (nodeType === "elite" || nodeType === "boss")) bonus += 1;
  return bonus;
};

module.exports = {
  RELICS,
  COMMON_RELICS,
  UNCOMMON_RELICS,
  RARE_RELICS,
  BOSS_RELICS,
  createRelicReward,
  createRelicChoices,
  addRelicToRun,
  getCombatEnergyBonus
};
