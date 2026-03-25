const {
  createDeckState,
  drawCards,
  discardCards
} = require("../src/deckZones");

describe("deck zones", () => {
  const identityShuffle = (cards) => [...cards];
  const reverseShuffle = (cards) => [...cards].reverse();

  it("initializes draw pile from the player's deck", () => {
    const deck = ["strike", "defend", "strike"];
    const state = createDeckState(deck, identityShuffle);

    expect(state.drawPile).toEqual(deck);
    expect(state.hand).toEqual([]);
    expect(state.discardPile).toEqual([]);
  });

  it("draws cards into hand and removes them from the draw pile", () => {
    const deck = ["strike", "defend", "strike"];
    const state = createDeckState(deck, identityShuffle);

    const nextState = drawCards(state, 2, identityShuffle);

    expect(nextState.hand).toEqual(["strike", "defend"]);
    expect(nextState.drawPile).toEqual(["strike"]);
  });

  it("discards cards from hand into the discard pile", () => {
    const state = {
      drawPile: [],
      hand: ["strike", "defend", "strike"],
      discardPile: []
    };

    const nextState = discardCards(state, ["strike", "defend"]);

    expect(nextState.hand).toEqual(["strike"]);
    expect(nextState.discardPile).toEqual(["strike", "defend"]);
  });

  it("reshuffles discard pile into draw pile when needed", () => {
    const state = {
      drawPile: [],
      hand: [],
      discardPile: ["strike", "defend"]
    };

    const nextState = drawCards(state, 1, reverseShuffle);

    expect(nextState.hand).toEqual(["defend"]);
    expect(nextState.drawPile).toEqual(["strike"]);
    expect(nextState.discardPile).toEqual([]);
  });

  it("stops drawing when both draw pile and discard pile are empty", () => {
    const state = {
      drawPile: [],
      hand: ["strike"],
      discardPile: []
    };

    const nextState = drawCards(state, 2, identityShuffle);

    expect(nextState.hand).toEqual(["strike"]);
    expect(nextState.drawPile).toEqual([]);
    expect(nextState.discardPile).toEqual([]);
  });
});
