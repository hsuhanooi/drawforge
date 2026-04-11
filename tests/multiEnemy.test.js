const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");

const makeRun = (deck = ["strike", "strike", "strike", "strike", "strike"]) => ({
  player: { health: 80, maxHealth: 80, gold: 0, deck },
  relics: [],
  phoenix_used: false,
  combatsWon: 0,
  stats: {}
});

const singleNode = () => ({ id: "r1c0", row: 1, col: 0, type: "combat" });

// Inject a second enemy into an already-started combat to simulate a two-enemy encounter
const injectSecondEnemy = (run) => {
  const secondEnemy = {
    id: "slime_b",
    name: "Slime B",
    health: 20,
    maxHp: 20,
    damage: 5,
    block: 0,
    hex: 0,
    poison: 0,
    burn: 0,
    weak: 0,
    vulnerable: 0,
    turnIndex: 0,
    intents: [{ type: "attack", value: 5, label: "Slam for 5" }]
  };
  return {
    ...run,
    combat: {
      ...run.combat,
      enemies: [...run.combat.enemies, secondEnemy],
      targetIndex: 0
    }
  };
};

describe("multi-enemy combat state", () => {
  it("single-enemy startCombatForNode produces enemies array of length 1", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, singleNode());
    expect(combat.enemies).toBeDefined();
    expect(combat.enemies.length).toBe(1);
    expect(combat.targetIndex).toBe(0);
    expect(combat.enemy).toEqual(combat.enemies[0]);
  });

  it("enemies[0] and enemy alias are the same object data", () => {
    const run = makeRun();
    const combat = startCombatForNode(run, singleNode());
    expect(combat.enemy.id).toBe(combat.enemies[0].id);
    expect(combat.enemy.health).toBe(combat.enemies[0].health);
  });

  it("two-enemy combat has enemies.length === 2", () => {
    const run = injectSecondEnemy({ ...makeRun(), combat: startCombatForNode(makeRun(), singleNode()) });
    expect(run.combat.enemies.length).toBe(2);
  });

  it("single-target card damages only enemies[targetIndex], not the other enemy", () => {
    const baseRun = makeRun();
    const started = { ...baseRun, combat: startCombatForNode(baseRun, singleNode()) };
    const run = injectSecondEnemy(started);
    const hp0Before = run.combat.enemies[0].health;
    const hp1Before = run.combat.enemies[1].health;
    const idx = run.combat.hand.findIndex((c) => c.id === "strike");
    const run2 = playCombatCard(run, idx);
    // targeted enemy (index 0) should take damage
    expect(run2.combat.enemies[0].health).toBeLessThan(hp0Before);
    // non-targeted enemy (index 1) should be untouched
    expect(run2.combat.enemies[1].health).toBe(hp1Before);
  });

  it("killing targeted enemy leaves the other alive; combat stays active", () => {
    const baseRun = makeRun(["heavy_swing", "strike", "strike", "strike", "strike"]);
    const started = { ...baseRun, combat: startCombatForNode(baseRun, singleNode()) };
    const run = injectSecondEnemy(started);
    // Force enemy[0] to 1 HP so one strike kills it
    const weakenedRun = {
      ...run,
      combat: {
        ...run.combat,
        enemies: run.combat.enemies.map((e, i) => (i === 0 ? { ...e, health: 1 } : e)),
        enemy: { ...run.combat.enemies[0], health: 1 }
      }
    };
    const idx = weakenedRun.combat.hand.findIndex((c) => c.id === "strike" || c.id === "heavy_swing");
    const run2 = playCombatCard(weakenedRun, idx);
    // First enemy dead
    expect(run2.combat.enemies[0].health).toBe(0);
    // Second enemy alive
    expect(run2.combat.enemies[1].health).toBeGreaterThan(0);
    // Combat still active (second enemy alive)
    expect(run2.combat.state).toBe("active");
  });

  it("victory triggers only when ALL enemies reach 0 HP", () => {
    const baseRun = makeRun(["strike", "strike", "strike", "strike", "strike"]);
    const started = { ...baseRun, combat: startCombatForNode(baseRun, singleNode()) };
    const run = injectSecondEnemy(started);
    // Kill both enemies in the enemies array
    const allDeadRun = {
      ...run,
      combat: {
        ...run.combat,
        enemies: run.combat.enemies.map((e) => ({ ...e, health: 1 })),
        enemy: { ...run.combat.enemies[0], health: 1 }
      }
    };
    const idx = allDeadRun.combat.hand.findIndex((c) => c.id === "strike");
    // Only kills enemy[0]; enemy[1] still alive at 1
    let run2 = playCombatCard(allDeadRun, idx);
    expect(run2.combat.state).toBe("active");

    // Now also kill enemy[1] by switching target and striking
    run2 = {
      ...run2,
      combat: {
        ...run2.combat,
        targetIndex: 1,
        enemy: run2.combat.enemies[1]
      }
    };
    const idx2 = run2.combat.hand.findIndex((c) => c.id === "strike");
    const run3 = playCombatCard(run2, idx2);
    expect(run3.combat.state).toBe("victory");
  });

  it("normalizeStatusStacks clamps poison and burn on all enemies in the array", () => {
    const baseRun = makeRun();
    const started = { ...baseRun, combat: startCombatForNode(baseRun, singleNode()) };
    const run = injectSecondEnemy(started);
    // Force excessive stacks on both enemies
    const overflowRun = {
      ...run,
      combat: {
        ...run.combat,
        enemies: run.combat.enemies.map((e) => ({ ...e, poison: 999, burn: 999 })),
        enemy: { ...run.combat.enemies[0], poison: 999, burn: 999 }
      }
    };
    // endCombatTurn calls normalizeStatusStacks
    const run2 = endCombatTurn(overflowRun);
    // Both enemies should have capped stacks
    run2.combat.enemies.forEach((e) => {
      expect(e.poison).toBeLessThanOrEqual(20);
      expect(e.burn).toBeLessThanOrEqual(20);
    });
  });

  it("backward compat: single-enemy encounters work identically to before", () => {
    const run = makeRun();
    const started = { ...run, combat: startCombatForNode(run, singleNode()) };
    const idx = started.combat.hand.findIndex((c) => c.id === "strike");
    const run2 = playCombatCard(started, idx);
    expect(run2.combat.enemies[0].health).toBeLessThan(started.combat.enemies[0].health);
    expect(run2.combat.enemy.health).toBe(run2.combat.enemies[0].health);
    const run3 = endCombatTurn(run2);
    expect(run3.combat.player.energy).toBeGreaterThan(0);
  });
});

