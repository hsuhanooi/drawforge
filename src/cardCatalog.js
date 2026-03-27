const {
  strikeCardDefinition,
  defendCardDefinition,
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition,
  surgeCardDefinition,
  hexCardDefinition,
  punishCardDefinition,
  burnoutCardDefinition,
  crackdownCardDefinition,
  momentumCardDefinition,
  witherCardDefinition,
  siphonWardCardDefinition,
  detonateSigilCardDefinition,
  lingeringCurseCardDefinition,
  markOfRuinCardDefinition,
  hexbladeCardDefinition,
  reaperSClauseCardDefinition,
  fireSaleCardDefinition,
  cremateCardDefinition,
  graveFuelCardDefinition,
  brandTheSoulCardDefinition,
  harvesterCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition,
  bloodPactCardDefinition,
  spiteShieldCardDefinition
} = require("./cards");

const catalogFactories = {
  strike: strikeCardDefinition,
  defend: defendCardDefinition,
  bash: bashCardDefinition,
  barrier: barrierCardDefinition,
  quick_strike: quickStrikeCardDefinition,
  focus: focusCardDefinition,
  volley: volleyCardDefinition,
  surge: surgeCardDefinition,
  hex: hexCardDefinition,
  punish: punishCardDefinition,
  burnout: burnoutCardDefinition,
  crackdown: crackdownCardDefinition,
  momentum: momentumCardDefinition,
  wither: witherCardDefinition,
  siphon_ward: siphonWardCardDefinition,
  detonate_sigil: detonateSigilCardDefinition,
  lingering_curse: lingeringCurseCardDefinition,
  mark_of_ruin: markOfRuinCardDefinition,
  hexblade: hexbladeCardDefinition,
  reapers_clause: reaperSClauseCardDefinition,
  fire_sale: fireSaleCardDefinition,
  cremate: cremateCardDefinition,
  grave_fuel: graveFuelCardDefinition,
  brand_the_soul: brandTheSoulCardDefinition,
  harvester: harvesterCardDefinition,
  charge_up: chargeUpCardDefinition,
  arc_lash: arcLashCardDefinition,
  blood_pact: bloodPactCardDefinition,
  spite_shield: spiteShieldCardDefinition
};

const stripEffect = (card) => {
  const rest = { ...card };
  delete rest.effect;
  return rest;
};

const createCardCatalog = () => {
  const entries = {};
  Object.entries(catalogFactories).forEach(([cardId, factory]) => {
    entries[cardId] = stripEffect(factory());
  });
  return entries;
};

module.exports = {
  createCardCatalog
};
