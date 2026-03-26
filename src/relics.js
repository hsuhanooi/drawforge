// @ts-check

/** @typedef {import("./domain").RelicReward} RelicReward */

/** @type {(RelicReward & { rarity: string })[]} */
const RELICS = [
  {
    id: "iron_core",
    name: "Iron Core",
    description: "+5 max health and heal 5 immediately",
    rarity: "common"
  },
  {
    id: "feather_charm",
    name: "Feather Charm",
    description: "Gain 15 gold immediately",
    rarity: "common"
  },
  {
    id: "ember_ring",
    name: "Ember Ring",
    description: "Start combat with +1 energy",
    rarity: "common"
  },
  {
    id: "bone_token",
    name: "Bone Token",
    description: "Heal 3 after each combat victory",
    rarity: "common"
  },
  {
    id: "rusted_buckler",
    name: "Rusted Buckler",
    description: "Start each combat with 4 Block",
    rarity: "common"
  },
  {
    id: "quickened_loop",
    name: "Quickened Loop",
    description: "Draw 1 additional card on the first turn of each combat",
    rarity: "common"
  },
  {
    id: "worn_grimoire",
    name: "Worn Grimoire",
    description: "The first time you apply Hex each combat, apply +1 additional Hex",
    rarity: "uncommon"
  },
  {
    id: "coal_pendant",
    name: "Coal Pendant",
    description: "The first card you Exhaust each combat draws 1 card",
    rarity: "uncommon"
  },
  {
    id: "hex_nail",
    name: "Hex Nail",
    description: "Attack cards deal +2 damage to Hexed enemies",
    rarity: "uncommon"
  },
  {
    id: "cinder_box",
    name: "Cinder Box",
    description: "Whenever you Exhaust a card, gain 2 Block",
    rarity: "uncommon"
  },
  {
    id: "volt_shard",
    name: "Volt Shard",
    description: "When you become Charged, gain 1 Block and draw 1",
    rarity: "uncommon"
  },
  {
    id: "merchant_ledger",
    name: "Merchant's Ledger",
    description: "Card rewards after combat offer 1 extra choice",
    rarity: "uncommon"
  },
  {
    id: "sigil_engine",
    name: "Sigil Engine",
    description: "When an enemy first reaches 3+ Hex in a combat, deal 8 damage to it",
    rarity: "rare"
  },
  {
    id: "time_locked_seal",
    name: "Time-Locked Seal",
    description: "The first card you play each turn that costs 1 or less costs 0",
    rarity: "rare"
  },
  {
    id: "phoenix_ash",
    name: "Phoenix Ash",
    description: "Once per run, if you would die, survive at 1 HP instead",
    rarity: "rare"
  }
];

const COMMON_RELICS = RELICS.filter((r) => r.rarity === "common");
const UNCOMMON_RELICS = RELICS.filter((r) => r.rarity === "uncommon");
const RARE_RELICS = RELICS.filter((r) => r.rarity === "rare");

/**
 * @param {number} [tier] - 1 = elite reward (common+uncommon), 2 = boss reward (uncommon+rare)
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
 * @param {{ player: { health: number, gold: number }, relics?: RelicReward[] } & Record<string, unknown>} run
 * @param {RelicReward} relic
 */
const addRelicToRun = (run, relic) => {
  const relics = [...(run.relics || []), relic];
  const nextPlayer = { ...run.player };

  if (relic.id === "iron_core") {
    nextPlayer.health += 5;
  }

  if (relic.id === "feather_charm") {
    nextPlayer.gold += 15;
  }

  return {
    ...run,
    relics,
    player: nextPlayer
  };
};

/**
 * @param {{ relics?: RelicReward[] }} run
 * @returns {number}
 */
const getCombatEnergyBonus = (run) => ((run.relics || []).some((relic) => relic.id === "ember_ring") ? 1 : 0);

module.exports = {
  RELICS,
  createRelicReward,
  addRelicToRun,
  getCombatEnergyBonus
};
