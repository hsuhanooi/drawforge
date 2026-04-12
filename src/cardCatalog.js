const { CARD_REGISTRY } = require("./cardRegistry");
const { UPGRADED_CARD_ENTRIES } = require("./cardUpgrade");
const { makeAssetRef, buildPresentationAssets } = require("./assets");

const implementedOverrides = {
  strike: { damage: 5 },
  defend: { block: 5 },
  bash: { damage: 7 },
  barrier: { block: 10 },
  quick_strike: { damage: 4 },
  focus: { energyGain: 1 },
  volley: { damage: 5, draw: 1 },
  surge: { energyGain: 2, exhaust: true },
  hex: { hex: 1, exhaust: true },
  punish: { damage: 6, bonusVsHex: 4 },
  burnout: { damage: 6, bonusVsExhaust: 6 },
  crackdown: { damage: 8, bonusVsHex: 6 },
  momentum: { block: 5, draw: 1, bonusBlockIfHighEnergy: 2 },
  wither: { damage: 4, hex: 1 },
  siphon_ward: { block: 4, bonusBlockIfHexed: 4 },
  detonate_sigil: { damage: 7, bonusVsHex: 10 },
  lingering_curse: { hex: 2, exhaust: true },
  mark_of_ruin: { hex: 1, draw: 1 },
  hexblade: { damage: 7, hex: 1 },
  reapers_clause: { damage: 8, costReduceIfHexed: 1 },
  fire_sale: { exhaustFromHand: true, draw: 2 },
  cremate: { exhaustFromHand: true, block: 6 },
  grave_fuel: { energyPerExhausted: true },
  brand_the_soul: { hex: 1, exhaustFromHand: true },
  harvester: { damage: 4, bonusVsHexedOrExhausted: 4 },
  charge_up: { setCharged: true, draw: 1 },
  arc_lash: { damage: 7, drawIfCharged: 1 },
  blood_pact: { selfDamage: 5, energyGain: 2, draw: 1 },
  spite_shield: { block: 6, hex: 1 },
  war_cry: { applyStrength: 2 },
  fortify: { applyDexterity: 2 },
  expose: { applyVulnerable: 2 },
  cripple: { applyWeak: 2 },
  titan_strike: { damage: 8, bonusPerStrength: 2 },
  exploit: { damage: 6, bonusVsVulnerable: 9 },
  enfeeble: { applyWeak: 3, applyVulnerable: 1 },
  echo_strike: { damage: 7, bonusVsVulnerable: 7 },
  pressure_point: { damage: 4, applyVulnerable: 1 },
  enervate: { applyWeak: 2, draw: 1 },
  expose_weakness: { applyVulnerable: 3, applyWeak: 2 },
  chain_cripple: { applyWeak: 1, exhaust: true },
  mark_for_death: { applyVulnerable: 4, exhaust: true },
  reaping_strike: { damage: 5, bonusVsVulnerable: 8 },
  // Neutral utility
  pommel: { damage: 7, draw: 1 },
  brace: { block: 7 },
  insight: { draw: 2 },
  parry: { block: 3 },
  heavy_swing: { damage: 12 },
  recover: { block: 6, draw: 1 },
  plan_ahead: { draw: 2, exhaust: true },
  // Hex archetype
  deep_hex: { hex: 4 },
  black_seal: { hex: 1, exhaust: true },
  feast_on_weakness: { damage: 5, bonusBlockIfHexed: 5 },
  malediction: { applyWeak: 2, hex: 1 },
  // Powers
  iron_will: { dexPerTurn: 1 },
  burning_aura: { auraDamage: 3 },
  hex_resonance: { hexPerTurn: 1 },
  storm_call: { damagePerHex: 2 },
  exhaust_engine: { maxExhaustEnergy: 3 },
  weak_field: { weakPerTurn: 1 },
  dark_pact: { hpLossPerTurn: 2, energyPerTurn: 1 },
  vampiric_aura: { healOnAttack: 2 },
  // Charged archetype
  static_guard: { block: 6, energyIfCharged: 1 },
  capacitor: { setCharged: true, exhaust: true },
  release: { damage: 8, bonusDmgIfCharged: 6, loseCharged: true },
  guarded_pulse: { block: 5, bonusBlockIfCharged: 5 },
  flashstep: { drawIfCharged: 2, setChargedIfNotCharged: true },
  volt_barrage: { damage: 3, hitCount: 3, hitCountIfCharged: 5 },
  charged_field: { drawPerTurn: 1 },
  // Exhaust archetype
  overclock: { energyGain: 2, discardFromHand: 1, exhaust: true },
  ashen_blow: { damage: 7, energyIfExhaustedThisTurn: 1 },
  final_draft: { draw: 2, exhaustFromHand: true },
  scorch_nerves: { damage: 15, exhaust: true },
  cinder_rush: { damage: 6, bonusDmgPerExhausted: 3 },
  empty_the_chamber: { exhaustHand: true, exhaust: true },
  // Hex archetype
  curse_spiral: { hex: 2, draw: 1 },
  cataclysm_sigil: { damage: 18, bonusDmgPerHex: 3 },
  no_mercy: { damage: 10, repeatIfHexed: true },
  hexburst: { damage: 6, consumeHexBonus: 3 },
  // Hex / Exhaust hybrids
  soul_rend: { damage: 9, ifHexedExhaustFromHand: true, ifHexedEnergyGain: 1 },
  venom_strike: { damage: 5, applyPoison: 2 },
  toxic_cloud: { applyPoison: 3 },
  creeping_blight: { damage: 7, applyPoison: 3 },
  septic_touch: { applyPoison: 2, applyWeak: 1 },
  infectious_wound: { damage: 4, applyPoison: 2, draw: 1 },
  plague_burst: { damage: 5, consumePoisonBonus: 3 },
  toxic_barrage: { damage: 3, hitCount: 3, applyPoisonPerHit: 1 },
  virulent_aura: { poisonPerTurn: 1 },
  contagion: { doublePoison: true },
  fetid_wound: { damage: 4, applyPoison: 2, block: 3 },
  noxious_presence: { poisonOnAttack: 1 },
  ember_throw: { damage: 5, applyBurn: 2 },
  kindle: { applyBurn: 3 },
  scorch: { damage: 8, applyBurn: 2 },
  funeral_pyre: { applyBurn: 4, exhaust: true },
  smoldering_brand: { applyBurn: 2, applyWeak: 1 },
  immolate: { damage: 6, consumeBurnBonus: 3 },
  backdraft: { damage: 4, bonusDmgPerBurn: 2 },
  inferno_aura: { burnPerTurn: 1 },
  heat_shield: { block: 4, blockPerBurn: 2 },
  flash_fire: { applyBurn: 2, draw: 1, exhaust: true },
  doom_engine: { activateDoomEngine: true },
  unseal: { damage: 5, bonusVsHex: 5, exhaust: true },
  ritual_collapse: { exhaustFromHandCount: 2, hexPerExhausted: true },
  doom_bell: { hex: 3, exhaustSkillsFromHand: true },
  // Defense / utility
  hollow_ward: { block: 8, exhaust: true },
  refrain: { block: 4, returnToHand: true },
  warding_circle: { block: 12, costReduceIfHexed: 1 },
  last_word: { damage: 8, bonusIfLastCard: 8 },
  flurry_of_blows: { damage: 3, hitCount: 4 },
  // AoE cards
  whirlwind: { damage: 5, targetAll: true },
  chain_lightning: { damage: 4, targetAll: true, bonusDmgIfCharged: 3 },
  plague_wave: { applyPoison: 2, targetAll: true },
  // Cross-archetype synergy
  caustic_inferno: { damage: 8, bonusVsPoisonAndBurn: 10 },
  volatile_compound: { applyPoison: 2, applyBurn: 2 },
  charged_toxin: { damage: 6, applyPoisonIfCharged: 3 },
  hex_blight: { hex: 1, poisonPerHex: 1 },
  shocking_brand: { damage: 5, setCharged: true, applyBurn: 2 },
  // Colorless utility cards
  calculated_risk: { energyGain: 2, selfDamage: 4, exhaust: true },
  compress: { exhaustFromHandCount: 2, draw: 3 },
  momentum_card: { draw: 1, bonusDrawIfCardsPlayedThisTurn: 1, cardsPlayedThreshold: 3 },
  bulwark: { block: 4, bonusBlockPerPower: 2 },
  desperation: { damage: 5, bonusDmgIfLowHp: 7, lowHpThreshold: 25 },
  // Curses
  wound: { curseOnDraw: 1 },
  decay: { curseDecayBlock: true },
  parasite: { selfDamage: 3, exhaust: true }
};

