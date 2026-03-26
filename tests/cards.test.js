const { createCard } = require("../src/card");
const {
  STRIKE_DAMAGE,
  DEFEND_BLOCK,
  BASH_DAMAGE,
  BARRIER_BLOCK,
  QUICK_STRIKE_DAMAGE,
  VOLLEY_DAMAGE,
  WITHER_DAMAGE,
  SIPHON_WARD_BLOCK,
  DETONATE_SIGIL_DAMAGE,
  DETONATE_SIGIL_HEX_BONUS,
  LINGERING_CURSE_HEX,
  strikeCardDefinition,
  defendCardDefinition,
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition,
  witherCardDefinition,
  siphonWardCardDefinition,
  detonateSigilCardDefinition,
  lingeringCurseCardDefinition
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
    const wither = witherCardDefinition();
    const siphonWard = siphonWardCardDefinition();
    const detonateSigil = detonateSigilCardDefinition();
    const lingeringCurse = lingeringCurseCardDefinition();

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
    expect(wither.id).toBe("wither");
    expect(siphonWard.id).toBe("siphon_ward");
    expect(detonateSigil.id).toBe("detonate_sigil");
    expect(lingeringCurse.id).toBe("lingering_curse");
    expect(lingeringCurse.exhaust).toBe(true);
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
      enemy: { health: 20, hex: 0 }
    };

    expect(executeCardEffect(bash, state).enemy.health).toBe(20 - BASH_DAMAGE);
    expect(executeCardEffect(barrier, state).player.block).toBe(1 + BARRIER_BLOCK);
    expect(executeCardEffect(quickStrike, state).enemy.health).toBe(20 - QUICK_STRIKE_DAMAGE);
    expect(executeCardEffect(focus, state).player.energy).toBe(3);
    expect(executeCardEffect(volley, state).enemy.health).toBe(20 - VOLLEY_DAMAGE);
  });

  it("executes hex package card effects", () => {
    const wither = witherCardDefinition();
    const siphonWard = siphonWardCardDefinition();
    const detonateSigil = detonateSigilCardDefinition();
    const lingeringCurse = lingeringCurseCardDefinition();
    const baseState = {
      player: { health: 80, block: 2, energy: 2 },
      enemy: { health: 30, hex: 0 },
      exhaustPile: []
    };
    const hexedState = {
      ...baseState,
      enemy: { ...baseState.enemy, hex: 1 }
    };

    const afterWither = executeCardEffect(wither, baseState);
    expect(afterWither.enemy.health).toBe(30 - WITHER_DAMAGE);
    expect(afterWither.enemy.hex).toBe(1);

    const afterWard = executeCardEffect(siphonWard, hexedState);
    expect(afterWard.player.block).toBe(2 + SIPHON_WARD_BLOCK + 4);

    const afterSigil = executeCardEffect(detonateSigil, hexedState);
    expect(afterSigil.enemy.health).toBe(30 - DETONATE_SIGIL_DAMAGE - DETONATE_SIGIL_HEX_BONUS);

    const afterCurse = executeCardEffect(lingeringCurse, baseState);
    expect(afterCurse.enemy.hex).toBe(LINGERING_CURSE_HEX);
  });
});
