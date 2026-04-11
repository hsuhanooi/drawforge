// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardFactory} CardFactory */
/** @typedef {import("./domain").CardId} CardId */
/** @typedef {import("./domain").RunState} RunState */
/** @typedef {import("./domain").CombatState} CombatState */

const { createCombatEncounter } = require("./combat");
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
  spiteShieldCardDefinition,
  warCryCardDefinition,
  fortifyCardDefinition,
  exposeCardDefinition,
  crippleCardDefinition,
  titanStrikeCardDefinition,
  exploitCardDefinition,
  enfeebleCardDefinition,
  echoStrikeCardDefinition,
  pommelCardDefinition,
  braceCardDefinition,
  insightCardDefinition,
  parryCardDefinition,
  heavySwingCardDefinition,
  recoverCardDefinition,
  planAheadCardDefinition,
  deepHexCardDefinition,
  blackSealCardDefinition,
  feastOnWeaknessCardDefinition,
  maledictionCardDefinition,
  ironWillCardDefinition,
  burningAuraCardDefinition,
  hexResonanceCardDefinition,
  staticGuardCardDefinition,
  capacitorCardDefinition,
  releaseCardDefinition,
  guardedPulseCardDefinition,
  flashstepCardDefinition,
  overclockCardDefinition,
  ashenBlowCardDefinition,
  finalDraftCardDefinition,
  scorchNervesCardDefinition,
  cinderRushCardDefinition,
  emptyTheChamberCardDefinition,
  curseSpiralCardDefinition,
  cataclysmSigilCardDefinition,
  noMercyCardDefinition,
  hexburstCardDefinition,
  soulRendCardDefinition,
  venomStrikeCardDefinition,
  toxicCloudCardDefinition,
  creepingBlightCardDefinition,
  septicTouchCardDefinition,
  infectiousWoundCardDefinition,
  plagueBurstCardDefinition,
  toxicBarrageCardDefinition,
  virulentAuraCardDefinition,
  contagionCardDefinition,
  fetidWoundCardDefinition,
  immolateCardDefinition,
  backdraftCardDefinition,
  infernoAuraCardDefinition,
  heatShieldCardDefinition,
  flashFireCardDefinition,
  emberThrowCardDefinition,
  kindleCardDefinition,
  scorchCardDefinition,
  funeralPyreCardDefinition,
  smolderingBrandCardDefinition,
  doomEngineCardDefinition,
  unsealCardDefinition,
  ritualCollapseCardDefinition,
  doomBellCardDefinition,
  hollowWardCardDefinition,
  refrainCardDefinition,
  wardingCircleCardDefinition,
  lastWordCardDefinition,
  woundCardDefinition,
  decayCardDefinition,
  parasiteCardDefinition
} = require("./cards");
const { createDeckState, drawCards } = require("./deckZones");
const { startPlayerTurn } = require("./energy");
const { performEnemyAttack } = require("./enemy");
const { playCard } = require("./playCard");
const { endPlayerTurn, startPlayerTurnAfterEnemy } = require("./turns");

