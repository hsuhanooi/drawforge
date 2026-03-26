const { createCard } = require("../src/card");
const {
  STRIKE_DAMAGE,
  DEFEND_BLOCK,
  BASH_DAMAGE,
  BARRIER_BLOCK,
  QUICK_STRIKE_DAMAGE,
  VOLLEY_DAMAGE,
  strikeCardDefinition,
  defendCardDefinition,
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition
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
      effect: expect.any(Function),
      exhaust: false
    });
  });
});

describe("card definitions", () => {
  it("creates strike, defend, and extended reward card instances", () => {
    const strike = strikeCardDefinition();
    const defend = defendCardDefinition();
    const bash = bashCardDefinition();
    const barrier = barrierCardDefinition();
    const quickStrike = quickStrikeCardDefinition();
    const focus = focusCardDefinition();
    const volley = volleyCardDefinition();

    expect(strike.id).toBe("strike");
    expect(strike.cost).toBe(1);
    expect(defend.id).toBe("defend");
    expect(defend.cost).toBe(1);
    expect(bash.id).toBe("bash");
    expect(bash.cost).toBe(2);
    expect(barrier.id).toBe("barrier");
    expect(barrier.cost).toBe(2);
    expect(quickStrike.id).toBe("quick_strike");
    expect(quickStrike.cost).toBe(0);
    expect(focus.id).toBe("focus");
    expect(volley.id).toBe("volley");
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

  it("executes extended reward card effects", () => {
    const bash = bashCardDefinition();
    const barrier = barrierCardDefinition();
    const quickStrike = quickStrikeCardDefinition();
    const focus = focusCardDefinition();
    const volley = volleyCardDefinition();
    const state = {
      player: { health: 80, block: 1, energy: 2 },
      enemy: { health: 20 }
    };

    expect(executeCardEffect(bash, state).enemy.health).toBe(20 - BASH_DAMAGE);
    expect(executeCardEffect(barrier, state).player.block).toBe(1 + BARRIER_BLOCK);
    expect(executeCardEffect(quickStrike, state).enemy.health).toBe(20 - QUICK_STRIKE_DAMAGE);
    expect(executeCardEffect(focus, state).player.energy).toBe(3);
    expect(executeCardEffect(volley, state).enemy.health).toBe(20 - VOLLEY_DAMAGE);
  });
});