describe("multi-enemy end-turn intents", () => {
  it("both living enemies deal damage on end-turn", () => {
    const baseRun = makeRun();
    const started = { ...baseRun, combat: startCombatForNode(baseRun, singleNode()) };
    const run = injectSecondEnemy(started);
    const hpBefore = run.combat.player.health;
    const run2 = endCombatTurn(run);
    // Player should have taken damage from both enemies
    expect(run2.combat.player.health).toBeLessThan(hpBefore);
  });

  it("dead enemy does not act on end-turn", () => {
    const baseRun = makeRun();
    const started = { ...baseRun, combat: startCombatForNode(baseRun, singleNode()) };
    const run = injectSecondEnemy(started);
    // Kill first enemy
    const deadFirstEnemy = {
      ...run,
      combat: {
        ...run.combat,
        enemies: run.combat.enemies.map((e, i) => (i === 0 ? { ...e, health: 0 } : e)),
        enemy: { ...run.combat.enemies[0], health: 0 }
      }
    };
    const hpBefore = deadFirstEnemy.combat.player.health;
    const run2 = endCombatTurn(deadFirstEnemy);
    // Only second enemy (5 damage) should have acted
    const hpAfter = run2.combat.player.health;
    // Player block absorbs some; net damage should be ≤ 5
    expect(hpBefore - hpAfter).toBeLessThanOrEqual(5);
  });
});
