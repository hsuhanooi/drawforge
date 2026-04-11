const { MAX_POISON_STACKS, MAX_BURN_STACKS } = require("../src/constants");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");
const { toRenderableCard } = require("../src/cardCatalog");
const { createEnemyForNode } = require("../src/enemies");
const { IMPLEMENTED_CARD_IDS } = require("../src/cardRegistry");

const makeNode = (type = "combat") => ({ id: "r0c0", row: 0, col: 0, type, next: [] });
const makeRun = (deck = ["strike", "defend"]) => ({
  player: { health: 80, maxHealth: 80, deck, gold: 50 },
  relics: [],
  phoenix_used: false
});

const startCombat = (run, node = makeNode()) => ({ ...run, combat: startCombatForNode(run, node) });
const injectHand = (run, cards) => ({
  ...run,
  combat: {
    ...run.combat,
    hand: cards.map((id) => toRenderableCard(id)),
    drawPile: []
  }
});
const playCard = (run, cardId) => {
  const idx = run.combat.hand.findIndex((card) => card.id === cardId);
  if (idx === -1) throw new Error(`Card ${cardId} not in hand`);
  return playCombatCard(run, idx);
};

describe("poison and burn statuses", () => {
  it("poison deals damage at end of player turn and decays by 1", () => {
    const run = startCombat(makeRun());
    run.combat.enemy.poison = 3;
    const enemyHpBefore = run.combat.enemy.health;

    const result = endCombatTurn(run);

    expect(result.combat.enemy.health).toBe(enemyHpBefore - 3);
    expect(result.combat.enemy.poison).toBe(2);
  });

  it("burn deals damage at start of enemy turn without decaying", () => {
    const run = startCombat(makeRun());
    run.combat.enemy.burn = 2;
    const enemyHpBefore = run.combat.enemy.health;

    const result = endCombatTurn(run);

    expect(result.combat.enemy.health).toBe(enemyHpBefore - 2);
    expect(result.combat.enemy.burn).toBe(2);
  });

  it("clamps poison and burn stacks at the configured cap", () => {
    let run = startCombat(makeRun());
    run = injectHand(run, ["toxic_cloud", "toxic_cloud", "kindle", "kindle"]);

    run.combat.enemy.poison = MAX_POISON_STACKS - 1;
    run.combat.enemy.burn = MAX_BURN_STACKS - 1;

    run = playCard(run, "toxic_cloud");
    run = playCard(run, "kindle");

    expect(run.combat.enemy.poison).toBe(MAX_POISON_STACKS);
    expect(run.combat.enemy.burn).toBe(MAX_BURN_STACKS);
  });

  it("new poison and burn cards apply their statuses through combat actions", () => {
    let run = startCombat(makeRun());
    run = injectHand(run, ["venom_strike", "ember_throw"]);
    const enemyHpBefore = run.combat.enemy.health;

    run = playCard(run, "venom_strike");
    run = playCard(run, "ember_throw");

    expect(run.combat.enemy.health).toBe(enemyHpBefore - 10);
    expect(run.combat.enemy.poison).toBe(2);
    expect(run.combat.enemy.burn).toBe(2);
  });

  it("tracks the new poison and burn enemy intent paths", () => {
    const plagueRat = createEnemyForNode({ id: "r5c0", row: 5, col: 0, type: "combat" });
    const cinderShade = createEnemyForNode({ id: "r6c0", row: 6, col: 0, type: "combat" });
    const venomfang = createEnemyForNode({ id: "r7c0", row: 7, col: 0, type: "combat" });

    expect(plagueRat.id).toBe("plague_rat");
    expect(plagueRat.intents[0].type).toBe("debuff_poison");
    expect(cinderShade.id).toBe("cinder_shade");
    expect(cinderShade.intents[0].type).toBe("debuff_burn");
    expect(venomfang.id).toBe("venomfang");
    expect(venomfang.intents[0].type).toBe("attack_poison");
  });

  it("marks the run lost when start-of-turn status damage drops the player to zero", () => {
    const run = startCombat(makeRun());
    run.combat.player.health = 2;
    run.combat.player.burn = 2;
    run.combat.enemyIntent = { type: "block", value: 5, label: "Harden" };

    const result = endCombatTurn(run);

    expect(result.state).toBe("lost");
    expect(result.player.health).toBe(0);
    expect(result.combat.state).toBe("defeat");
    expect(result.combat.turn).toBeNull();
  });

  it("registers all new poison and burn cards as implemented", () => {
    for (const id of [
      "venom_strike",
      "toxic_cloud",
      "creeping_blight",
      "septic_touch",
      "infectious_wound",
      "ember_throw",
      "kindle",
      "scorch",
      "funeral_pyre",
      "smoldering_brand"
    ]) {
      expect(IMPLEMENTED_CARD_IDS).toContain(id);
    }
  });
});
