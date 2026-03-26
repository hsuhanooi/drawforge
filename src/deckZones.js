// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CombatState} CombatState */

/**
 * @template T
 * @param {T[]} cards
 * @returns {T[]}
 */
const defaultShuffle = (cards) => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * @param {Card[]} deck
 * @param {(cards: Card[]) => Card[]} [shuffle]
 * @returns {{ drawPile: Card[], hand: Card[], discardPile: Card[] }}
 */
const createDeckState = (deck, shuffle = defaultShuffle) => ({
  drawPile: shuffle(deck),
  hand: [],
  discardPile: []
});

/**
 * @param {CombatState} state
 * @param {(cards: Card[]) => Card[]} shuffle
 * @returns {CombatState}
 */
const reshuffleIfNeeded = (state, shuffle) => {
  if (state.drawPile.length > 0) {
    return state;
  }

  if (state.discardPile.length === 0) {
    return state;
  }

  return {
    ...state,
    drawPile: shuffle(state.discardPile),
    discardPile: []
  };
};

/**
 * @param {CombatState} state
 * @param {number} count
 * @param {(cards: Card[]) => Card[]} [shuffle]
 * @returns {CombatState}
 */
const drawCards = (state, count, shuffle = defaultShuffle) => {
  let nextState = { ...state };
  for (let i = 0; i < count; i += 1) {
    nextState = reshuffleIfNeeded(nextState, shuffle);
    if (nextState.drawPile.length === 0) {
      break;
    }

    const [card, ...restDrawPile] = nextState.drawPile;
    nextState = {
      ...nextState,
      drawPile: restDrawPile,
      hand: [...nextState.hand, card]
    };
  }

  return nextState;
};

/**
 * @param {string[]} cards
 * @param {string[]} cardIds
 * @returns {string[]}
 */
const removeCardIds = (cards, cardIds) => {
  const remainingIds = [...cardIds];
  return cards.filter((cardId) => {
    const index = remainingIds.indexOf(cardId);
    if (index === -1) {
      return true;
    }
    remainingIds.splice(index, 1);
    return false;
  });
};

/**
 * @param {{ hand: string[], discardPile: string[] } & Record<string, unknown>} state
 * @param {string[]} cardIds
 */
const discardCards = (state, cardIds) => {
  /** @type {string[]} */
  const discarded = [];
  const remainingIds = [...cardIds];

  const nextHand = state.hand.filter((cardId) => {
    const index = remainingIds.indexOf(cardId);
    if (index === -1) {
      return true;
    }
    remainingIds.splice(index, 1);
    discarded.push(cardId);
    return false;
  });

  return {
    ...state,
    hand: nextHand,
    discardPile: [...state.discardPile, ...discarded]
  };
};

module.exports = {
  createDeckState,
  drawCards,
  discardCards,
  removeCardIds,
  defaultShuffle
};
