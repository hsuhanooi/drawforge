const removeCardFromDeck = (deck, cardId) => {
  const index = deck.indexOf(cardId);
  if (index === -1) {
    return {
      deck,
      removed: false
    };
  }

  return {
    deck: [...deck.slice(0, index), ...deck.slice(index + 1)],
    removed: true
  };
};

module.exports = {
  removeCardFromDeck
};
