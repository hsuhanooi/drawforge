const baseCatalog = {
  strike: { id: "strike", name: "Strike", cost: 1, type: "attack", rarity: "common", damage: 6 },
  defend: { id: "defend", name: "Defend", cost: 1, type: "skill", rarity: "common", block: 5 },
  bash: { id: "bash", name: "Bash", cost: 2, type: "attack", rarity: "common", damage: 8 },
  barrier: { id: "barrier", name: "Barrier", cost: 2, type: "skill", rarity: "common", block: 8 },
  quick_strike: { id: "quick_strike", name: "Quick Strike", cost: 0, type: "attack", rarity: "common", damage: 4 },
  focus: { id: "focus", name: "Focus", cost: 1, type: "skill", rarity: "common", energyGain: 1 },
  volley: { id: "volley", name: "Volley", cost: 1, type: "attack", rarity: "common", damage: 5, draw: 1 },
  surge: { id: "surge", name: "Surge", cost: 0, type: "skill", rarity: "uncommon", energyGain: 2, exhaust: true },
  hex: { id: "hex", name: "Hex", cost: 1, type: "skill", rarity: "uncommon", hex: 1, exhaust: true },
  punish: { id: "punish", name: "Punish", cost: 1, type: "attack", rarity: "uncommon", damage: 6, bonusVsHex: 4 },
  burnout: { id: "burnout", name: "Burnout", cost: 1, type: "attack", rarity: "uncommon", damage: 6, bonusVsExhaust: 6 },
  crackdown: { id: "crackdown", name: "Crackdown", cost: 2, type: "attack", rarity: "uncommon", damage: 8, bonusVsHex: 6 },
  momentum: { id: "momentum", name: "Momentum", cost: 1, type: "skill", rarity: "uncommon", block: 5, draw: 1, bonusBlockIfHighEnergy: 2 },
  wither: { id: "wither", name: "Wither", cost: 1, type: "skill", rarity: "uncommon", damage: 3, hex: 1 },
  siphon_ward: { id: "siphon_ward", name: "Siphon Ward", cost: 1, type: "skill", rarity: "uncommon", block: 4, bonusBlockIfHexed: 4 },
  detonate_sigil: { id: "detonate_sigil", name: "Detonate Sigil", cost: 2, type: "attack", rarity: "uncommon", damage: 7, bonusVsHex: 10 },
  lingering_curse: { id: "lingering_curse", name: "Lingering Curse", cost: 1, type: "skill", rarity: "uncommon", hex: 2, exhaust: true },
  mark_of_ruin: { id: "mark_of_ruin", name: "Mark of Ruin", cost: 1, type: "skill", rarity: "common", hex: 1, draw: 1 },
  hexblade: { id: "hexblade", name: "Hexblade", cost: 1, type: "attack", rarity: "common", damage: 7, hex: 1 },
  reapers_clause: { id: "reapers_clause", name: "Reaper's Clause", cost: 2, type: "attack", rarity: "uncommon", damage: 10, costReduceIfHexed: 1 },
  fire_sale: { id: "fire_sale", name: "Fire Sale", cost: 0, type: "skill", rarity: "common", exhaustFromHand: true, draw: 2 },
  cremate: { id: "cremate", name: "Cremate", cost: 1, type: "skill", rarity: "common", exhaustFromHand: true, block: 6 },
  grave_fuel: { id: "grave_fuel", name: "Grave Fuel", cost: 1, type: "skill", rarity: "rare", energyPerExhausted: true },
  brand_the_soul: { id: "brand_the_soul", name: "Brand the Soul", cost: 1, type: "skill", rarity: "uncommon", hex: 1, exhaustFromHand: true },
  harvester: { id: "harvester", name: "Harvester", cost: 1, type: "attack", rarity: "rare", damage: 4, bonusVsHexedOrExhausted: 4 },
  charge_up: { id: "charge_up", name: "Charge Up", cost: 1, type: "skill", rarity: "common", setCharged: true, draw: 1 },
  arc_lash: { id: "arc_lash", name: "Arc Lash", cost: 1, type: "attack", rarity: "common", damage: 7, drawIfCharged: 1 },
  blood_pact: { id: "blood_pact", name: "Blood Pact", cost: 0, type: "skill", rarity: "rare", selfDamage: 3, energyGain: 2, draw: 1 },
  spite_shield: { id: "spite_shield", name: "Spite Shield", cost: 1, type: "skill", rarity: "uncommon", block: 6, hex: 1 }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const createCardCatalog = () => clone(baseCatalog);

const toRenderableCard = (cardOrId) => {
  const cardId = typeof cardOrId === "string" ? cardOrId : cardOrId && cardOrId.id;
  const catalogCard = baseCatalog[cardId];
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
