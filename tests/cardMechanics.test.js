const { createCombatEncounter } = require("../src/combat");
const { startPlayerTurn } = require("../src/energy");
const { playCard } = require("../src/playCard");
const {
  surgeCardDefinition,
  hexCardDefinition,
  punishCardDefinition,
  burnoutCardDefinition,
  crackdownCardDefinition,
  momentumCardDefinition
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
