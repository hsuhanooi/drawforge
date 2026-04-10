// @ts-check

/**
 * Map from base card ID → upgraded card ID.
 * Only cards listed here can be upgraded at a campfire Smith.
 */
const UPGRADE_ID_MAP = {
  strike: "strike_plus",
  defend: "defend_plus",
  bash: "bash_plus",
  barrier: "barrier_plus",
  quick_strike: "quick_strike_plus",
  hex: "hex_plus",
  surge: "surge_plus",
  war_cry: "war_cry_plus",
  fortify: "fortify_plus",
  expose: "expose_plus",
  enfeeble: "enfeeble_plus",
  mark_of_ruin: "mark_of_ruin_plus",
  deep_hex: "deep_hex_plus",
  hexblade: "hexblade_plus",
  reapers_clause: "reapers_clause_plus",
  feast_on_weakness: "feast_on_weakness_plus",
  detonate_sigil: "detonate_sigil_plus",
  black_seal: "black_seal_plus",
  overclock: "overclock_plus",
  fire_sale: "fire_sale_plus",
  cremate: "cremate_plus",
  grave_fuel: "grave_fuel_plus",
  cinder_rush: "cinder_rush_plus",
  ritual_collapse: "ritual_collapse_plus",
  venom_strike: "venom_strike_plus",
  toxic_cloud: "toxic_cloud_plus",
  creeping_blight: "creeping_blight_plus",
  ember_throw: "ember_throw_plus",
  scorch: "scorch_plus",
  charge_up: "charge_up_plus",
  static_guard: "static_guard_plus",
  arc_lash: "arc_lash_plus",
  capacitor: "capacitor_plus",
  release: "release_plus",
  pommel: "pommel_plus",
  insight: "insight_plus",
  heavy_swing: "heavy_swing_plus",
  recover: "recover_plus",
  cataclysm_sigil: "cataclysm_sigil_plus",
  no_mercy: "no_mercy_plus",
  hexburst: "hexburst_plus"
};

const createUpgrade = (baseId, patch) => ({
  ...patch,
  id: `${baseId}_plus`,
  upgrade: true,
  status: "implemented"
});

/**
 * Catalog entries for all upgraded card variants.
 * These are merged into cardCatalog but do not appear in the reward pool.
 */
