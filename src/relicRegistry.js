const RELIC_REGISTRY = [
  { id: "iron_core", name: "Iron Core", rarity: "common", tier: "elite", effectText: "+5 max health and heal 5 immediately", triggerType: "passive", assetRef: "relics/iron_core", status: "implemented" },
  { id: "feather_charm", name: "Feather Charm", rarity: "common", tier: "elite", effectText: "Gain 15 gold immediately", triggerType: "passive", assetRef: "relics/feather_charm", status: "implemented" },
  { id: "ember_ring", name: "Ember Ring", rarity: "common", tier: "elite", effectText: "Start combat with +1 energy", triggerType: "start_of_combat", assetRef: "relics/ember_ring", status: "implemented" },
  { id: "bone_token", name: "Bone Token", rarity: "common", tier: "elite", effectText: "Heal 3 after each combat victory", triggerType: "post_combat", assetRef: "relics/bone_token", status: "implemented" },
  { id: "rusted_buckler", name: "Rusted Buckler", rarity: "common", tier: "elite", effectText: "Start each combat with 4 Block", triggerType: "start_of_combat", assetRef: "relics/rusted_buckler", status: "implemented" },
  { id: "quickened_loop", name: "Quickened Loop", rarity: "common", tier: "elite", effectText: "Draw 1 additional card on the first turn of each combat", triggerType: "start_of_combat", assetRef: "relics/quickened_loop", status: "implemented" },
  { id: "lucky_coin", name: "Lucky Coin", rarity: "common", tier: "elite", effectText: "+10 gold now; combat rewards give +5 extra gold", triggerType: "passive", assetRef: "relics/lucky_coin", status: "implemented" },
  { id: "flicker_charm", name: "Flicker Charm", rarity: "common", tier: "elite", effectText: "Your first Attack each combat deals +3 damage", triggerType: "triggered", assetRef: "relics/flicker_charm", status: "implemented" },
  { id: "pilgrims_map", name: "Pilgrim's Map", rarity: "common", tier: "elite", effectText: "+10 gold now; non-boss combat rewards give +3 extra gold", triggerType: "passive", assetRef: "relics/pilgrims_map", status: "implemented" },
  { id: "leather_thread", name: "Leather Thread", rarity: "common", tier: "elite", effectText: "Gain +1 max HP after every 3 combats won", triggerType: "passive", assetRef: "relics/leather_thread", status: "implemented" },
  { id: "ashen_idol", name: "Ashen Idol", rarity: "common", tier: "elite", effectText: "Gain +1 energy on turn 1 only", triggerType: "start_of_combat", assetRef: "relics/ashen_idol", status: "implemented" },
  { id: "iron_boots", name: "Iron Boots", rarity: "common", tier: "elite", effectText: "Start each combat with 1 Strength", triggerType: "start_of_combat", assetRef: "relics/iron_boots", status: "implemented" },
  { id: "nimble_cloak", name: "Nimble Cloak", rarity: "common", tier: "elite", effectText: "Start each combat with 1 Dexterity", triggerType: "start_of_combat", assetRef: "relics/nimble_cloak", status: "implemented" },

  { id: "worn_grimoire", name: "Worn Grimoire", rarity: "uncommon", tier: "elite", effectText: "The first time you apply Hex each combat, apply +1 additional Hex", triggerType: "triggered", assetRef: "relics/worn_grimoire", status: "implemented" },
  { id: "coal_pendant", name: "Coal Pendant", rarity: "uncommon", tier: "elite", effectText: "The first card you Exhaust each combat draws 1 card", triggerType: "triggered", assetRef: "relics/coal_pendant", status: "implemented" },
  { id: "hex_nail", name: "Hex Nail", rarity: "uncommon", tier: "elite", effectText: "Attack cards deal +2 damage to Hexed enemies", triggerType: "passive", assetRef: "relics/hex_nail", status: "implemented" },
  { id: "cinder_box", name: "Cinder Box", rarity: "uncommon", tier: "elite", effectText: "Whenever you Exhaust a card, gain 2 Block", triggerType: "triggered", assetRef: "relics/cinder_box", status: "implemented" },
  { id: "volt_shard", name: "Volt Shard", rarity: "uncommon", tier: "elite", effectText: "When you become Charged, gain 1 Block and draw 1", triggerType: "triggered", assetRef: "relics/volt_shard", status: "implemented" },
  { id: "merchant_ledger", name: "Merchant's Ledger", rarity: "uncommon", tier: "elite", effectText: "Card rewards after combat offer 1 extra choice", triggerType: "passive", assetRef: "relics/merchant_ledger", status: "implemented" },
  { id: "brass_lantern", name: "Brass Lantern", rarity: "uncommon", tier: "elite", effectText: "+1 energy per turn in Elite and Boss fights", triggerType: "passive", assetRef: "relics/brass_lantern", status: "implemented" },
  { id: "cracked_mirror", name: "Cracked Mirror", rarity: "uncommon", tier: "elite", effectText: "Your first Skill each combat is fully played a second time", triggerType: "triggered", assetRef: "relics/cracked_mirror", status: "implemented" },
  { id: "thorn_crest", name: "Thorn Crest", rarity: "uncommon", tier: "elite", effectText: "When you take HP damage, deal 3 damage back to the enemy", triggerType: "triggered", assetRef: "relics/thorn_crest", status: "implemented" },
  { id: "soot_vessel", name: "Soot Vessel", rarity: "uncommon", tier: "elite", effectText: "After winning a combat at 50% HP or less, heal 6", triggerType: "post_combat", assetRef: "relics/soot_vessel", status: "implemented" },
  { id: "duelists_thread", name: "Duelist's Thread", rarity: "uncommon", tier: "elite", effectText: "Your first Attack each turn deals +2 damage", triggerType: "triggered", assetRef: "relics/duelists_thread", status: "implemented" },
  { id: "grave_wick", name: "Grave Wick", rarity: "uncommon", tier: "elite", effectText: "Your first Exhaust card each combat costs 0", triggerType: "triggered", assetRef: "relics/grave_wick", status: "implemented" },
  { id: "cracked_lens", name: "Cracked Lens", rarity: "uncommon", tier: "elite", effectText: "Enemies start each combat with 1 Vulnerable", triggerType: "start_of_combat", assetRef: "relics/cracked_lens", status: "implemented" },
  { id: "silencing_stone", name: "Silencing Stone", rarity: "uncommon", tier: "elite", effectText: "While the enemy is Weak, your first card each turn costs 0", triggerType: "triggered", assetRef: "relics/silencing_stone", status: "implemented" },

  { id: "sigil_engine", name: "Sigil Engine", rarity: "rare", tier: "boss_or_rare", effectText: "When an enemy first reaches 3+ Hex in a combat, deal 8 damage to it", triggerType: "triggered", assetRef: "relics/sigil_engine", status: "implemented" },
  { id: "time_locked_seal", name: "Time-Locked Seal", rarity: "rare", tier: "boss_or_rare", effectText: "The first card you play each turn that costs 1 or less costs 0", triggerType: "triggered", assetRef: "relics/time_locked_seal", status: "implemented" },
  { id: "phoenix_ash", name: "Phoenix Ash", rarity: "rare", tier: "boss_or_rare", effectText: "Once per run, if you would die, survive at 1 HP instead", triggerType: "passive", assetRef: "relics/phoenix_ash", status: "implemented" },
  { id: "crown_of_cinders", name: "Crown of Cinders", rarity: "rare", tier: "boss_or_rare", effectText: "+1 energy per turn; lose 2 max HP when obtained", triggerType: "passive", assetRef: "relics/crown_of_cinders", status: "implemented" },
  { id: "black_prism", name: "Black Prism", rarity: "rare", tier: "boss_or_rare", effectText: "After 3 total Exhausts in a combat, gain 1 energy", triggerType: "triggered", assetRef: "relics/black_prism", status: "implemented" },
  { id: "storm_vessel", name: "Storm Vessel", rarity: "rare", tier: "boss_or_rare", effectText: "Becoming Charged on turn 2 or later gains +1 energy", triggerType: "triggered", assetRef: "relics/storm_vessel", status: "implemented" },
  { id: "empty_throne", name: "Empty Throne", rarity: "rare", tier: "boss_or_rare", effectText: "Draw 2 extra cards on turn 1; draw 1 fewer on turn 2", triggerType: "start_of_combat", assetRef: "relics/empty_throne", status: "implemented" },
  { id: "furnace_heart", name: "Furnace Heart", rarity: "rare", tier: "boss_or_rare", effectText: "Attack cards that Exhaust deal +4 damage", triggerType: "passive", assetRef: "relics/furnace_heart", status: "implemented" },
  { id: "hex_lantern", name: "Hex Lantern", rarity: "rare", tier: "boss_or_rare", effectText: "The first time you deal HP damage each combat, apply Hex 1", triggerType: "triggered", assetRef: "relics/hex_lantern", status: "implemented" },
  { id: "golden_brand", name: "Golden Brand", rarity: "rare", tier: "boss_or_rare", effectText: "+25 gold now; card rewards offer 1 extra choice", triggerType: "passive", assetRef: "relics/golden_brand", status: "implemented" },
  { id: "warlords_brand", name: "Warlord's Brand", rarity: "rare", tier: "boss_or_rare", effectText: "Whenever you gain Strength, gain 1 more", triggerType: "triggered", assetRef: "relics/warlords_brand", status: "implemented" },

  { id: "infernal_battery", name: "Infernal Battery", rarity: "boss", tier: "boss", effectText: "+1 energy per turn; draw 1 fewer card on turn 1", triggerType: "passive", assetRef: "relics/infernal_battery", status: "implemented" },
  { id: "blood_crucible", name: "Blood Crucible", rarity: "boss", tier: "boss", effectText: "Cards that cost HP double their energy and draw granted", triggerType: "passive", assetRef: "relics/blood_crucible", status: "implemented" },
  { id: "hex_crown", name: "Hex Crown", rarity: "boss", tier: "boss", effectText: "Enemies start each combat with Hex 1", triggerType: "start_of_combat", assetRef: "relics/hex_crown", status: "implemented" },
  { id: "crematorium_bell", name: "Crematorium Bell", rarity: "boss", tier: "boss", effectText: "The first 2 Exhausts each combat also grant +1 energy", triggerType: "triggered", assetRef: "relics/crematorium_bell", status: "implemented" },
  { id: "storm_diadem", name: "Storm Diadem", rarity: "boss", tier: "boss", effectText: "Start each combat already Charged", triggerType: "start_of_combat", assetRef: "relics/storm_diadem", status: "implemented" },
  { id: "vault_key", name: "Vault Key", rarity: "boss", tier: "boss", effectText: "Boss fights offer 2 relic choices instead of 1", triggerType: "passive", assetRef: "relics/vault_key", status: "implemented" }
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
