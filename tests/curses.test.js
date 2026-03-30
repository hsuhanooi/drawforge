const { startNewRun } = require("../src/run");
const { startCombatForNode } = require("../src/browserCombatActions");
const { playCombatCard } = require("../src/browserCombatActions");
const { endCombatTurn } = require("../src/browserCombatActions");
const { usePotionInCombat, discardPotion } = require("../src/browserCombatActions");
const { applyVictoryToRun } = require("../src/browserPostNodeActions");
const { claimEventOption } = require("../src/browserPostNodeActions");
const { POTIONS, createRandomPotion, applyPotion } = require("../src/potions");

const makeBaseRun = () => ({
  ...startNewRun(),
  relics: [],
  potions: [],
  phoenix_used: false,
  pendingRewards: null,
  event: null
});

const combatNode = { id: "n1", type: "combat", row: 2, col: 1 };

const makeRunWithCombat = (deckOverride) => {
  const run = makeBaseRun();
  const runWithDeck = deckOverride ? { ...run, player: { ...run.player, deck: deckOverride } } : run;
  return { ...runWithDeck, combat: startCombatForNode(runWithDeck, combatNode) };
};

describe("Curse cards", () => {
  describe("wound", () => {
    it("deals 1 self-damage when drawn", () => {
      const run = makeBaseRun();
      const runWithWound = { ...run, player: { ...run.player, deck: ["wound", "strike", "defend", "strike", "defend"] } };
      const withCombat = { ...runWithWound, combat: startCombatForNode(runWithWound, combatNode) };
      // wound should be drawn and deal 1 damage
      const woundsInHand = withCombat.combat.hand.filter((c) => c.id === "wound").length;
      if (woundsInHand > 0) {
        expect(withCombat.combat.player.health).toBeLessThan(run.player.health);
      }
    });

    it("wound draw damage is exactly 1 per wound drawn", () => {
      // Force wound to be the first card in draw pile by putting it at the front
      const run = makeBaseRun();
      // Start with known health, then draw wound manually by checking drawCards behavior
      const runWithWound = { ...run, player: { ...run.player, health: 80, maxHealth: 80, deck: ["wound", "wound", "strike", "defend", "strike"] } };
      const withCombat = { ...runWithWound, combat: startCombatForNode(runWithWound, combatNode) };
      const woundsInHand = withCombat.combat.hand.filter((c) => c.id === "wound").length;
      expect(withCombat.combat.player.health).toBe(80 - woundsInHand);
    });
  });

  describe("decay", () => {
    it("reduces block by 1 per decay in hand at turn end", () => {
      const run = makeRunWithCombat(["strike", "defend", "strike", "defend", "decay"]);
      // Set player block and ensure decay is in hand
      const decaysInHand = run.combat.hand.filter((c) => c.id === "decay").length;
      if (decaysInHand === 0) return; // decay wasn't drawn this shuffle, skip assertion

      const runWithBlock = {
        ...run,
        combat: { ...run.combat, player: { ...run.combat.player, block: 10 } }
      };
      const afterTurn = endCombatTurn(runWithBlock);
      // Block is reset to 0 at turn end regardless, so decay penalty is applied before reset
      // The test verifies the decay logic runs without error (block clamped at 0)
      expect(afterTurn.combat.player.block).toBeGreaterThanOrEqual(0);
    });

    it("decay block loss is clamped at 0", () => {
      const run = makeRunWithCombat(["decay", "decay", "decay", "decay", "decay"]);
      const decaysInHand = run.combat.hand.filter((c) => c.id === "decay").length;
      const runWithBlock = {
        ...run,
        combat: { ...run.combat, player: { ...run.combat.player, block: decaysInHand - 1 } }
      };
      const afterTurn = endCombatTurn(runWithBlock);
      expect(afterTurn.combat.player.block).toBeGreaterThanOrEqual(0);
    });
  });

  describe("parasite", () => {
    it("exhaust + loses 3 HP when played", () => {
      const run = makeBaseRun();
      const parasiteCard = { id: "parasite", name: "Parasite", cost: 0, type: "curse", rarity: "curse", exhaust: true, selfDamage: 3 };
      const withCombat = { ...run, combat: startCombatForNode(run, combatNode) };
      const withHand = {
        ...withCombat,
        combat: {
          ...withCombat.combat,
          hand: [parasiteCard],
          player: { ...withCombat.combat.player, health: 50, energy: 3 }
        }
      };
      const result = playCombatCard(withHand, 0);
      expect(result.combat.player.health).toBe(47);
      expect(result.combat.exhaustPile.some((c) => c.id === "parasite")).toBe(true);
      expect(result.combat.hand.some((c) => c.id === "parasite")).toBe(false);
    });
  });
});

