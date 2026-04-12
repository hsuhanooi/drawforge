const { startCombatForNode, playCombatCard } = require("../src/browserCombatActions");
const { CARD_REGISTRY } = require("../src/cardRegistry");
const cards = require("../src/cards");

const makeRun = (relicIds = []) => ({
  player: {
    health: 80,
    maxHealth: 80,
    gold: 0,
    deck: ["strike", "strike", "defend", "defend", "strike"],
    relics: relicIds.map((id) => ({ id, name: id }))
  },
  relics: relicIds.map((id) => ({ id, name: id })),
  phoenix_used: false,
  combatsWon: 0
});

const node = { id: "r1c0", row: 1, col: 0, type: "combat" };

// Build a run with a 2-enemy encounter by forcing enemies
const makeMultiEnemyRun = () => {
  const run = makeRun();
  return run;
};

const forceMultiEnemyCombat = (run) => {
  const combat = startCombatForNode(run, node);
  const enemy1 = { ...combat.enemy, id: "goblin_1", name: "Goblin", health: 20, maxHealth: 20, block: 0 };
  const enemy2 = { id: "goblin_2", name: "Goblin B", health: 15, maxHealth: 15, block: 0 };
  return {
    ...combat,
    enemy: enemy1,
    enemies: [enemy1, enemy2],
    targetIndex: 0,
    hand: [
      { id: "whirlwind", name: "Whirlwind", cost: 2, type: "attack", damage: 5, targetAll: true },
      { id: "plague_wave", name: "Plague Wave", cost: 2, type: "skill", applyPoison: 2, targetAll: true },
      { id: "chain_lightning", name: "Chain Lightning", cost: 2, type: "attack", damage: 4, targetAll: true, bonusDmgIfCharged: 3 },
      { id: "strike", name: "Strike", cost: 1, type: "attack", damage: 6 }
    ]
  };
};

describe("AoE cards", () => {
  it("whirlwind reduces all enemies' HP in a 2-enemy encounter", () => {
    const run = makeMultiEnemyRun();
    const combat = forceMultiEnemyCombat(run);
    const result = playCombatCard({ ...run, combat }, 0); // whirlwind
    const enemies = result.combat.enemies;
    expect(enemies[0].health).toBe(15); // 20 - 5
    expect(enemies[1].health).toBe(10); // 15 - 5
  });

  it("each enemy's block absorbs whirlwind damage individually", () => {
    const run = makeMultiEnemyRun();
    let combat = forceMultiEnemyCombat(run);
    combat = {
      ...combat,
      enemy: { ...combat.enemy, health: 20, block: 3 },
      enemies: [
        { ...combat.enemies[0], health: 20, block: 3 },
        { ...combat.enemies[1], health: 15, block: 7 }
      ]
    };
    const result = playCombatCard({ ...run, combat }, 0); // whirlwind (damage 5)
    const enemies = result.combat.enemies;
    // Enemy 0: block 3, dmg 5 → net 2, hp 20-2=18
    expect(enemies[0].health).toBe(18);
    // Enemy 1: block 7 >= 5, fully blocked, hp 15-0=15
    expect(enemies[1].health).toBe(15);
  });

  it("plague_wave applies Poison 2 to all enemies", () => {
    const run = makeMultiEnemyRun();
    const combat = forceMultiEnemyCombat(run);
    const result = playCombatCard({ ...run, combat }, 1); // plague_wave
    const enemies = result.combat.enemies;
    expect(enemies[0].poison).toBe(2);
    expect(enemies[1].poison).toBe(2);
  });

  it("single-enemy encounter: AoE card behaves identically to single-target", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, node);
    // Force a whirlwind in hand
    const testCombat = {
      ...combat,
      hand: [
        { id: "whirlwind", name: "Whirlwind", cost: 2, type: "attack", damage: 5, targetAll: true },
        ...combat.hand.slice(1)
      ],
      player: { ...combat.player, energy: 3 }
    };
    const hpBefore = testCombat.enemy.health;
    const result = playCombatCard({ ...run, combat: testCombat }, 0);
    expect(result.combat.enemy.health).toBe(hpBefore - 5);
  });

  it("AoE cards are exported from cards.js and in CARD_REGISTRY", () => {
    expect(typeof cards.whirlwindCardDefinition).toBe("function");
    expect(typeof cards.chainLightningCardDefinition).toBe("function");
    expect(typeof cards.plagueWaveCardDefinition).toBe("function");
    const ids = CARD_REGISTRY.map(c => c.id);
    expect(ids).toContain("whirlwind");
    expect(ids).toContain("chain_lightning");
    expect(ids).toContain("plague_wave");
  });
});