const UPGRADED_CARD_ENTRIES = [
  createUpgrade("strike", { name: "Strike+", cost: 1, type: "attack", rarity: "common", archetype: "Starter", effectText: "Dmg 9.", damage: 9 }),
  createUpgrade("defend", { name: "Defend+", cost: 1, type: "skill", rarity: "common", archetype: "Starter", effectText: "Block 8.", block: 8 }),
  createUpgrade("bash", { name: "Bash+", cost: 1, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 10.", damage: 10 }),
  createUpgrade("barrier", { name: "Barrier+", cost: 2, type: "skill", rarity: "common", archetype: "Legacy", effectText: "Block 12.", block: 12 }),
  createUpgrade("quick_strike", { name: "Quick Strike+", cost: 0, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 6.", damage: 6 }),
  createUpgrade("hex", { name: "Hex+", cost: 0, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Apply Hex 1. Exhaust.", hex: 1, exhaust: true }),
  createUpgrade("surge", { name: "Surge+", cost: 0, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Gain 2 Energy. Exhaust.", energyGain: 2, exhaust: true }),
  createUpgrade("war_cry", { name: "War Cry+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Strength", effectText: "Gain 3 Strength.", applyStrength: 3 }),
  createUpgrade("fortify", { name: "Fortify+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Dexterity", effectText: "Gain 3 Dexterity.", applyDexterity: 3 }),
  createUpgrade("expose", { name: "Expose+", cost: 0, type: "skill", rarity: "common", archetype: "Debuff", effectText: "Apply 2 Vulnerable.", applyVulnerable: 2 }),
  createUpgrade("enfeeble", { name: "Enfeeble+", cost: 2, type: "skill", rarity: "uncommon", archetype: "Debuff", effectText: "Apply 4 Weak + 2 Vulnerable.", applyWeak: 4, applyVulnerable: 2 }),
  createUpgrade("mark_of_ruin", { name: "Mark of Ruin+", cost: 1, type: "skill", rarity: "common", archetype: "Hex", effectText: "Apply Hex 2. Draw 1.", hex: 2, draw: 1 }),
  createUpgrade("deep_hex", { name: "Deep Hex+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Hex", effectText: "Apply Hex 5.", hex: 5 }),
  createUpgrade("hexblade", { name: "Hexblade+", cost: 1, type: "attack", rarity: "common", archetype: "Hex", effectText: "Dmg 9. Apply Hex 1.", damage: 9, hex: 1 }),
  createUpgrade("reapers_clause", { name: "Reaper's Clause+", cost: 2, type: "attack", rarity: "uncommon", archetype: "Hex", effectText: "Dmg 11. Costs 1 less if target is Hexed.", damage: 11, costReduceIfHexed: 1 }),
  createUpgrade("feast_on_weakness", { name: "Feast on Weakness+", cost: 1, type: "attack", rarity: "common", archetype: "Hex", effectText: "Dmg 8. Gain 6 Block if target is Hexed.", damage: 8, bonusBlockIfHexed: 6 }),
  createUpgrade("detonate_sigil", { name: "Detonate Sigil+", cost: 2, type: "attack", rarity: "uncommon", archetype: "Legacy", effectText: "Dmg 10. +12 vs Hex.", damage: 10, bonusVsHex: 12 }),
  createUpgrade("black_seal", { name: "Black Seal+", cost: 0, type: "skill", rarity: "common", archetype: "Hex", effectText: "Apply Hex 2. Exhaust.", hex: 2, exhaust: true }),
  createUpgrade("overclock", { name: "Overclock+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Exhaust", effectText: "Gain 3 Energy. Discard 1 card. Exhaust.", energyGain: 3, discardFromHand: 1, exhaust: true }),
  createUpgrade("fire_sale", { name: "Fire Sale+", cost: 0, type: "skill", rarity: "common", archetype: "Exhaust", effectText: "Exhaust a card in your hand. Draw 3.", exhaustFromHand: true, draw: 3 }),
  createUpgrade("cremate", { name: "Cremate+", cost: 1, type: "skill", rarity: "common", archetype: "Exhaust", effectText: "Exhaust a card in your hand. Gain 9 Block.", exhaustFromHand: true, block: 9 }),
  createUpgrade("grave_fuel", { name: "Grave Fuel+", cost: 0, type: "skill", rarity: "rare", archetype: "Exhaust", effectText: "Gain 1 Energy for each card exhausted this turn. Draw 1.", energyPerExhausted: true, draw: 1 }),
  createUpgrade("cinder_rush", { name: "Cinder Rush+", cost: 1, type: "attack", rarity: "uncommon", archetype: "Exhaust", effectText: "Dmg 8. +4 damage for each card exhausted this turn.", damage: 8, bonusDmgPerExhausted: 4 }),
  createUpgrade("ritual_collapse", { name: "Ritual Collapse+", cost: 0, type: "skill", rarity: "rare", archetype: "Hex / Exhaust", effectText: "Exhaust up to 3 cards in your hand. Apply Hex 1 for each.", exhaustFromHandCount: 3, hexPerExhausted: true }),
  createUpgrade("venom_strike", { name: "Venom Strike+", cost: 1, type: "attack", rarity: "common", archetype: "Poison", effectText: "Dmg 7. Apply Poison 3.", damage: 7, applyPoison: 3 }),
  createUpgrade("toxic_cloud", { name: "Toxic Cloud+", cost: 1, type: "skill", rarity: "common", archetype: "Poison", effectText: "Apply Poison 5.", applyPoison: 5 }),
  createUpgrade("creeping_blight", { name: "Creeping Blight+", cost: 1, type: "attack", rarity: "uncommon", archetype: "Poison", effectText: "Dmg 9. Apply Poison 4.", damage: 9, applyPoison: 4 }),
  createUpgrade("ember_throw", { name: "Ember Throw+", cost: 1, type: "attack", rarity: "common", archetype: "Burn", effectText: "Dmg 7. Apply Burn 3.", damage: 7, applyBurn: 3 }),
  createUpgrade("scorch", { name: "Scorch+", cost: 2, type: "attack", rarity: "uncommon", archetype: "Burn", effectText: "Dmg 11. Apply Burn 3.", damage: 11, applyBurn: 3 }),
  createUpgrade("charge_up", { name: "Charge Up+", cost: 1, type: "skill", rarity: "common", archetype: "Charged", effectText: "Become Charged. Draw 2.", setCharged: true, draw: 2 }),
  createUpgrade("static_guard", { name: "Static Guard+", cost: 1, type: "skill", rarity: "common", archetype: "Charged", effectText: "Block 8. If Charged, gain 2 Energy.", block: 8, energyIfCharged: 2 }),
  createUpgrade("arc_lash", { name: "Arc Lash+", cost: 1, type: "attack", rarity: "common", archetype: "Charged", effectText: "Dmg 9. If Charged, draw 2.", damage: 9, drawIfCharged: 2 }),
  createUpgrade("capacitor", { name: "Capacitor+", cost: 0, type: "skill", rarity: "common", archetype: "Charged", effectText: "Become Charged. Draw 1. Exhaust.", setCharged: true, draw: 1, exhaust: true }),
  createUpgrade("release", { name: "Release+", cost: 2, type: "attack", rarity: "uncommon", archetype: "Charged", effectText: "Dmg 18. If Charged, costs 2 less and lose Charged.", damage: 18, costReduceIfCharged: 2, loseCharged: true }),
  createUpgrade("pommel", { name: "Pommel+", cost: 1, type: "attack", rarity: "common", archetype: "Neutral", effectText: "Dmg 9. Draw 1.", damage: 9, draw: 1 }),
  createUpgrade("insight", { name: "Insight+", cost: 1, type: "skill", rarity: "common", archetype: "Neutral", effectText: "Draw 3.", draw: 3 }),
  createUpgrade("heavy_swing", { name: "Heavy Swing+", cost: 2, type: "attack", rarity: "common", archetype: "Neutral", effectText: "Dmg 16.", damage: 16 }),
  createUpgrade("recover", { name: "Recover+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Neutral", effectText: "Block 8. Draw 1.", block: 8, draw: 1 }),
  createUpgrade("cataclysm_sigil", { name: "Cataclysm Sigil+", cost: 2, type: "attack", rarity: "rare", archetype: "Hex", effectText: "Dmg 20. +5 damage for each Hex on target.", damage: 20, bonusDmgPerHex: 5 }),
  createUpgrade("no_mercy", { name: "No Mercy+", cost: 2, type: "attack", rarity: "rare", archetype: "Hex", effectText: "Dmg 12. Repeat against Hexed enemies.", damage: 12, repeatIfHexed: true }),
  createUpgrade("hexburst", { name: "Hexburst+", cost: 2, type: "attack", rarity: "rare", archetype: "Hex Finisher", effectText: "Dmg 8. Consume all Hex on target. Deal 5 more for each Hex consumed.", damage: 8, consumeHexBonus: 5 })
];

/**
 * Returns the upgraded card ID for a given base card ID, or null if not upgradeable.
 * @param {string} cardId
 * @returns {string | null}
 */
const getUpgradedId = (cardId) => UPGRADE_ID_MAP[cardId] || null;

/**
 * Returns true if the given card ID has a known upgrade.
 * @param {string} cardId
 * @returns {boolean}
 */
const canUpgrade = (cardId) => cardId in UPGRADE_ID_MAP;

/**
 * Returns a new deck array with the card at deckIndex replaced by its upgraded version.
 * Throws if the card cannot be upgraded.
 * @param {string[]} deck
 * @param {number} deckIndex
 * @returns {string[]}
 */
const upgradeCardInDeck = (deck, deckIndex) => {
  const cardId = deck[deckIndex];
  if (cardId === undefined) throw new Error("Card not found in deck");
  const upgradedId = getUpgradedId(cardId);
  if (!upgradedId) throw new Error(`Card "${cardId}" cannot be upgraded`);
  return [...deck.slice(0, deckIndex), upgradedId, ...deck.slice(deckIndex + 1)];
};

module.exports = {
  UPGRADE_ID_MAP,
  UPGRADED_CARD_ENTRIES,
  getUpgradedId,
  canUpgrade,
  upgradeCardInDeck
};
