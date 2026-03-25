const { executeCardEffect } = require("./combatEngine");
const { checkCombatEnd } = require("./combatState");
const { playCardWithEnergy } = require("./energy");

const removeCardFromHand = (hand, card) => {
  const index = hand.indexOf(card);
  if (index === -1) {
    return hand;
  }

  return [...hand.slice(0, index), ...hand.slice(index + 1)];
};

const playCard = (combat, card) => {
  if (!combat.hand.includes(card)) {
    return {
      combat,
      rejected: true
    };
  }

  const energyResult = playCardWithEnergy(combat, card);
  if (energyResult.rejected) {
    return energyResult;
  }

  const afterEffect = checkCombatEnd(
    executeCardEffect(card, energyResult.combat)
  );
  const nextHand = removeCardFromHand(afterEffect.hand, card);

  return {
    rejected: false,
    combat: {
      ...afterEffect,
      hand: nextHand,
      discardPile: [...afterEffect.discardPile, card]
    }
  };
};

module.exports = {
  playCard
};
