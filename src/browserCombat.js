const { createCombatEncounter } = require("./combat");
const { strikeCardDefinition, defendCardDefinition } = require("./cards");
const { createDeckState, drawCards } = require("./deckZones");
const { startPlayerTurn } = require("./energy");
const { performEnemyAttack } = require("./enemy");
const { playCard } = require("./playCard");
const { endPlayerTurn, startPlayerTurnAfterEnemy } = require("./turns");

const cardFactories = {
  strike: strikeCardDefinition,
  defend: defendCardDefinition
};

const createCardFromId = (cardId) => {
  const factory = cardFactories[cardId];
  if (!factory) {
    throw new Error(`Unknown card id: ${cardId}`);
  }

  return factory();
};

const instantiateCards = (cardIds) => cardIds.map(createCardFromId);

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
    drawPile: deckState.drawPile,
    hand: deckState.hand,
    discardPile: deckState.discardPile
  };

  return drawCards(withDeck, 5, (cards) => cards);
};

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
