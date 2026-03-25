const { checkCombatEnd } = require("../src/combatState");

describe("combat end states", () => {
  it("sets victory when enemy reaches zero health", () => {
    const combat = {
      state: "active",
      turn: "player",
      player: { health: 10 },
      enemy: { health: 0 }
    };

    const next = checkCombatEnd(combat);

    expect(next.state).toBe("victory");
    expect(next.turn).toBeNull();
  });

  it("sets defeat when player reaches zero health", () => {
    const combat = {
      state: "active",
      turn: "enemy",
      player: { health: 0 },
      enemy: { health: 10 }
    };

    const next = checkCombatEnd(combat);

    expect(next.state).toBe("defeat");
    expect(next.turn).toBeNull();
  });
});
