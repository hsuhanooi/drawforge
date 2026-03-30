const { CARD_REGISTRY } = require("./cardRegistry");
const { UPGRADED_CARD_ENTRIES } = require("./cardUpgrade");

const implementedOverrides = {
  strike: { damage: 6 },
  defend: { block: 5 },
  bash: { damage: 8 },
  barrier: { block: 8 },
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
  reaping_strike: { damage: 5, bonusVsVulnerable: 12 },
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
  iron_will: {},
  burning_aura: {},
  hex_resonance: {},
  storm_call: {},
  exhaust_engine: {},
  weak_field: {},
  dark_pact: {},
  vampiric_aura: {},
  // Charged archetype
  static_guard: { block: 6, energyIfCharged: 1 },
  capacitor: { setCharged: true, exhaust: true },
  release: { damage: 14, costReduceIfCharged: 1, loseCharged: true },
  guarded_pulse: { block: 5, bonusBlockIfCharged: 5 },
  flashstep: { drawIfCharged: 2, setChargedIfNotCharged: true },
  // Exhaust archetype
  overclock: { energyGain: 2, discardFromHand: 1, exhaust: true },
  ashen_blow: { damage: 7, energyIfExhaustedThisTurn: 1 },
  final_draft: { draw: 2, exhaustFromHand: true },
  scorch_nerves: { damage: 15, exhaust: true },
  cinder_rush: { damage: 6, bonusDmgPerExhausted: 3 },
  empty_the_chamber: { exhaustHand: true, exhaust: true },
  // Hex archetype
  curse_spiral: { hex: 2, draw: 1 },
  cataclysm_sigil: { damage: 18, bonusDmgPerHex: 4 },
  no_mercy: { damage: 10, repeatIfHexed: true },
  hexburst: { damage: 6, consumeHexBonus: 4 },
  // Hex / Exhaust hybrids
  soul_rend: { damage: 9, ifHexedExhaustFromHand: true, ifHexedEnergyGain: 1 },
  doom_engine: { activateDoomEngine: true },
  unseal: { damage: 5, bonusVsHex: 5, exhaust: true },
  ritual_collapse: { exhaustFromHandCount: 2, hexPerExhausted: true },
  doom_bell: { hex: 3, exhaustSkillsFromHand: true },
  // Defense / utility
  hollow_ward: { block: 8, exhaust: true },
  refrain: { block: 4, returnToHand: true },
  warding_circle: { block: 12, costReduceIfHexed: 1 },
  last_word: { damage: 8, bonusIfLastCard: 8 },
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
      ...(implementedOverrides[card.id] || {})
    };
  }
  for (const card of legacyLiveCards) {
    if (!catalog[card.id]) {
      catalog[card.id] = {
        ...card,
        ...(implementedOverrides[card.id] || {})
      };
    }
  }
  for (const card of UPGRADED_CARD_ENTRIES) {
    catalog[card.id] = { ...card };
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
