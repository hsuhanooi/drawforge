const { createCombatEncounter } = require("../src/combat");
const { strikeCardDefinition, STRIKE_DAMAGE } = require("../src/cards");
const { DEFAULT_PLAYER_ENERGY } = require("../src/constants");
const { startPlayerTurn } = require("../src/energy");
const { playCard } = require("../src/playCard");

describe("attack card play", () => {
  it("pays cost, damages enemy, and removes card from hand", () => {
    const strike = strikeCardDefinition();
    const combat = startPlayerTurn(
      createCombatEncounter({
        player: { health: 80 },
        enemy: { id: "slime", health: 20 }
      })
    );
    const withHand = {
      ...combat,
      hand: [strike]
    };

    const result = playCard(withHand, strike);

    expect(result.rejected).toBe(false);
    expect(result.combat.player.energy).toBe(DEFAULT_PLAYER_ENERGY - strike.cost);
    expect(result.combat.enemy.health).toBe(20 - STRIKE_DAMAGE);
    expect(result.combat.hand).toEqual([]);
  });
});
