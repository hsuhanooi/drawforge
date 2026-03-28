const { CARD_REGISTRY } = require("./cardRegistry");

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
  wither: { damage: 3, hex: 1 },
  siphon_ward: { block: 4, bonusBlockIfHexed: 4 },
  detonate_sigil: { damage: 7, bonusVsHex: 10 },
  lingering_curse: { hex: 2, exhaust: true },
  mark_of_ruin: { hex: 1, draw: 1 },
  hexblade: { damage: 7, hex: 1 },
  reapers_clause: { damage: 10, costReduceIfHexed: 1 },
  fire_sale: { exhaustFromHand: true, draw: 2 },
  cremate: { exhaustFromHand: true, block: 6 },
  grave_fuel: { energyPerExhausted: true },
  brand_the_soul: { hex: 1, exhaustFromHand: true },
  harvester: { damage: 4, bonusVsHexedOrExhausted: 4 },
  charge_up: { setCharged: true, draw: 1 },
  arc_lash: { damage: 7, drawIfCharged: 1 },
  blood_pact: { selfDamage: 3, energyGain: 2, draw: 1 },
  spite_shield: { block: 6, hex: 1 }
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
