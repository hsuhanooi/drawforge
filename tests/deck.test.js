const { createStarterDeck } = require("../src/deck");
const { startNewRun } = require("../src/run");

describe("starter deck", () => {
  const countCard = (deck, id) => deck.filter((cardId) => cardId === id).length;

  it("creates the expected starter deck composition", () => {
    const deck = createStarterDeck();

    expect(countCard(deck, "strike")).toBe(5);
    expect(countCard(deck, "defend")).toBe(5);
  });

  it("stores the starter deck in player state when starting a run", () => {
    const run = startNewRun();

    expect(countCard(run.player.deck, "strike")).toBe(5);
    expect(countCard(run.player.deck, "defend")).toBe(5);
  });
});
