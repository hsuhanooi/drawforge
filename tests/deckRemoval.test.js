const { removeCardFromDeck } = require("../src/deckRemoval");

describe("deck removal", () => {
  it("removes a selected card from the deck", () => {
    const deck = ["strike", "defend", "strike"];

    const result = removeCardFromDeck(deck, "defend");

    expect(result.removed).toBe(true);
    expect(result.deck).toEqual(["strike", "strike"]);
  });

  it("rejects removal if the card is not present", () => {
    const deck = ["strike", "defend"];

    const result = removeCardFromDeck(deck, "bash");

    expect(result.removed).toBe(false);
    expect(result.deck).toEqual(deck);
  });
});
