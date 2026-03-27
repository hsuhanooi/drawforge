const { createBrowserRun } = require("../src/browserRunActions");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");

describe("browser combat actions", () => {
  const combatNode = { id: "r0c0", row: 0, col: 0, type: "combat", next: [] };

  it("starts combat from shared actions", () => {
    const run = createBrowserRun();
    const combat = startCombatForNode(run, combatNode);

    expect(combat.turn).toBe("player");
    expect(combat.hand.length).toBeGreaterThan(0);
    expect(combat.enemy.name).toBeDefined();
  });

  it("plays a combat card through the shared action", () => {
    const run = createBrowserRun();
    const combat = startCombatForNode(run, combatNode);
    const nextRun = playCombatCard({ ...run, combat }, 0);

    expect(nextRun.combat.player.energy).toBeLessThan(combat.player.energy);
    expect(nextRun.player.health).toBe(nextRun.combat.player.health);
    expect(nextRun.combat.discardPile.length + (nextRun.combat.exhaustPile || []).length).toBeGreaterThan(0);
  });

  it("resolves end turn through the shared action", () => {
    const run = createBrowserRun();
    const combat = startCombatForNode(run, combatNode);
    const nextRun = endCombatTurn({ ...run, combat });

    expect(nextRun.combat.turn).toBe("player");
    expect(nextRun.player.health).toBe(nextRun.combat.player.health);
  });
});
