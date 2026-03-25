const { createCombatEncounter } = require("../src/combat");
const { defendCardDefinition, DEFEND_BLOCK } = require("../src/cards");
const { DEFAULT_PLAYER_ENERGY } = require("../src/constants");
const { startPlayerTurn } = require("../src/energy");
const { playCard } = require("../src/playCard");

describe("defense card play", () => {
  it("pays cost, grants block, and removes card from hand", () => {
    const defend = defendCardDefinition();
    const combat = startPlayerTurn(
      createCombatEncounter({
        player: { health: 80 },
        enemy: { id: "slime", health: 20 }
      })
    );
    const withHand = {
      ...combat,
      hand: [defend]
    };

    const result = playCard(withHand, defend);

    expect(result.rejected).toBe(false);
    expect(result.combat.player.energy).toBe(DEFAULT_PLAYER_ENERGY - defend.cost);
    expect(result.combat.player.block).toBe(DEFEND_BLOCK);
    expect(result.combat.hand).toEqual([]);
  });
});
