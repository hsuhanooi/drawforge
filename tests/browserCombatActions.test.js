const { createBrowserRun, chooseArchetype } = require("../src/browserRunActions");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");

describe("browser combat actions", () => {
  const combatNode = { id: "r0c0", row: 0, col: 0, type: "combat", next: [] };
  const makeRun = () => chooseArchetype(createBrowserRun(), "hex_witch");

  it("starts combat from shared actions", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, combatNode);

    expect(combat.turn).toBe("player");
    expect(combat.hand.length).toBeGreaterThan(0);
    expect(combat.enemy.name).toBeDefined();
    expect(combat.combatLog?.[0]?.text).toContain("Combat started against");
  });

  it("plays a combat card through the shared action", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, combatNode);
    const playedCard = combat.hand[0];
    const nextRun = playCombatCard({ ...run, combat }, 0);

    expect(nextRun.combat.hand.length).toBeLessThanOrEqual(combat.hand.length);
    expect(nextRun.player.health).toBe(nextRun.combat.player.health);
    expect(nextRun.combat.discardPile.length + (nextRun.combat.exhaustPile || []).length).toBeGreaterThan(0);
    expect(nextRun.combat.combatLog?.at(-1)?.text).toContain(playedCard.name);
    if ((playedCard.cost || 0) > 0) {
      expect(nextRun.combat.player.energy).toBeLessThan(combat.player.energy);
    } else {
      expect(nextRun.combat.player.energy).toBe(combat.player.energy);
    }
  });

  it("resolves end turn through the shared action", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, combatNode);
    const nextRun = endCombatTurn({ ...run, combat });

    expect(nextRun.combat.turn).toBe("player");
    expect(nextRun.player.health).toBe(nextRun.combat.player.health);
    expect(nextRun.combat.combatLog?.at(-1)?.text).toBeTruthy();
  });
});
