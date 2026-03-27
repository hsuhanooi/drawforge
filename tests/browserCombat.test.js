const { startNewRun } = require("../src/run");
const {
  createCardFromId,
  instantiateCards,
  startCombatForRun,
  playCardAtIndex,
  resolveEndTurn
} = require("../src/browserCombat");

describe("browser combat helpers", () => {
  it("creates card instances from card ids", () => {
    const strike = createCardFromId("strike");
    const markOfRuin = createCardFromId("mark_of_ruin");
    const cards = instantiateCards(["strike", "hexblade"]);

    expect(strike.id).toBe("strike");
    expect(markOfRuin.id).toBe("mark_of_ruin");
    expect(cards).toHaveLength(2);
    expect(cards[1].id).toBe("hexblade");
  });

  it("starts combat with a drawn opening hand and energy", () => {
    const run = startNewRun();

    const combat = startCombatForRun(run);

    expect(combat.turn).toBe("player");
    expect(combat.player.energy).toBe(3);
    expect(combat.hand).toHaveLength(5);
    expect(combat.enemy.health).toBe(30);
  });

  it("plays a card from hand by index", () => {
    const run = startNewRun();
    const combat = startCombatForRun(run);

    const result = playCardAtIndex(combat, 0);

    expect(result.rejected).toBe(false);
    expect(result.combat.hand).toHaveLength(4);
    expect(result.combat.player.energy).toBe(2);
  });

  it("rejects invalid hand indexes", () => {
    const run = startNewRun();
    const combat = startCombatForRun(run);

    const result = playCardAtIndex(combat, 99);

    expect(result.rejected).toBe(true);
    expect(result.reason).toBe("Card not found in hand");
  });

  it("resolves end turn into enemy attack and a new player turn", () => {
    const run = startNewRun();
    const combat = startCombatForRun(run);

    const next = resolveEndTurn(combat);

    expect(next.turn).toBe("player");
    expect(next.player.energy).toBe(3);
    expect(next.player.health).toBe(74);
    expect(Array.isArray(next.hand)).toBe(true);
  });
});
