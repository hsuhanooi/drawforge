const { createCombatEncounter } = require("../src/combat");
const { DEFAULT_PLAYER_ENERGY } = require("../src/constants");
const { startNextPlayerTurn } = require("../src/turns");

describe("turn transitions", () => {
  it("clears temporary block at the start of the next player turn", () => {
    const combat = createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 30 }
    });
    const withBlock = {
      ...combat,
      player: {
        ...combat.player,
        block: 7
      }
    };

    const next = startNextPlayerTurn(withBlock);

    expect(next.player.block).toBe(0);
    expect(next.player.energy).toBe(DEFAULT_PLAYER_ENERGY);
    expect(next.turn).toBe("player");
  });
});
