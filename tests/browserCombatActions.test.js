const { createBrowserRun, chooseArchetype } = require("../src/browserRunActions");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");
const { createCardCatalog } = require("../src/cardCatalog");

const CARD_CATALOG = createCardCatalog();

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

  it("ticks poison on the enemy at end of turn and decrements the stack", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, combatNode);
    const venomStrike = { ...CARD_CATALOG.venom_strike };
    combat.hand = [venomStrike];
    combat.player.energy = 3;
    combat.enemyIntent = { type: "block", value: 0, label: "Wait" };

    const afterPlay = playCombatCard({ ...run, combat }, 0);
    expect(afterPlay.combat.enemy.poison).toBe(2);

    const afterTurn = endCombatTurn(afterPlay);
    expect(afterTurn.combat.enemy.poison).toBe(1);
    expect(afterTurn.combat.enemy.health).toBeLessThan(afterPlay.combat.enemy.health);
  });

  it("ticks burn on the enemy at turn start without decrementing the stack", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, combatNode);
    const emberThrow = { ...CARD_CATALOG.ember_throw };
    combat.hand = [emberThrow];
    combat.player.energy = 3;
    combat.enemyIntent = { type: "block", value: 0, label: "Wait" };

    const afterPlay = playCombatCard({ ...run, combat }, 0);
    expect(afterPlay.combat.enemy.burn).toBe(2);

    const afterTurn = endCombatTurn(afterPlay);
    expect(afterTurn.combat.enemy.burn).toBe(2);
    expect(afterTurn.combat.enemy.health).toBeLessThan(afterPlay.combat.enemy.health);
  });

  it("clamps poison and burn stacks to the configured cap", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, combatNode);
    const toxicCloud = { ...CARD_CATALOG.toxic_cloud };
    combat.hand = [toxicCloud];
    combat.player.energy = 3;
    combat.enemy.poison = 9;
    combat.enemy.burn = 9;
    combat.enemyIntent = { type: "debuff_burn", value: 3, label: "Scorch" };

    const afterPlay = playCombatCard({ ...run, combat }, 0);
    expect(afterPlay.combat.enemy.poison).toBe(10);

    const afterTurn = endCombatTurn(afterPlay);
    expect(afterTurn.combat.player.burn).toBe(3);
    expect(afterTurn.combat.enemy.poison).toBeLessThanOrEqual(10);
  });
});
