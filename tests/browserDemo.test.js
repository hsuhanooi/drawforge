const { createBrowserDemoState, summarizeRun } = require("../src/browserDemo");

describe("browser demo helpers", () => {
  it("creates a new browser demo state from the normal run initializer", () => {
    const run = createBrowserDemoState();

    expect(run.state).toBe("in_progress");
    expect(run.player.deck.length).toBeGreaterThan(0);
    expect(run.combat).toBeNull();
  });

  it("summarizes run state for a UI-facing view", () => {
    const summary = summarizeRun({
      state: "in_progress",
      player: { health: 80, gold: 99, deck: ["strike", "defend"] },
      map: { currentNodeId: null },
      combat: null
    });

    expect(summary).toEqual({
      state: "in_progress",
      health: 80,
      gold: 99,
      deckCount: 2,
      currentNodeId: null,
      inCombat: false,
      combatState: null
    });
  });
});
