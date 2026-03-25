const { createCombatEncounter } = require("../src/combat");
const { strikeCardDefinition } = require("../src/cards");
const { DEFAULT_PLAYER_ENERGY } = require("../src/constants");
const { startPlayerTurn, playCardWithEnergy } = require("../src/energy");

describe("energy system", () => {
  it("initializes player energy at the start of the turn", () => {
    const combat = createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 30 }
    });

    const started = startPlayerTurn(combat);

    expect(started.player.energy).toBe(DEFAULT_PLAYER_ENERGY);
    expect(started.turn).toBe("player");
  });

  it("reduces energy when playing a card with sufficient energy", () => {
    const combat = startPlayerTurn(
      createCombatEncounter({
        player: { health: 80 },
        enemy: { id: "slime", health: 30 }
      })
    );
    const strike = strikeCardDefinition();

    const result = playCardWithEnergy(combat, strike);

    expect(result.rejected).toBe(false);
    expect(result.combat.player.energy).toBe(DEFAULT_PLAYER_ENERGY - strike.cost);
  });

  it("rejects a card play when energy is insufficient", () => {
    const combat = startPlayerTurn(
      createCombatEncounter({
        player: { health: 80 },
        enemy: { id: "slime", health: 30 }
      }),
      0
    );
    const strike = strikeCardDefinition();

    const result = playCardWithEnergy(combat, strike);

    expect(result.rejected).toBe(true);
    expect(result.combat.player.energy).toBe(0);
  });
});
