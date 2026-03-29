// @ts-check

/** @typedef {import("./domain").RelicReward} RelicReward */

/** @type {(RelicReward & { rarity: string })[]} */
const RELICS = [
  // ── Common ────────────────────────────────────────────────────────────────
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
    id: "lucky_coin",
    name: "Lucky Coin",
    description: "+10 gold now; combat rewards give +5 extra gold",
    rarity: "common"
  },
  {
    id: "flicker_charm",
    name: "Flicker Charm",
    description: "Your first Attack each combat deals +3 damage",
    rarity: "common"
  },
  {
    id: "pilgrims_map",
    name: "Pilgrim's Map",
    description: "+10 gold now; non-boss combat rewards give +3 extra gold",
    rarity: "common"
  },
  {
    id: "leather_thread",
    name: "Leather Thread",
    description: "Gain +1 max HP after every 3 combats won",
    rarity: "common"
  },
  {
    id: "ashen_idol",
    name: "Ashen Idol",
    description: "Gain +1 energy on turn 1 only",
    rarity: "common"
  },

  // ── Uncommon ──────────────────────────────────────────────────────────────
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
    id: "brass_lantern",
    name: "Brass Lantern",
    description: "+1 energy per turn in Elite and Boss fights",
    rarity: "uncommon"
  },
  {
    id: "cracked_mirror",
    name: "Cracked Mirror",
    description: "Your first Skill each combat is fully played a second time",
    rarity: "uncommon"
  },
  {
    id: "thorn_crest",
    name: "Thorn Crest",
    description: "When you take HP damage, deal 3 damage back to the enemy",
    rarity: "uncommon"
  },
  {
    id: "soot_vessel",
    name: "Soot Vessel",
    description: "After winning a combat at 50% HP or less, heal 6",
    rarity: "uncommon"
  },
  {
    id: "duelists_thread",
    name: "Duelist's Thread",
    description: "Your first Attack each turn deals +2 damage",
    rarity: "uncommon"
  },
  {
    id: "grave_wick",
    name: "Grave Wick",
    description: "Your first Exhaust card each combat costs 0",
    rarity: "uncommon"
  },

  // ── Rare ──────────────────────────────────────────────────────────────────
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
  },
  {
    id: "crown_of_cinders",
    name: "Crown of Cinders",
    description: "+1 energy per turn; lose 2 max HP when obtained",
    rarity: "rare"
  },
  {
    id: "black_prism",
    name: "Black Prism",
    description: "After 3 total Exhausts in a combat, gain 1 energy",
    rarity: "rare"
  },
  {
    id: "storm_vessel",
    name: "Storm Vessel",
    description: "Becoming Charged on turn 2 or later gains +1 energy",
    rarity: "rare"
  },
  {
    id: "empty_throne",
    name: "Empty Throne",
    description: "Draw 2 extra cards on turn 1; draw 1 fewer on turn 2",
    rarity: "rare"
  },
  {
    id: "furnace_heart",
    name: "Furnace Heart",
    description: "Attack cards that Exhaust deal +4 damage",
    rarity: "rare"
  },
  {
    id: "hex_lantern",
    name: "Hex Lantern",
    description: "The first time you deal HP damage each combat, apply Hex 1",
    rarity: "rare"
  },
  {
    id: "golden_brand",
    name: "Golden Brand",
    description: "+25 gold now; card rewards offer 1 extra choice",
    rarity: "rare"
  },

  // ── Boss ──────────────────────────────────────────────────────────────────
  {
    id: "infernal_battery",
    name: "Infernal Battery",
    description: "+1 energy per turn; draw 1 fewer card on turn 1",
    rarity: "boss"
  },
  {
    id: "blood_crucible",
    name: "Blood Crucible",
    description: "Cards that cost HP double their energy and draw granted",
    rarity: "boss"
  },
  {
    id: "hex_crown",
    name: "Hex Crown",
    description: "Enemies start each combat with Hex 1",
    rarity: "boss"
  },
  {
    id: "crematorium_bell",
    name: "Crematorium Bell",
    description: "The first 2 Exhausts each combat also grant +1 energy",
    rarity: "boss"
  },
  {
    id: "storm_diadem",
    name: "Storm Diadem",
    description: "Start each combat already Charged",
    rarity: "boss"
  },
  {
    id: "vault_key",
    name: "Vault Key",
    description: "Boss fights offer 2 relic choices instead of 1",
    rarity: "boss"
  },
  // ── Status Effect Relics ──────────────────────────────────────────────────
  {
    id: "iron_boots",
    name: "Iron Boots",
    description: "Start each combat with 1 Strength",
    rarity: "common"
  },
  {
    id: "nimble_cloak",
    name: "Nimble Cloak",
    description: "Start each combat with 1 Dexterity",
    rarity: "common"
  },
  {
    id: "cracked_lens",
    name: "Cracked Lens",
    description: "Enemies start each combat with 1 Vulnerable",
    rarity: "uncommon"
  },
  {
    id: "silencing_stone",
    name: "Silencing Stone",
    description: "While the enemy is Weak, your first card each turn costs 0",
    rarity: "uncommon"
  },
  {
    id: "warlords_brand",
    name: "Warlord's Brand",
    description: "Whenever you gain Strength, gain 1 more",
    rarity: "rare"
  }
];

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
