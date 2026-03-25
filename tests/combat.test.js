const { createCombatEncounter } = require("../src/combat");

describe("createCombatEncounter", () => {
  it("initializes player and enemy combat state", () => {
    const player = { health: 80 };
    const enemy = { id: "slime", health: 30 };

    const combat = createCombatEncounter({ player, enemy });

    expect(combat.player).toEqual({
      health: 80,
      block: 0,
      energy: 0
    });
    expect(combat.hand).toEqual([]);
    expect(combat.discardPile).toEqual([]);
    expect(combat.enemy).toEqual({
      id: "slime",
      health: 30
    });
  });

  it("sets combat as active with player taking the first turn", () => {
    const combat = createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 30 }
    });

    expect(combat.state).toBe("active");
    expect(combat.turn).toBe("player");
  });
});
