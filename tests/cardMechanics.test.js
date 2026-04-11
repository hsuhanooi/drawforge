const { createCombatEncounter } = require("../src/combat");
const { startPlayerTurn } = require("../src/energy");
const { playCard } = require("../src/playCard");
const {
  surgeCardDefinition,
  hexCardDefinition,
  punishCardDefinition,
  burnoutCardDefinition,
  crackdownCardDefinition,
  momentumCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition,
  bloodPactCardDefinition,
  graveFuelCardDefinition,
  harvesterCardDefinition
} = require("../src/cards");

describe("advanced card mechanics", () => {
  it("sends exhaust cards to an exhaust pile instead of discard", () => {
    const surge = surgeCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 20 }
    }));
    const withHand = { ...combat, hand: [surge], exhaustPile: [] };

    const result = playCard(withHand, surge);

    expect(result.rejected).toBe(false);
    expect(result.combat.exhaustPile).toHaveLength(1);
    expect(result.combat.discardPile).toEqual([]);
  });

  it("hex enables bonus damage for punish", () => {
    const hex = hexCardDefinition();
    const punish = punishCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 20 }
    }));

    const hexed = playCard({ ...combat, hand: [hex], exhaustPile: [] }, hex).combat;
    const punished = playCard({ ...hexed, hand: [punish] }, punish).combat;

    expect(hexed.enemy.hex).toBe(1);
    expect(punished.enemy.health).toBe(10);
  });

  it("burnout deals more damage if a card has been exhausted", () => {
    const surge = surgeCardDefinition();
    const burnout = burnoutCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 20 }
    }));

    const surged = playCard({ ...combat, hand: [surge], exhaustPile: [] }, surge).combat;
    const burned = playCard({ ...surged, hand: [burnout] }, burnout).combat;

    expect(burned.enemy.health).toBe(8);
  });

  it("crackdown is a stronger payoff against hexed enemies", () => {
    const hex = hexCardDefinition();
    const crackdown = crackdownCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 25 }
    }));

    const hexed = playCard({ ...combat, hand: [hex], exhaustPile: [] }, hex).combat;
    const cracked = playCard({ ...hexed, hand: [crackdown] }, crackdown).combat;

    expect(cracked.enemy.health).toBe(11);
  });

  it("momentum rewards having extra energy available", () => {
    const momentum = momentumCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 20 }
    }));

    const played = playCard({ ...combat, hand: [momentum] }, momentum).combat;

    expect(played.player.block).toBe(7);
  });
});

describe("charged mechanic", () => {
  it("charge_up sets player.charged to true", () => {
    const chargeUp = chargeUpCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 20 }
    }));
    const withHand = { ...combat, hand: [chargeUp], player: { ...combat.player, charged: false } };

    const result = playCard(withHand, chargeUp);

    expect(result.rejected).toBe(false);
    expect(result.combat.player.charged).toBe(true);
  });

  it("arc_lash draws only when charged", () => {
    const arcLash = arcLashCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 30 }
    }));
    const withHand = { ...combat, hand: [arcLash], player: { ...combat.player, charged: false } };

    const result = playCard(withHand, arcLash);

    // drawCount accumulates via effect but the node-based playCard does not execute draw mechanics
    // The effect sets drawCount; the actual draw happens downstream in the node/browser layer
    // Here we just confirm the effect fires (health decreases) and drawCount when uncharged stays 0
    expect(result.combat.enemy.health).toBeLessThan(30);
    expect(result.combat.drawCount || 0).toBe(0);
  });

  it("arc_lash increments drawCount when charged", () => {
    const arcLash = arcLashCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 30 }
    }));
    const charged = { ...combat, hand: [arcLash], player: { ...combat.player, charged: true }, drawCount: 0 };

    const result = playCard(charged, arcLash);

    expect(result.combat.drawCount).toBe(1);
  });
});

describe("exhaustedThisTurn counter", () => {
  it("grave_fuel gains energy from exhaustedThisTurn capped at MAX_EXHAUST_ENERGY_PER_TURN", () => {
    const graveFuel = graveFuelCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 20 }
    }));
    const withHand = {
      ...combat,
      hand: [graveFuel],
      exhaustedThisTurn: 3,
      player: { ...combat.player, energy: 1 }
    };

    const result = playCard(withHand, graveFuel);

    expect(result.rejected).toBe(false);
    // Started with 1 energy, spent 1 on grave_fuel, gained 2 from exhaustedThisTurn (capped at 2)
    expect(result.combat.player.energy).toBe(2);
  });

  it("blood_pact applies self-damage and grants energy", () => {
    const bloodPact = bloodPactCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 20 }
    }));
    const withHand = { ...combat, hand: [bloodPact], player: { ...combat.player, energy: 0 } };

    const result = playCard(withHand, bloodPact);

    expect(result.rejected).toBe(false);
    expect(result.combat.player.health).toBe(77); // 80 - 3 self-damage
    expect(result.combat.player.energy).toBe(2); // 0 - 0 cost + 2 energy gain
  });

  it("harvester deals bonus damage vs hexed and vs exhausted this turn", () => {
    const harvester = harvesterCardDefinition();
    const combat = startPlayerTurn(createCombatEncounter({
      player: { health: 80 },
      enemy: { id: "slime", health: 30 }
    }));
    const hexedAndExhausted = {
      ...combat,
      hand: [harvester],
      enemy: { ...combat.enemy, hex: 1 },
      exhaustedThisTurn: 1
    };

    const result = playCard(hexedAndExhausted, harvester);

    // 4 base + 4 hex bonus + 4 exhaust bonus = 12
    expect(result.combat.enemy.health).toBe(30 - 12);
  });
});