/** @type {Record<CardId, CardFactory>} */
const cardFactories = {
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
  spite_shield: spiteShieldCardDefinition,
  war_cry: warCryCardDefinition,
  fortify: fortifyCardDefinition,
  expose: exposeCardDefinition,
  cripple: crippleCardDefinition,
  titan_strike: titanStrikeCardDefinition,
  exploit: exploitCardDefinition,
  enfeeble: enfeebleCardDefinition,
  echo_strike: echoStrikeCardDefinition,
  pommel: pommelCardDefinition,
  brace: braceCardDefinition,
  insight: insightCardDefinition,
  parry: parryCardDefinition,
  heavy_swing: heavySwingCardDefinition,
  recover: recoverCardDefinition,
  plan_ahead: planAheadCardDefinition,
  deep_hex: deepHexCardDefinition,
  black_seal: blackSealCardDefinition,
  feast_on_weakness: feastOnWeaknessCardDefinition,
  malediction: maledictionCardDefinition,
  iron_will: ironWillCardDefinition,
  burning_aura: burningAuraCardDefinition,
  hex_resonance: hexResonanceCardDefinition,
  static_guard: staticGuardCardDefinition,
  capacitor: capacitorCardDefinition,
  release: releaseCardDefinition,
  guarded_pulse: guardedPulseCardDefinition,
  flashstep: flashstepCardDefinition,
  overclock: overclockCardDefinition,
  ashen_blow: ashenBlowCardDefinition,
  final_draft: finalDraftCardDefinition,
  scorch_nerves: scorchNervesCardDefinition,
  cinder_rush: cinderRushCardDefinition,
  empty_the_chamber: emptyTheChamberCardDefinition,
  curse_spiral: curseSpiralCardDefinition,
  cataclysm_sigil: cataclysmSigilCardDefinition,
  no_mercy: noMercyCardDefinition,
  hexburst: hexburstCardDefinition,
  soul_rend: soulRendCardDefinition,
  venom_strike: venomStrikeCardDefinition,
  toxic_cloud: toxicCloudCardDefinition,
  creeping_blight: creepingBlightCardDefinition,
  septic_touch: septicTouchCardDefinition,
  infectious_wound: infectiousWoundCardDefinition,
  plague_burst: plagueBurstCardDefinition,
  toxic_barrage: toxicBarrageCardDefinition,
  virulent_aura: virulentAuraCardDefinition,
  contagion: contagionCardDefinition,
  fetid_wound: fetidWoundCardDefinition,
  immolate: immolateCardDefinition,
  backdraft: backdraftCardDefinition,
  inferno_aura: infernoAuraCardDefinition,
  heat_shield: heatShieldCardDefinition,
  flash_fire: flashFireCardDefinition,
  ember_throw: emberThrowCardDefinition,
  kindle: kindleCardDefinition,
  scorch: scorchCardDefinition,
  funeral_pyre: funeralPyreCardDefinition,
  smoldering_brand: smolderingBrandCardDefinition,
  doom_engine: doomEngineCardDefinition,
  unseal: unsealCardDefinition,
  ritual_collapse: ritualCollapseCardDefinition,
  doom_bell: doomBellCardDefinition,
  hollow_ward: hollowWardCardDefinition,
  refrain: refrainCardDefinition,
  warding_circle: wardingCircleCardDefinition,
  last_word: lastWordCardDefinition,
  wound: woundCardDefinition,
  decay: decayCardDefinition,
  parasite: parasiteCardDefinition
};

/**
 * @param {CardId} cardId
 * @returns {Card}
 */
const createCardFromId = (cardId) => {
  const factory = cardFactories[cardId];
  if (!factory) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return factory();
};

/**
 * @param {CardId[]} cardIds
 * @returns {Card[]}
 */
const instantiateCards = (cardIds) => cardIds.map(createCardFromId);

/**
 * @param {RunState} run
 * @param {{ id: string, health: number, damage?: number, intents?: Array<{ type: string, value?: number, label: string, hits?: number }> }} [enemy]
 * @returns {CombatState}
 */
const startCombatForRun = (run, enemy = { id: "slime", health: 30 }) => {
  const deckState = createDeckState(instantiateCards(run.player.deck), (cards) => cards);
  const combat = startPlayerTurn(
    createCombatEncounter({
      player: run.player,
      enemy
    })
  );
  const withDeck = {
    ...combat,
    enemyTurnNumber: 0,
    enemyIntent: enemy.intents ? enemy.intents[0] : { type: "attack", value: enemy.damage || 6, label: `Attack for ${enemy.damage || 6}` },
    drawPile: deckState.drawPile,
    hand: deckState.hand,
    discardPile: deckState.discardPile
  };

  return drawCards(withDeck, 5, (cards) => cards);
};

/**
 * @param {CombatState} combat
 * @param {number} handIndex
 */
const playCardAtIndex = (combat, handIndex) => {
  const card = combat.hand[handIndex];
  if (!card) {
    return {
      combat,
      rejected: true,
      reason: "Card not found in hand"
    };
  }

  const result = playCard(combat, card);
  if (result.rejected) {
    return {
      ...result,
      reason: "Card play rejected"
    };
  }

  return result;
};

/**
 * @param {CombatState} combat
 * @returns {CombatState}
 */
const resolveEndTurn = (combat) => {
  const enemyTurn = endPlayerTurn(combat);
  const afterEnemy = performEnemyAttack(enemyTurn);

  if (afterEnemy.state !== "active") {
    return afterEnemy;
  }

  return startPlayerTurnAfterEnemy(afterEnemy, 5);
};

module.exports = {
  createCardFromId,
  instantiateCards,
  startCombatForRun,
  playCardAtIndex,
  resolveEndTurn
};
