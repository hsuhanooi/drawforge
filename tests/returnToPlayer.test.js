const { createCombatEncounter } = require("../src/combat");
const { DEFAULT_PLAYER_ENERGY } = require("../src/constants");
const { startPlayerTurnAfterEnemy } = require("../src/turns");

describe("enemy turn completion", () => {
  it("returns to player, refreshes energy, and draws a new hand", () => {
    const combat = {
      ...createCombatEncounter({
        player: { health: 80 },
        enemy: { id: "slime", health: 30 }
      }),
      turn: "player",
      drawPile: ["strike", "defend", "strike", "defend", "strike"],
      hand: [],
      discardPile: []
    };

    const next = startPlayerTurnAfterEnemy(combat, 5);

    expect(next.turn).toBe("player");
    expect(next.player.energy).toBe(DEFAULT_PLAYER_ENERGY);
    expect(next.hand).toHaveLength(5);
    expect(next.drawPile).toEqual([]);
  });
});
