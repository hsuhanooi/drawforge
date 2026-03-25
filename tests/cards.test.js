const { createCard } = require("../src/card");
const {
  STRIKE_DAMAGE,
  DEFEND_BLOCK,
  strikeCardDefinition,
  defendCardDefinition
} = require("../src/cards");
const { executeCardEffect } = require("../src/combatEngine");

describe("card model", () => {
  it("creates cards with core properties", () => {
    const card = createCard({
      id: "test",
      name: "Test",
      cost: 2,
      type: "attack",
      effect: (state) => state
    });

    expect(card).toEqual({
      id: "test",
      name: "Test",
      cost: 2,
      type: "attack",
      effect: expect.any(Function)
    });
  });
});

describe("card definitions", () => {
  it("creates strike and defend card instances", () => {
    const strike = strikeCardDefinition();
    const defend = defendCardDefinition();

    expect(strike.id).toBe("strike");
    expect(strike.cost).toBe(1);
    expect(defend.id).toBe("defend");
    expect(defend.cost).toBe(1);
  });

  it("executes a strike effect via the combat engine", () => {
    const strike = strikeCardDefinition();
    const state = {
      player: { health: 80, block: 0 },
      enemy: { health: 20 }
    };

    const nextState = executeCardEffect(strike, state);

    expect(nextState.enemy.health).toBe(20 - STRIKE_DAMAGE);
    expect(nextState.player).toEqual(state.player);
  });

  it("executes a defend effect via the combat engine", () => {
    const defend = defendCardDefinition();
    const state = {
      player: { health: 80, block: 2 },
      enemy: { health: 20 }
    };

    const nextState = executeCardEffect(defend, state);

    expect(nextState.player.block).toBe(2 + DEFEND_BLOCK);
    expect(nextState.enemy).toEqual(state.enemy);
  });
});
