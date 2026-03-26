const { createCombatEncounter } = require("../src/combat");
const { startPlayerTurn } = require("../src/energy");
const { playCard } = require("../src/playCard");
const {
  surgeCardDefinition,
  hexCardDefinition,
  punishCardDefinition
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
});
