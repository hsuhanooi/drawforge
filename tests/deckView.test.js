const { addRewardCardToDeck } = require("../src/rewards");
const { getDeckView } = require("../src/deckView");

const createCard = (id) => ({ id, name: id, cost: 1, type: "attack", effect: (s) => s });

describe("deck inspection", () => {
  it("lists all current deck cards", () => {
    const deck = ["strike", "defend"];
    const view = getDeckView(deck);

    expect(view).toEqual(deck);
  });

  it("shows added reward cards in the deck view", () => {
    const deck = ["strike", "defend"];
    const rewardCard = createCard("bash");

    const nextDeck = addRewardCardToDeck(deck, rewardCard);
    const view = getDeckView(nextDeck);

    expect(view).toContain("bash");
    expect(view).toHaveLength(3);
  });
});