const legacyLiveCards = [
  { id: "bash", name: "Bash", cost: 2, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 8.", status: "implemented", legacy: true },
  { id: "barrier", name: "Barrier", cost: 2, type: "skill", rarity: "common", archetype: "Legacy", effectText: "Block 8.", status: "implemented", legacy: true },
  { id: "quick_strike", name: "Quick Strike", cost: 0, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 4.", status: "implemented", legacy: true },
  { id: "focus", name: "Focus", cost: 1, type: "skill", rarity: "common", archetype: "Legacy", effectText: "Gain 1 Energy.", status: "implemented", legacy: true },
  { id: "volley", name: "Volley", cost: 1, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 5. Draw 1.", status: "implemented", legacy: true },
  { id: "surge", name: "Surge", cost: 0, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Gain 2 Energy. Exhaust.", status: "implemented", legacy: true },
  { id: "hex", name: "Hex", cost: 1, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Apply Hex 1. Exhaust.", status: "implemented", legacy: true },
  { id: "punish", name: "Punish", cost: 1, type: "attack", rarity: "uncommon", archetype: "Legacy", effectText: "Dmg 6. +4 vs Hex.", status: "implemented", legacy: true },
  { id: "burnout", name: "Burnout", cost: 1, type: "attack", rarity: "uncommon", archetype: "Legacy", effectText: "Dmg 6. +6 vs Exhaust.", status: "implemented", legacy: true },
  { id: "crackdown", name: "Crackdown", cost: 2, type: "attack", rarity: "uncommon", archetype: "Legacy", effectText: "Dmg 8. +6 vs Hex.", status: "implemented", legacy: true },
  { id: "momentum", name: "Momentum", cost: 1, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Block 5. Draw 1. +2 block if 2+ energy.", status: "implemented", legacy: true },
  { id: "wither", name: "Wither", cost: 1, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Dmg 3. Apply Hex 1.", status: "implemented", legacy: true },
  { id: "siphon_ward", name: "Siphon Ward", cost: 1, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Block 4. Gain 4 more if target is Hexed.", status: "implemented", legacy: true },
  { id: "detonate_sigil", name: "Detonate Sigil", cost: 2, type: "attack", rarity: "uncommon", archetype: "Legacy", effectText: "Dmg 7. +10 vs Hex.", status: "implemented", legacy: true },
  { id: "lingering_curse", name: "Lingering Curse", cost: 1, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Apply Hex 2. Exhaust.", status: "implemented", legacy: true }
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const deriveKeywords = (card) => {
  if (Array.isArray(card.keywords) && card.keywords.length > 0) {
    return card.keywords.map((keyword) => typeof keyword === "string"
      ? { key: keyword, label: keyword }
      : { key: keyword.key, label: keyword.label || keyword.key });
  }

  const keys = [];
  if (card.hex || card.bonusVsHex || card.costReduceIfHexed || card.ifHexedExhaustFromHand || card.ifHexedEnergyGain || card.consumeHexBonus) keys.push("Hex");
  if (card.poison || card.applyPoison || card.applyPoisonPerHit || card.applyPoisonIfCharged || card.poisonPerHex || card.consumePoisonBonus || card.doublePoison || card.bonusVsPoisonAndBurn) keys.push("Poison");
  if (card.burn || card.applyBurn || card.bonusVsPoisonAndBurn) keys.push("Burn");
  if (card.setCharged || card.drawIfCharged || card.energyIfCharged || card.costReduceIfCharged || card.bonusBlockIfCharged || card.applyPoisonIfCharged) keys.push("Charged");
  if (card.poisonPerHex) keys.push("Hex");
  if (card.exhaust || card.exhaustFromHand || card.exhaustHand || card.exhaustSkillsFromHand || card.exhaustFromHandCount || card.energyPerExhausted || card.bonusVsExhaust || card.bonusDmgPerExhausted) keys.push("Exhaust");
  if (card.draw || card.drawIfCharged) keys.push("Draw");
  if (card.energyGain || card.energyPerExhausted || card.energyIfCharged || card.ifHexedEnergyGain) keys.push("Energy");
  if (card.consumeHexBonus || card.consumePoisonBonus || card.consumeBurnBonus) keys.push("Consume");
  if (card.targetAll) keys.push("AoE");
  return [...new Set(keys)].map((key) => ({ key, label: key }));
};

const buildCatalog = () => {
  const catalog = {};
  for (const card of CARD_REGISTRY) {
    catalog[card.id] = {
      id: card.id,
      name: card.name,
      cost: card.cost,
      type: card.type,
      rarity: card.rarity,
      archetype: card.archetype,
      effectText: card.effectText,
      status: card.status,
      starter: !!card.starter,
      frameVariant: `${card.type || "skill"}_${card.rarity || "common"}`,
      artAssetRef: makeAssetRef("card", card.id),
      iconAssetRef: makeAssetRef("icon", card.type || card.id),
      ...(implementedOverrides[card.id] || {})
    };
    catalog[card.id].keywords = deriveKeywords(catalog[card.id]);
    catalog[card.id].presentation = buildPresentationAssets({
      cardId: card.id,
      iconId: card.type || card.id,
      vfxId: card.type || card.id
    });
  }
  for (const card of legacyLiveCards) {
    if (!catalog[card.id]) {
      catalog[card.id] = {
        ...card,
        frameVariant: `${card.type || "skill"}_${card.rarity || "common"}`,
        artAssetRef: makeAssetRef("card", card.id),
        iconAssetRef: makeAssetRef("icon", card.type || card.id),
        ...(implementedOverrides[card.id] || {})
      };
      catalog[card.id].keywords = deriveKeywords(catalog[card.id]);
      catalog[card.id].presentation = buildPresentationAssets({
        cardId: card.id,
        iconId: card.type || card.id,
        vfxId: card.type || card.id
      });
    }
  }
  for (const card of UPGRADED_CARD_ENTRIES) {
    catalog[card.id] = {
      ...card,
      frameVariant: card.frameVariant || `${card.type || "skill"}_${card.rarity || "common"}`,
      artAssetRef: card.artAssetRef || makeAssetRef("card", card.id),
      iconAssetRef: card.iconAssetRef || makeAssetRef("icon", card.type || card.id)
    };
    catalog[card.id].keywords = deriveKeywords(catalog[card.id]);
    catalog[card.id].presentation = buildPresentationAssets({
      cardId: card.id,
      iconId: card.type || card.id,
      vfxId: card.type || card.id
    });
  }
  return catalog;
};

const createCardCatalog = () => clone(buildCatalog());

const toRenderableCard = (cardOrId) => {
  const cardId = typeof cardOrId === "string" ? cardOrId : cardOrId && cardOrId.id;
  const catalog = buildCatalog();
  const catalogCard = catalog[cardId];
  if (!catalogCard) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return clone(catalogCard);
};

const toRenderableCards = (cards) => cards.map((card) => toRenderableCard(card));

module.exports = {
  createCardCatalog,
  toRenderableCard,
  toRenderableCards
};
