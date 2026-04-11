const { executeCardEffect } = require("../src/combatEngine");
const { plagueBurstCardDefinition, toxicBarrageCardDefinition, contagionCardDefinition } = require("../src/cards");
const { toRenderableCard } = require("../src/cardCatalog");
const { MAX_POISON_STACKS } = require("../src/constants");
const { createVictoryCardRewards } = require("../src/rewards");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");

const makeNode = () => ({ id: "r0c0", row: 0, col: 0, type: "combat", next: [] });
const makeRun = (deck = ["strike", "defend"]) => ({
  player: { health: 80, maxHealth: 80, deck, gold: 50 },
  relics: [],
  phoenix_used: false,
  archetype: "poison_vanguard"
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

describe("poison depth task", () => {
  it("plague burst consumes poison and adds bonus damage in the runtime effect", () => {
    const next = executeCardEffect(plagueBurstCardDefinition(), {
      player: { health: 80, block: 0, strength: 0, weak: 0 },
      enemy: { health: 40, block: 0, poison: 4, vulnerable: 0 }
    });

    expect(next.enemy.health).toBe(23);
    expect(next.enemy.poison).toBe(0);
  });

  it("toxic barrage hits three times and applies poison per hit", () => {
    const next = executeCardEffect(toxicBarrageCardDefinition(), {
      player: { health: 80, block: 0, strength: 0, weak: 0 },
      enemy: { health: 30, block: 4, poison: 0, vulnerable: 0 }
    });

    expect(next.enemy.health).toBe(25);
    expect(next.enemy.block).toBe(0);
    expect(next.enemy.poison).toBe(3);
  });

  it("contagion doubles poison and respects the cap", () => {
    const next = executeCardEffect(contagionCardDefinition(), {
      player: { health: 80, block: 0 },
      enemy: { health: 30, block: 0, poison: MAX_POISON_STACKS - 1 }
    });

    expect(next.enemy.poison).toBe(MAX_POISON_STACKS);
  });

  it("virulent aura applies poison at the start of each player turn", () => {
    let run = startCombat();
    run = injectHand(run, ["virulent_aura"]);
    run.combat.player.energy = 3;
    run.combat.enemyIntent = { type: "block", value: 0, label: "Wait" };

    const afterPlay = playCard(run, "virulent_aura");
    const afterTurn = endCombatTurn(afterPlay);

    expect(afterTurn.combat.enemy.poison).toBe(1);
    expect(afterTurn.combat.powers.some((power) => power.id === "virulent_aura")).toBe(true);
  });

  it("fetid wound combines damage, poison, and block in combat", () => {
    let run = startCombat();
    run = injectHand(run, ["fetid_wound"]);
    run.combat.player.energy = 3;
    const enemyHpBefore = run.combat.enemy.health;

    const afterPlay = playCard(run, "fetid_wound");

    expect(afterPlay.combat.enemy.health).toBe(enemyHpBefore - 4);
    expect(afterPlay.combat.enemy.poison).toBe(2);
    expect(afterPlay.combat.player.block).toBeGreaterThanOrEqual(3);
  });

  it("poison-vanguard rewards can surface the new poison-depth cards", () => {
    const seen = new Set();
    for (let i = 0; i < 40; i += 1) {
      for (const card of createVictoryCardRewards("combat", { act: 1, relics: [], archetype: "poison_vanguard" })) {
        seen.add(card.id);
      }
    }

    expect(seen.has("plague_burst") || seen.has("toxic_barrage") || seen.has("contagion") || seen.has("fetid_wound")).toBe(true);
  });
});