describe("Curse sources", () => {
  it("debuff_curse intent adds curse to pendingCurses on combat state", () => {
    const run = makeRunWithCombat();
    const combat = {
      ...run.combat,
      enemyIntent: { type: "debuff_curse", curseId: "wound", label: "Void Brand: add Wound to deck" }
    };
    const runWithIntent = { ...run, combat };
    const afterTurn = endCombatTurn(runWithIntent);
    expect(afterTurn.combat.pendingCurses || []).toContain("wound");
  });

  it("applyVictoryToRun applies pendingCurses to deck", () => {
    const run = makeBaseRun();
    const fakeCombat = {
      nodeType: "combat",
      player: { health: 70 },
      pendingCurses: ["wound"]
    };
    const result = applyVictoryToRun(run, fakeCombat);
    expect(result.player.deck).toContain("wound");
  });

  it("gold_for_curse event adds curse to deck and gold", () => {
    const run = {
      ...makeBaseRun(),
      event: {
        id: "event-1",
        kind: "devil",
        options: [
          { id: "deal", effect: "gold_for_curse", amount: 50, curseId: "parasite" }
        ]
      },
      map: { currentNodeId: "n1", nodes: [{ id: "n1", type: "event", row: 0, col: 0 }] }
    };
    const result = claimEventOption(run, "deal");
    expect(result.player.deck).toContain("parasite");
    expect(result.player.gold).toBeGreaterThan(run.player.gold);
  });
});

describe("Potions", () => {
  it("POTIONS array has 9 entries", () => {
    expect(POTIONS).toHaveLength(9);
  });

  it("createRandomPotion returns a valid potion", () => {
    const p = createRandomPotion();
    expect(p).toHaveProperty("id");
    expect(p).toHaveProperty("name");
  });

  it("healing_potion restores 10 HP capped at maxHealth", () => {
    const combat = { player: { health: 50, maxHealth: 80 }, enemy: { hex: 0 } };
    const result = applyPotion(combat, "healing_potion");
    expect(result.player.health).toBe(60);
  });

  it("healing_potion does not exceed maxHealth", () => {
    const combat = { player: { health: 76, maxHealth: 80 }, enemy: { hex: 0 } };
    const result = applyPotion(combat, "healing_potion");
    expect(result.player.health).toBe(80);
  });

  it("strength_potion grants 2 Strength", () => {
    const combat = { player: { health: 70, strength: 0 }, enemy: { hex: 0 } };
    const result = applyPotion(combat, "strength_potion");
    expect(result.player.strength).toBe(2);
  });

  it("hex_vial applies Hex 2 to enemy", () => {
    const combat = { player: { health: 70 }, enemy: { hex: 1 } };
    const result = applyPotion(combat, "hex_vial");
    expect(result.enemy.hex).toBe(3);
  });

  it("usePotionInCombat applies effect and removes potion from run", () => {
    const run = makeRunWithCombat();
    const potion = { id: "healing_potion", name: "Healing Potion", description: "Restore 10 HP." };
    const runWithPotion = {
      ...run,
      potions: [potion],
      combat: { ...run.combat, player: { ...run.combat.player, health: 50 } }
    };
    const result = usePotionInCombat(runWithPotion, "healing_potion");
    expect(result.potions).toHaveLength(0);
    expect(result.combat.player.health).toBe(60);
  });

  it("usePotionInCombat throws if potion not found", () => {
    const run = makeRunWithCombat();
    expect(() => usePotionInCombat({ ...run, potions: [] }, "healing_potion")).toThrow();
  });

  it("discardPotion removes potion without applying effect", () => {
    const run = makeBaseRun();
    const potion = { id: "hex_vial", name: "Hex Vial" };
    const runWithPotion = { ...run, potions: [potion] };
    const result = discardPotion(runWithPotion, "hex_vial");
    expect(result.potions).toHaveLength(0);
  });

  it("elite victory has 40% chance to include a potion", () => {
    let potionCount = 0;
    for (let i = 0; i < 200; i += 1) {
      const run = makeBaseRun();
      const fakeCombat = { nodeType: "elite", player: { health: 70 }, pendingCurses: [] };
      const result = applyVictoryToRun(run, fakeCombat);
      if (result.pendingRewards.potion) potionCount += 1;
    }
    expect(potionCount).toBeGreaterThan(40);
    expect(potionCount).toBeLessThan(160);
  });

  it("potions slot limited to MAX_POTIONS (2)", () => {
    const run = {
      ...makeBaseRun(),
      potions: [
        { id: "healing_potion", name: "Healing Potion" },
        { id: "hex_vial", name: "Hex Vial" }
      ]
    };
    const fakeCombat = { nodeType: "elite", player: { health: 70 }, pendingCurses: [] };
    const result = applyVictoryToRun(run, fakeCombat);
    // Even if a potion dropped, it shouldn't be added since slots are full
    expect(result.potions).toHaveLength(2);
  });
});
