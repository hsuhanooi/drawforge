const RELIC_REGISTRY = [
  { id: "iron_core", name: "Iron Core", rarity: "common", tier: "elite", effectText: "+5 max health and heal 5 immediately", status: "implemented" },
  { id: "feather_charm", name: "Feather Charm", rarity: "common", tier: "elite", effectText: "Gain 15 gold immediately", status: "implemented" },
  { id: "ember_ring", name: "Ember Ring", rarity: "common", tier: "elite", effectText: "Start combat with +1 energy", status: "implemented" },
  { id: "bone_token", name: "Bone Token", rarity: "common", tier: "elite", effectText: "Heal 3 after each combat victory", status: "implemented" },
  { id: "rusted_buckler", name: "Rusted Buckler", rarity: "common", tier: "elite", effectText: "Start each combat with 4 Block", status: "implemented" },
  { id: "quickened_loop", name: "Quickened Loop", rarity: "common", tier: "elite", effectText: "Draw 1 additional card on the first turn of each combat", status: "implemented" },
  { id: "lucky_coin", name: "Lucky Coin", rarity: "common", tier: "elite", effectText: "+10 gold now; combat rewards give +5 extra gold", status: "missing" },
  { id: "flicker_charm", name: "Flicker Charm", rarity: "common", tier: "elite", effectText: "First Attack each combat deals +3 damage", status: "missing" },
  { id: "pilgrims_map", name: "Pilgrim's Map", rarity: "common", tier: "elite", effectText: "+10 gold now; non-boss rewards give +3 extra gold", status: "missing" },
  { id: "leather_thread", name: "Leather Thread", rarity: "common", tier: "elite", effectText: "+1 max HP after every 3 combats won", status: "missing" },
  { id: "ashen_idol", name: "Ashen Idol", rarity: "common", tier: "elite", effectText: "+1 energy on turn 1 only", status: "missing" },
  { id: "worn_grimoire", name: "Worn Grimoire", rarity: "uncommon", tier: "elite", effectText: "The first time you apply Hex each combat, apply +1 additional Hex", status: "implemented" },
  { id: "coal_pendant", name: "Coal Pendant", rarity: "uncommon", tier: "elite", effectText: "The first card you Exhaust each combat draws 1 card", status: "implemented" },
  { id: "hex_nail", name: "Hex Nail", rarity: "uncommon", tier: "elite", effectText: "Attack cards deal +2 damage to Hexed enemies", status: "implemented" },
  { id: "cinder_box", name: "Cinder Box", rarity: "uncommon", tier: "elite", effectText: "Whenever you Exhaust a card, gain 2 Block", status: "implemented" },
  { id: "volt_shard", name: "Volt Shard", rarity: "uncommon", tier: "elite", effectText: "When you become Charged, gain 1 Block and draw 1", status: "implemented" },
  { id: "merchant_ledger", name: "Merchant's Ledger", rarity: "uncommon", tier: "elite", effectText: "Card rewards after combat offer 1 extra choice", status: "implemented" },
  { id: "brass_lantern", name: "Brass Lantern", rarity: "uncommon", tier: "elite", effectText: "+1 energy per turn in Elite and Boss fights", status: "missing" },
  { id: "cracked_mirror", name: "Cracked Mirror", rarity: "uncommon", tier: "elite", effectText: "First Skill each combat is fully played a second time", status: "missing" },
  { id: "thorn_crest", name: "Thorn Crest", rarity: "uncommon", tier: "elite", effectText: "When you take HP damage, deal 3 back to the enemy", status: "missing" },
  { id: "soot_vessel", name: "Soot Vessel", rarity: "uncommon", tier: "elite", effectText: "After a victory at 50% HP or lower, heal 6", status: "missing" },
  { id: "duelists_thread", name: "Duelist's Thread", rarity: "uncommon", tier: "elite", effectText: "First Attack each turn deals +2 damage", status: "missing" },
  { id: "grave_wick", name: "Grave Wick", rarity: "uncommon", tier: "elite", effectText: "First Exhaust-typed card each combat costs 0", status: "missing" },
  { id: "sigil_engine", name: "Sigil Engine", rarity: "rare", tier: "boss_or_rare", effectText: "When an enemy first reaches 3+ Hex in a combat, deal 8 damage to it", status: "implemented" },
  { id: "time_locked_seal", name: "Time-Locked Seal", rarity: "rare", tier: "boss_or_rare", effectText: "The first card you play each turn that costs 1 or less costs 0", status: "implemented" },
  { id: "phoenix_ash", name: "Phoenix Ash", rarity: "rare", tier: "boss_or_rare", effectText: "Once per run, if you would die, survive at 1 HP instead", status: "implemented" },
  { id: "crown_of_cinders", name: "Crown of Cinders", rarity: "rare", tier: "boss_or_rare", effectText: "+1 energy per turn; costs 2 max HP when obtained", status: "missing" },
  { id: "black_prism", name: "Black Prism", rarity: "rare", tier: "boss_or_rare", effectText: "After 3 total Exhausts in a combat, gain 1 energy", status: "missing" },
  { id: "storm_vessel", name: "Storm Vessel", rarity: "rare", tier: "boss_or_rare", effectText: "Becoming Charged on turn 2+: gain +1 energy", status: "missing" },
  { id: "empty_throne", name: "Empty Throne", rarity: "rare", tier: "boss_or_rare", effectText: "Draw 2 extra on turn 1; draw 1 fewer on turn 2", status: "missing" },
  { id: "furnace_heart", name: "Furnace Heart", rarity: "rare", tier: "boss_or_rare", effectText: "Attack cards that self-Exhaust deal +4 damage", status: "missing" },
  { id: "hex_lantern", name: "Hex Lantern", rarity: "rare", tier: "boss_or_rare", effectText: "First time you deal HP damage each combat: apply Hex 1", status: "missing" },
  { id: "golden_brand", name: "Golden Brand", rarity: "rare", tier: "boss_or_rare", effectText: "+25 gold; card rewards offer 1 extra choice", status: "missing" },
  { id: "infernal_battery", name: "Infernal Battery", rarity: "boss", tier: "boss", effectText: "+1 energy per turn; draw 1 fewer card on turn 1", status: "missing" },
  { id: "blood_crucible", name: "Blood Crucible", rarity: "boss", tier: "boss", effectText: "Cards that cost HP double their energy and draw granted", status: "missing" },
  { id: "hex_crown", name: "Hex Crown", rarity: "boss", tier: "boss", effectText: "Enemies start each combat with Hex 1", status: "missing" },
  { id: "crematorium_bell", name: "Crematorium Bell", rarity: "boss", tier: "boss", effectText: "First 2 Exhausts each combat also grant +1 energy", status: "missing" },
  { id: "storm_diadem", name: "Storm Diadem", rarity: "boss", tier: "boss", effectText: "Start each combat Charged", status: "missing" },
  { id: "vault_key", name: "Vault Key", rarity: "boss", tier: "boss", effectText: "Boss fights offer 2 relic choices instead of 1", status: "missing" }
];

const DESIGNED_RELIC_SET = RELIC_REGISTRY;
const IMPLEMENTED_RELIC_IDS = RELIC_REGISTRY.filter((relic) => relic.status === "implemented").map((relic) => relic.id);
const MISSING_RELIC_IDS = RELIC_REGISTRY.filter((relic) => relic.status === "missing").map((relic) => relic.id);

module.exports = {
  RELIC_REGISTRY,
  DESIGNED_RELIC_SET,
  IMPLEMENTED_RELIC_IDS,
  MISSING_RELIC_IDS
};
