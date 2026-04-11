const { executeCardEffect } = require("../src/combatEngine");
const {
  immolateCardDefinition,
  backdraftCardDefinition,
  flashFireCardDefinition
} = require("../src/cards");
const { toRenderableCard } = require("../src/cardCatalog");
const { MAX_BURN_STACKS } = require("../src/constants");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");

const makeNode = () => ({ id: "r0c0", row: 0, col: 0, type: "combat", next: [] });
const makeRun = (deck = ["strike", "defend"]) => ({
  player: { health: 80, maxHealth: 80, deck, gold: 50 },
  relics: [],
  phoenix_used: false,
  archetype: "ashen_knight"
});

const startCombat = (run = makeRun()) => ({ ...run, combat: startCombatForNode(run, makeNode()) });
const injectHand = (run, cards) => ({
  ...run,
  combat: {
    ...run.combat,
    hand: cards.map((id) => toRenderableCard(id)),
    drawPile: []
  }
});
const playCard = (run, cardId) => playCombatCard(run, run.combat.hand.findIndex((card) => card.id === cardId));

describe("burn depth task", () => {
  it("immolate consumes burn and adds burst damage in the runtime effect", () => {
    const next = executeCardEffect(immolateCardDefinition(), {
      player: { health: 80, block: 0, strength: 0, weak: 0 },
      enemy: { health: 40, block: 0, burn: 4, vulnerable: 0 }
    });

    expect(next.enemy.health).toBe(22);
    expect(next.enemy.burn).toBe(0);
  });

  it("backdraft scales damage with burn stacks", () => {
    const next = executeCardEffect(backdraftCardDefinition(), {
      player: { health: 80, block: 0, strength: 0, weak: 0 },
      enemy: { health: 40, block: 0, burn: 3, vulnerable: 0 }
    });

    expect(next.enemy.health).toBe(30);
  });

  it("heat shield gains block from enemy burn in combat", () => {
    let run = startCombat();
    run = injectHand(run, ["heat_shield"]);
    run.combat.player.energy = 3;
    run.combat.enemy.burn = 3;

    const afterPlay = playCard(run, "heat_shield");

    expect(afterPlay.combat.player.block).toBeGreaterThanOrEqual(10);
  });

  it("inferno aura applies burn at the start of each player turn", () => {
    let run = startCombat();
    run = injectHand(run, ["inferno_aura"]);
    run.combat.player.energy = 3;
    run.combat.enemyIntent = { type: "block", value: 0, label: "Wait" };

    const afterPlay = playCard(run, "inferno_aura");
    const afterTurn = endCombatTurn(afterPlay);

    expect(afterTurn.combat.enemy.burn).toBe(1);
    expect(afterTurn.combat.powers.some((power) => power.id === "inferno_aura")).toBe(true);
  });

  it("flash fire applies burn, draws, and exhausts in the runtime effect", () => {
    const next = executeCardEffect(flashFireCardDefinition(), {
      player: { health: 80, block: 0, energy: 3 },
      enemy: { health: 40, block: 0, burn: 0 }
    });

    expect(next.enemy.burn).toBe(2);
    expect(next.drawCount).toBe(1);
  });

  it("burn cap remains 20 for the burn finisher cards", () => {
    expect(MAX_BURN_STACKS).toBe(20);
  });
});
