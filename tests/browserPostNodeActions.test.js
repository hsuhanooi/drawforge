const {
  applyVictoryToRun,
  claimCardReward,
  claimRelicFromChoices,
  claimRelicReward,
  skipRewards,
  claimEventOption,
  removeCardFromDeck
} = require("../src/browserPostNodeActions");

describe("browser post-node actions", () => {
  const baseRun = {
    state: "in_progress",
    player: { health: 80, gold: 99, deck: ["strike", "defend"] },
    relics: [],
    combat: null,
    event: null,
    pendingRewards: null,
    map: {
      currentNodeId: "r1c1",
      nodes: [{ id: "r1c1", row: 1, col: 1, type: "event", next: [] }]
    }
  };

  it("applies victory rewards into pending rewards", () => {
    const run = applyVictoryToRun(
      { ...baseRun, map: { currentNodeId: "r2c1", nodes: [{ id: "r2c1", row: 2, col: 1, type: "combat", next: [] }] } },
      { nodeType: "combat", player: { health: 72 } }
    );

    expect(run.player.health).toBe(72);
    expect(run.pendingRewards.cards.length).toBeGreaterThan(0);
  });

  it("claims a reward card and adds it to the deck", () => {
    const run = claimCardReward({
      ...baseRun,
      pendingRewards: { cards: [{ id: "bash" }], gold: 12, relic: null, relics: [], removeCard: false }
    }, "bash");

    expect(run.player.deck).toContain("bash");
  });

  it("claims an event add-card option by option id", () => {
    const run = claimEventOption({
      ...baseRun,
      event: {
        id: "event-r1c1",
        kind: "camp",
        text: "camp",
        options: [{ id: "focus", effect: "add_card", card: { id: "focus" } }]
      }
    }, "focus");

    expect(run.player.deck).toContain("focus");
    expect(run.event).toBeNull();
  });

  it("can remove a chosen card from the deck", () => {
    const run = removeCardFromDeck({
      ...baseRun,
      pendingRewards: { cards: [], gold: 0, relic: null, relics: [], removeCard: true }
    }, "strike");

    expect(run.player.deck).not.toContain("strike");
  });

  it("uses elite reward order card, then relic, then removal", () => {
    const relic = { id: "ember_ring", name: "Ember Ring", description: "+1 energy" };
    const afterCard = claimCardReward({
      ...baseRun,
      pendingRewards: { cards: [{ id: "bash" }], gold: 25, relic: null, relics: [relic], removeCard: false }
    }, "bash");

    expect(afterCard.player.deck).toContain("bash");
    expect(afterCard.pendingRewards.relics.map((item) => item.id)).toContain("ember_ring");
    expect(afterCard.pendingRewards.cards).toEqual([]);
    expect(afterCard.pendingRewards.removeCard).toBe(false);

    const afterRelic = claimRelicFromChoices(afterCard, "ember_ring");
    expect(afterRelic.relics.map((item) => item.id)).toContain("ember_ring");
    expect(afterRelic.pendingRewards.relics).toEqual([]);
    expect(afterRelic.pendingRewards.removeCard).toBe(true);

    const relicRun = claimRelicReward({
      ...baseRun,
      pendingRewards: { cards: [{ id: "bash" }], gold: 50, relic, relics: [], removeCard: false }
    }, "ember_ring");
    expect(relicRun.relics.map((item) => item.id)).toContain("ember_ring");
  });

  it("can skip rewards", () => {
    const run = skipRewards({
      ...baseRun,
      pendingRewards: { cards: [{ id: "bash" }], gold: 12, relic: null, relics: [], removeCard: false }
    });

    expect(run.pendingRewards).toBeNull();
  });
});
