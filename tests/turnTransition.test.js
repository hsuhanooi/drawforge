const { createCombatEncounter } = require("../src/combat");
const { endPlayerTurn } = require("../src/turns");

describe("player to enemy turn transition", () => {
  it("moves to enemy turn and begins enemy action phase", () => {
    const combat = createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 30 }
    });

    const next = endPlayerTurn(combat);

    expect(next.turn).toBe("enemy");
    expect(next.enemyPhase).toBe("action");
  });
});
