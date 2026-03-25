const defaultShuffle = (cards) => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createDeckState = (deck, shuffle = defaultShuffle) => ({
  drawPile: shuffle(deck),
  hand: [],
  discardPile: []
});

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

const discardCards = (state, cardIds) => {
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
