// @ts-check

/** @typedef {import("./types").Card} Card */
/** @typedef {import("./types").CardFactory} CardFactory */
/** @typedef {import("./types").CardId} CardId */
/** @typedef {import("./types").RunStateLike} RunStateLike */
/** @typedef {import("./types").CombatStateLike} CombatStateLike */

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
  lingeringCurseCardDefinition
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
  lingering_curse: lingeringCurseCardDefinition
};

/**
 * @param {CardId} cardId
 * @returns {Card}
 */
const createCardFromId = (cardId) => {
  const factory = cardFactories[cardId];
  return factory();
};

/**
 * @param {CardId[]} cardIds
 * @returns {Card[]}
 */
const instantiateCards = (cardIds) => cardIds.map(createCardFromId);

/**
 * @param {RunStateLike} run
 * @param {{ id: string, health: number, damage?: number, intents?: Array<{ type: string, value?: number, label: string, hits?: number }> }} [enemy]
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
 * @param {CombatStateLike & { hand: Card[] }} combat
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
 * @param {CombatStateLike} combat
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
