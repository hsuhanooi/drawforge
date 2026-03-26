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
  MARK_OF_RUIN_HEX,
  HEXBLADE_DAMAGE,
  HEXBLADE_HEX,
  REAPERS_CLAUSE_DAMAGE,
  CREMATE_BLOCK,
  HARVESTER_DAMAGE,
  HARVESTER_BONUS,
  ARC_LASH_DAMAGE,
  BLOOD_PACT_SELF_DAMAGE,
  BLOOD_PACT_ENERGY,
  SPITE_SHIELD_BLOCK,
  SPITE_SHIELD_HEX,
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
  lingeringCurseCardDefinition,
  markOfRuinCardDefinition,
  hexbladeCardDefinition,
  reaperSClauseCardDefinition,
  fireSaleCardDefinition,
  cremateCardDefinition,
  graveFuelCardDefinition,
  brandTheSoulCardDefinition,
  harvesterCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition,
  bloodPactCardDefinition,
  spiteShieldCardDefinition
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
      exhaust: false,
      rarity: "common"
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

describe("new card definitions", () => {
  it("all new cards instantiate with correct ids and rarity", () => {
    expect(markOfRuinCardDefinition().id).toBe("mark_of_ruin");
    expect(markOfRuinCardDefinition().rarity).toBe("common");
    expect(hexbladeCardDefinition().id).toBe("hexblade");
    expect(hexbladeCardDefinition().rarity).toBe("common");
    expect(reaperSClauseCardDefinition().id).toBe("reapers_clause");
    expect(reaperSClauseCardDefinition().rarity).toBe("uncommon");
    expect(fireSaleCardDefinition().id).toBe("fire_sale");
    expect(fireSaleCardDefinition().rarity).toBe("common");
    expect(cremateCardDefinition().id).toBe("cremate");
    expect(cremateCardDefinition().rarity).toBe("common");
    expect(graveFuelCardDefinition().id).toBe("grave_fuel");
    expect(graveFuelCardDefinition().rarity).toBe("rare");
    expect(brandTheSoulCardDefinition().id).toBe("brand_the_soul");
    expect(brandTheSoulCardDefinition().rarity).toBe("uncommon");
    expect(harvesterCardDefinition().id).toBe("harvester");
    expect(harvesterCardDefinition().rarity).toBe("rare");
    expect(chargeUpCardDefinition().id).toBe("charge_up");
    expect(chargeUpCardDefinition().rarity).toBe("common");
    expect(arcLashCardDefinition().id).toBe("arc_lash");
    expect(arcLashCardDefinition().rarity).toBe("common");
    expect(bloodPactCardDefinition().id).toBe("blood_pact");
    expect(bloodPactCardDefinition().rarity).toBe("rare");
    expect(spiteShieldCardDefinition().id).toBe("spite_shield");
    expect(spiteShieldCardDefinition().rarity).toBe("uncommon");
  });

  it("all existing cards have rarity field", () => {
    expect(strikeCardDefinition().rarity).toBe("common");
    expect(defendCardDefinition().rarity).toBe("common");
    expect(bashCardDefinition().rarity).toBe("common");
    expect(barrierCardDefinition().rarity).toBe("common");
    expect(quickStrikeCardDefinition().rarity).toBe("common");
    expect(focusCardDefinition().rarity).toBe("common");
    expect(volleyCardDefinition().rarity).toBe("common");
    expect(witherCardDefinition().rarity).toBe("uncommon");
    expect(siphonWardCardDefinition().rarity).toBe("uncommon");
    expect(detonateSigilCardDefinition().rarity).toBe("uncommon");
    expect(lingeringCurseCardDefinition().rarity).toBe("uncommon");
  });

  it("mark_of_ruin applies hex and draws a card", () => {
    const card = markOfRuinCardDefinition();
    const state = { player: { health: 80, block: 0, energy: 2 }, enemy: { health: 20, hex: 0 }, drawCount: 0 };
    const next = executeCardEffect(card, state);
    expect(next.enemy.hex).toBe(MARK_OF_RUIN_HEX);
    expect(next.drawCount).toBe(1);
  });

  it("hexblade deals damage and applies hex", () => {
    const card = hexbladeCardDefinition();
    const state = { player: { health: 80, block: 0 }, enemy: { health: 30, hex: 0 } };
    const next = executeCardEffect(card, state);
    expect(next.enemy.health).toBe(30 - HEXBLADE_DAMAGE);
    expect(next.enemy.hex).toBe(HEXBLADE_HEX);
  });

  it("reapers_clause deals base damage regardless of hex (effect layer)", () => {
    const card = reaperSClauseCardDefinition();
    const state = { player: { health: 80, block: 0 }, enemy: { health: 30, hex: 0 } };
    const next = executeCardEffect(card, state);
    expect(next.enemy.health).toBe(30 - REAPERS_CLAUSE_DAMAGE);
  });

  it("cremate gains block and signals exhaustFromHand", () => {
    const card = cremateCardDefinition();
    const state = { player: { health: 80, block: 0 }, enemy: { health: 30 } };
    const next = executeCardEffect(card, state);
    expect(next.player.block).toBe(CREMATE_BLOCK);
    expect(next.exhaustFromHand).toBe(true);
  });

  it("grave_fuel gains energy equal to exhaustedThisTurn", () => {
    const card = graveFuelCardDefinition();
    const state = { player: { health: 80, block: 0, energy: 1 }, enemy: { health: 30 }, exhaustedThisTurn: 2 };
    const next = executeCardEffect(card, state);
    expect(next.player.energy).toBe(3);
  });

  it("grave_fuel gains 0 energy when nothing was exhausted", () => {
    const card = graveFuelCardDefinition();
    const state = { player: { health: 80, block: 0, energy: 1 }, enemy: { health: 30 }, exhaustedThisTurn: 0 };
    const next = executeCardEffect(card, state);
    expect(next.player.energy).toBe(1);
  });

  it("harvester deals base damage, plus bonus vs hexed and vs exhausted", () => {
    const card = harvesterCardDefinition();
    const base = { player: { health: 80, block: 0 }, enemy: { health: 30, hex: 0 }, exhaustedThisTurn: 0 };
    const hexed = { ...base, enemy: { ...base.enemy, hex: 1 } };
    const exhausted = { ...base, exhaustedThisTurn: 1 };
    const both = { ...hexed, exhaustedThisTurn: 1 };

    expect(executeCardEffect(card, base).enemy.health).toBe(30 - HARVESTER_DAMAGE);
    expect(executeCardEffect(card, hexed).enemy.health).toBe(30 - HARVESTER_DAMAGE - HARVESTER_BONUS);
    expect(executeCardEffect(card, exhausted).enemy.health).toBe(30 - HARVESTER_DAMAGE - HARVESTER_BONUS);
    expect(executeCardEffect(card, both).enemy.health).toBe(30 - HARVESTER_DAMAGE - HARVESTER_BONUS - HARVESTER_BONUS);
  });

  it("charge_up sets charged and draws a card", () => {
    const card = chargeUpCardDefinition();
    const state = { player: { health: 80, block: 0, charged: false }, enemy: { health: 30 }, drawCount: 0 };
    const next = executeCardEffect(card, state);
    expect(next.player.charged).toBe(true);
    expect(next.drawCount).toBe(1);
  });

  it("arc_lash deals damage and draws if charged", () => {
    const card = arcLashCardDefinition();
    const uncharged = { player: { health: 80, block: 0, charged: false }, enemy: { health: 30 }, drawCount: 0 };
    const charged = { ...uncharged, player: { ...uncharged.player, charged: true } };

    const afterUncharged = executeCardEffect(card, uncharged);
    expect(afterUncharged.enemy.health).toBe(30 - ARC_LASH_DAMAGE);
    expect(afterUncharged.drawCount).toBe(0);

    const afterCharged = executeCardEffect(card, charged);
    expect(afterCharged.enemy.health).toBe(30 - ARC_LASH_DAMAGE);
    expect(afterCharged.drawCount).toBe(1);
  });

  it("blood_pact deals self-damage and gains energy and draws", () => {
    const card = bloodPactCardDefinition();
    const state = { player: { health: 80, block: 0, energy: 0 }, enemy: { health: 30 }, drawCount: 0 };
    const next = executeCardEffect(card, state);
    expect(next.player.health).toBe(80 - BLOOD_PACT_SELF_DAMAGE);
    expect(next.player.energy).toBe(BLOOD_PACT_ENERGY);
    expect(next.drawCount).toBe(1);
  });

  it("spite_shield grants block and applies hex to enemy", () => {
    const card = spiteShieldCardDefinition();
    const state = { player: { health: 80, block: 0 }, enemy: { health: 30, hex: 0 } };
    const next = executeCardEffect(card, state);
    expect(next.player.block).toBe(SPITE_SHIELD_BLOCK);
    expect(next.enemy.hex).toBe(SPITE_SHIELD_HEX);
  });
});
