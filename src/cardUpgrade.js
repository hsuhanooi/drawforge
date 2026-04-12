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
  hexburst: "hexburst_plus",
  iron_will: "iron_will_plus",
  burning_aura: "burning_aura_plus",
  hex_resonance: "hex_resonance_plus",
  storm_call: "storm_call_plus",
  exhaust_engine: "exhaust_engine_plus",
  weak_field: "weak_field_plus",
  dark_pact: "dark_pact_plus",
  vampiric_aura: "vampiric_aura_plus",
  brace: "brace_plus",
  parry: "parry_plus",
  spite_shield: "spite_shield_plus",
  hollow_ward: "hollow_ward_plus",
  refrain: "refrain_plus",
  last_word: "last_word_plus",
  septic_touch: "septic_touch_plus",
  infectious_wound: "infectious_wound_plus",
  kindle: "kindle_plus",
  smoldering_brand: "smoldering_brand_plus",
  funeral_pyre: "funeral_pyre_plus",
  harvester: "harvester_plus",
  cripple: "cripple_plus",
  pressure_point: "pressure_point_plus",
  enervate: "enervate_plus",
  echo_strike: "echo_strike_plus",
  titan_strike: "titan_strike_plus",
  ashen_blow: "ashen_blow_plus",
  scorch_nerves: "scorch_nerves_plus",
  final_draft: "final_draft_plus",
  doom_engine: "doom_engine_plus",
  plan_ahead: "plan_ahead_plus",
  caustic_inferno: "caustic_inferno_plus",
  volatile_compound: "volatile_compound_plus",
  charged_toxin: "charged_toxin_plus",
  hex_blight: "hex_blight_plus",
  shocking_brand: "shocking_brand_plus",
  calculated_risk: "calculated_risk_plus",
  compress: "compress_plus",
  momentum_card: "momentum_card_plus",
  bulwark: "bulwark_plus",
  desperation: "desperation_plus"
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
  createUpgrade("strike", { name: "Strike+", cost: 1, type: "attack", rarity: "common", archetype: "Starter", effectText: "Dmg 7.", damage: 7 }),
  createUpgrade("defend", { name: "Defend+", cost: 1, type: "skill", rarity: "common", archetype: "Starter", effectText: "Block 7.", block: 7 }),
  createUpgrade("bash", { name: "Bash+", cost: 1, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 9.", damage: 9 }),
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
  createUpgrade("release", { name: "Release+", cost: 2, type: "attack", rarity: "uncommon", archetype: "Charged", effectText: "Dmg 8. If Charged, deal 18 instead and lose Charged.", damage: 8, bonusDmgIfCharged: 10, loseCharged: true }),
  createUpgrade("pommel", { name: "Pommel+", cost: 1, type: "attack", rarity: "common", archetype: "Neutral", effectText: "Dmg 9. Draw 1.", damage: 9, draw: 1 }),
  createUpgrade("insight", { name: "Insight+", cost: 1, type: "skill", rarity: "common", archetype: "Neutral", effectText: "Draw 3.", draw: 3 }),
  createUpgrade("heavy_swing", { name: "Heavy Swing+", cost: 2, type: "attack", rarity: "common", archetype: "Neutral", effectText: "Dmg 16.", damage: 16 }),
  createUpgrade("recover", { name: "Recover+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Neutral", effectText: "Block 8. Draw 1.", block: 8, draw: 1 }),
  createUpgrade("cataclysm_sigil", { name: "Cataclysm Sigil+", cost: 2, type: "attack", rarity: "rare", archetype: "Hex", effectText: "Dmg 20. +4 damage for each Hex on target.", damage: 20, bonusDmgPerHex: 4 }),
  createUpgrade("no_mercy", { name: "No Mercy+", cost: 2, type: "attack", rarity: "rare", archetype: "Hex", effectText: "Dmg 12. Repeat against Hexed enemies.", damage: 12, repeatIfHexed: true }),
  createUpgrade("hexburst", { name: "Hexburst+", cost: 2, type: "attack", rarity: "rare", archetype: "Hex Finisher", effectText: "Dmg 8. Consume all Hex on target. Deal 4 more for each Hex consumed.", damage: 8, consumeHexBonus: 4 }),
  createUpgrade("iron_will", { name: "Iron Will+", cost: 1, type: "power", rarity: "uncommon", archetype: "Power", effectText: "Gain 2 Dexterity at start of each turn.", dexPerTurn: 2 }),
  createUpgrade("burning_aura", { name: "Burning Aura+", cost: 1, type: "power", rarity: "uncommon", archetype: "Power", effectText: "Deal 5 damage to enemy at start of each turn.", auraDamage: 5 }),
  createUpgrade("hex_resonance", { name: "Hex Resonance+", cost: 0, type: "power", rarity: "uncommon", archetype: "Power", effectText: "Apply 2 Hex to enemy at start of each turn.", hexPerTurn: 2 }),
  createUpgrade("storm_call", { name: "Storm Call+", cost: 1, type: "power", rarity: "rare", archetype: "Power / Hex", effectText: "At start of each turn, deal 3 damage per Hex on enemy.", damagePerHex: 3 }),
  createUpgrade("exhaust_engine", { name: "Exhaust Engine+", cost: 1, type: "power", rarity: "rare", archetype: "Power / Exhaust", effectText: "At start of each turn, gain 1 Energy per exhausted card this combat (max 4).", maxExhaustEnergy: 4 }),
  createUpgrade("weak_field", { name: "Weak Field+", cost: 0, type: "power", rarity: "uncommon", archetype: "Power / Debuff", effectText: "At start of each turn, apply Weak 2 to the enemy.", weakPerTurn: 2 }),
  createUpgrade("dark_pact", { name: "Dark Pact+", cost: 0, type: "power", rarity: "uncommon", archetype: "Power / Risk", effectText: "At start of each turn, lose 1 HP and gain 1 Energy.", hpLossPerTurn: 1, energyPerTurn: 1 }),
  createUpgrade("vampiric_aura", { name: "Vampiric Aura+", cost: 1, type: "power", rarity: "rare", archetype: "Power / Lifesteal", effectText: "Whenever you deal attack damage, heal 3.", healOnAttack: 3 }),
  createUpgrade("brace", { name: "Brace+", cost: 1, type: "skill", rarity: "common", archetype: "Neutral", effectText: "Block 10.", block: 10 }),
  createUpgrade("parry", { name: "Parry+", cost: 0, type: "skill", rarity: "common", archetype: "Neutral", effectText: "Block 5.", block: 5 }),
  createUpgrade("spite_shield", { name: "Spite Shield+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Defense / Hex", effectText: "Block 8. If attacked this turn, apply Hex 2 to the attacker.", block: 8, hex: 2 }),
  createUpgrade("hollow_ward", { name: "Hollow Ward+", cost: 1, type: "skill", rarity: "common", archetype: "Defense / Exhaust", effectText: "Block 12. Exhaust.", block: 12, exhaust: true }),
  createUpgrade("refrain", { name: "Refrain+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Defense", effectText: "Block 6. Return this card to your hand next turn.", block: 6, returnToHand: true }),
  createUpgrade("last_word", { name: "Last Word+", cost: 1, type: "attack", rarity: "rare", archetype: "Risk", effectText: "Dmg 10. If this is the last card in your hand, deal 12 more.", damage: 10, bonusIfLastCard: 12 }),
  createUpgrade("septic_touch", { name: "Septic Touch+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Poison", effectText: "Apply Poison 3. Apply Weak 2.", applyPoison: 3, applyWeak: 2 }),
  createUpgrade("infectious_wound", { name: "Infectious Wound+", cost: 1, type: "attack", rarity: "uncommon", archetype: "Poison", effectText: "Dmg 6. Apply Poison 3. Draw 1.", damage: 6, applyPoison: 3, draw: 1 }),
  createUpgrade("kindle", { name: "Kindle+", cost: 1, type: "skill", rarity: "common", archetype: "Burn", effectText: "Apply Burn 5.", applyBurn: 5 }),
  createUpgrade("smoldering_brand", { name: "Smoldering Brand+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Burn", effectText: "Apply Burn 3. Apply Weak 2.", applyBurn: 3, applyWeak: 2 }),
  createUpgrade("funeral_pyre", { name: "Funeral Pyre+", cost: 2, type: "skill", rarity: "rare", archetype: "Burn", effectText: "Apply Burn 6. Exhaust.", applyBurn: 6, exhaust: true }),
  createUpgrade("harvester", { name: "Harvester+", cost: 1, type: "attack", rarity: "rare", archetype: "Hex / Exhaust", effectText: "Dmg 6. Repeat once if target is Hexed. Repeat once if a card was Exhausted this turn.", damage: 6, bonusVsHexedOrExhausted: 6 }),
  createUpgrade("cripple", { name: "Cripple+", cost: 0, type: "skill", rarity: "common", archetype: "Debuff", effectText: "Apply 2 Weak to enemy.", applyWeak: 2 }),
  createUpgrade("pressure_point", { name: "Pressure Point+", cost: 1, type: "attack", rarity: "common", archetype: "Debuff", effectText: "Dmg 6. Apply 2 Vulnerable.", damage: 6, applyVulnerable: 2 }),
  createUpgrade("enervate", { name: "Enervate+", cost: 1, type: "skill", rarity: "common", archetype: "Debuff", effectText: "Apply 3 Weak. Draw 1.", applyWeak: 3, draw: 1 }),
  createUpgrade("echo_strike", { name: "Echo Strike+", cost: 2, type: "attack", rarity: "common", archetype: "Debuff", effectText: "Dmg 9. +9 vs Vulnerable.", damage: 9, bonusVsVulnerable: 9 }),
  createUpgrade("titan_strike", { name: "Titan Strike+", cost: 2, type: "attack", rarity: "uncommon", archetype: "Strength", effectText: "Dmg 10. +3 per Strength.", damage: 10, bonusPerStrength: 3 }),
  createUpgrade("ashen_blow", { name: "Ashen Blow+", cost: 1, type: "attack", rarity: "uncommon", archetype: "Exhaust", effectText: "Dmg 10. If this card is Exhausted, gain 1 Energy.", damage: 10, energyIfExhaustedThisTurn: 1 }),
  createUpgrade("scorch_nerves", { name: "Scorch Nerves+", cost: 2, type: "attack", rarity: "common", archetype: "Exhaust", effectText: "Dmg 20. Exhaust.", damage: 20, exhaust: true }),
  createUpgrade("final_draft", { name: "Final Draft+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Exhaust", effectText: "Draw 3. Exhaust 1 random card from your hand.", draw: 3, exhaustFromHand: true }),
  createUpgrade("doom_engine", { name: "Doom Engine+", cost: 0, type: "skill", rarity: "rare", archetype: "Hex / Exhaust", effectText: "Whenever you Exhaust a card this turn, apply Hex 1 to a random enemy.", activateDoomEngine: true }),
  createUpgrade("plan_ahead", { name: "Plan Ahead+", cost: 0, type: "skill", rarity: "common", archetype: "Neutral", effectText: "Draw 3. Exhaust.", draw: 3, exhaust: true }),
  createUpgrade("caustic_inferno", { name: "Caustic Inferno+", cost: 1, type: "attack", rarity: "rare", archetype: "Poison / Burn", effectText: "Dmg 8. If enemy has both Poison and Burn, deal +12 damage.", damage: 8, bonusVsPoisonAndBurn: 12 }),
  createUpgrade("volatile_compound", { name: "Volatile Compound+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Poison / Burn", effectText: "Apply Poison 3 and Burn 3.", applyPoison: 3, applyBurn: 3 }),
  createUpgrade("charged_toxin", { name: "Charged Toxin+", cost: 1, type: "attack", rarity: "uncommon", archetype: "Poison / Charged", effectText: "Dmg 8. If Charged, apply Poison 4.", damage: 8, applyPoisonIfCharged: 4 }),
  createUpgrade("hex_blight", { name: "Hex Blight+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Hex / Poison", effectText: "Apply Hex 2 and Poison equal to resulting Hex stacks.", hex: 2, poisonPerHex: 1 }),
  createUpgrade("shocking_brand", { name: "Shocking Brand+", cost: 1, type: "attack", rarity: "uncommon", archetype: "Burn / Charged", effectText: "Dmg 7. Become Charged. Apply Burn 2.", damage: 7, setCharged: true, applyBurn: 2 }),
  createUpgrade("calculated_risk", { name: "Calculated Risk+", cost: 0, type: "skill", rarity: "uncommon", archetype: "Neutral", effectText: "Gain 3 Energy. Lose 3 HP. Exhaust.", energyGain: 3, selfDamage: 3, exhaust: true }),
  createUpgrade("compress", { name: "Compress+", cost: 1, type: "skill", rarity: "common", archetype: "Neutral", effectText: "Exhaust 2 cards from your hand. Draw 4.", exhaustFromHandCount: 2, draw: 4 }),
  createUpgrade("momentum_card", { name: "Momentum+", cost: 0, type: "skill", rarity: "common", archetype: "Neutral", effectText: "Draw 1. If you've played 2+ cards this turn, draw 2 instead.", draw: 1, bonusDrawIfCardsPlayedThisTurn: 1, cardsPlayedThreshold: 2 }),
  createUpgrade("bulwark", { name: "Bulwark+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Neutral", effectText: "Block 6. Gain 3 Block for each active Power.", block: 6, bonusBlockPerPower: 3 }),
  createUpgrade("desperation", { name: "Desperation+", cost: 1, type: "attack", rarity: "rare", archetype: "Neutral", effectText: "Dmg 7. Deal 16 instead if you are at 25 HP or below.", damage: 7, bonusDmgIfLowHp: 9, lowHpThreshold: 25 })
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
