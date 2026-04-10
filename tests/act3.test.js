const { startNewRun } = require("../src/run");
const { startAct3 } = require("../src/actTransition");
const { createEnemyForNode } = require("../src/enemies");
const { resolveNode } = require("../src/nodeResolver");
const { playCombatCard, startCombatForNode } = require("../src/browserCombatActions");
const { finishNode } = require("../src/browserPostNodeActions");

describe("Act 3 transition", () => {
  it("startAct3 sets act to 3 and heals up to maxHealth", () => {
    const baseRun = startNewRun();
    const run = {
      ...baseRun,
      act: 2,
      relics: [],
      phoenix_used: false,
      pendingRewards: null,
      event: null,
      player: { ...baseRun.player, health: 60, maxHealth: 80, gold: 99 }
    };

    const act3Run = startAct3(run);

    expect(act3Run.act).toBe(3);
    expect(act3Run.player.health).toBe(72);
    expect(act3Run.map.currentNodeId).toBeNull();
    expect(act3Run.combat).toBeNull();
    expect(act3Run.pendingRewards).toBeNull();
  });

  it("finishNode sends act 2 boss wins into act 3 instead of ending the run", () => {
    const run = {
      ...startNewRun(),
      act: 2,
      relics: [],
      phoenix_used: false,
      pendingRewards: null,
      event: null,
      map: {
        currentNodeId: "boss-1",
        nodes: [{ id: "boss-1", type: "boss", row: 4, col: 1 }]
      }
    };

    const next = finishNode(run);

    expect(next.act).toBe(3);
    expect(next.state).toBe("in_progress");
    expect(next.trueVictory).toBe(false);
  });

  it("finishNode marks act 3 boss wins as true victory", () => {
    const run = {
      ...startNewRun(),
      act: 3,
      relics: [],
      phoenix_used: false,
      pendingRewards: null,
      event: null,
      map: {
        currentNodeId: "boss-3",
        nodes: [{ id: "boss-3", type: "boss", row: 4, col: 1 }]
      }
    };

    const next = finishNode(run);

    expect(next.state).toBe("won");
    expect(next.trueVictory).toBe(true);
  });
});

describe("Act 3 enemy routing", () => {
  it("act 3 combat can return act 3-exclusive enemies", () => {
    const act3Ids = new Set();
    for (let row = 0; row < 30; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const enemy = createEnemyForNode({ row, col, type: "combat" }, 3);
        act3Ids.add(enemy.id);
      }
    }

    expect(act3Ids).toContain("nightmare_husk");
    expect(act3Ids).toContain("hex_revenant");
    expect(act3Ids).toContain("ashwalker");
  });

  it("act 3 elite pool includes both new elites", () => {
    const eliteIds = new Set();
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        eliteIds.add(createEnemyForNode({ row, col, type: "elite" }, 3).id);
      }
    }

    expect(eliteIds).toContain("hex_titan");
    expect(eliteIds).toContain("cinder_colossus");
  });

  it("act 3 boss is the_undying with multi-phase thresholds", () => {
    const boss = createEnemyForNode({ row: 4, col: 1, type: "boss" }, 3);

    expect(boss.id).toBe("the_undying");
    expect(boss.phaseThresholds).toEqual([150, 100, 50]);
    expect(boss.phase).toBe(1);
    expect(boss.phaseIntents).toHaveLength(4);
  });

  it("nodeResolver passes act 3 through to the boss pool", () => {
    const node = { id: "n1", type: "boss", row: 4, col: 1 };
    const player = { health: 80, maxHealth: 80, deck: [], gold: 100 };
    const result = resolveNode({ node, player, act: 3 });

    expect(result.state).toBe("combat");
    expect(result.combat.enemy.id).toBe("the_undying");
  });
});

describe("Act 3 boss phase transitions", () => {
  const makeAct3Run = (overrideEnemy = {}) => {
    const run = {
      ...startNewRun(),
      act: 3,
      relics: [],
      phoenix_used: false,
      pendingRewards: null,
      event: null
    };
    const node = { id: "n1", type: "boss", row: 4, col: 1 };
    let runWithCombat = { ...run, combat: null };
    runWithCombat = { ...runWithCombat, combat: startCombatForNode(runWithCombat, node) };
    runWithCombat = {
      ...runWithCombat,
      combat: {
        ...runWithCombat.combat,
        enemy: { ...runWithCombat.combat.enemy, ...overrideEnemy }
      }
    };
    return runWithCombat;
  };

  it("shifts The Undying into phase 2 when health hits 150 or below", () => {
    const run = makeAct3Run({ health: 155, phase: 1 });
    const strikeCard = { id: "strike", name: "Strike", type: "attack", cost: 1, damage: 6, rarity: "starter" };
    const result = playCombatCard({
      ...run,
      combat: {
        ...run.combat,
        hand: [strikeCard],
        player: { ...run.combat.player, energy: 3 }
      }
    }, 0);

    expect(result.combat.enemy.phase).toBe(2);
    expect(result.combat.enemy.intents).toEqual(result.combat.enemy.phaseIntents[1]);
    expect(result.combat.phaseTransitionLabel).toBe("PHASE 2");
  });

  it("can continue phase-shifting through phase 4 thresholds", () => {
    const strikeCard = { id: "strike", name: "Strike", type: "attack", cost: 1, damage: 6, rarity: "starter" };
    const run = makeAct3Run({ health: 105, phase: 2, strength: 2 });
    const phase3 = playCombatCard({
      ...run,
      combat: {
        ...run.combat,
        hand: [strikeCard],
        player: { ...run.combat.player, energy: 3 }
      }
    }, 0);

    expect(phase3.combat.enemy.phase).toBe(3);
    expect(phase3.combat.enemy.intents).toEqual(phase3.combat.enemy.phaseIntents[2]);

    const phase4 = playCombatCard({
      ...phase3,
      combat: {
        ...phase3.combat,
        enemy: { ...phase3.combat.enemy, health: 55 },
        hand: [strikeCard],
        player: { ...phase3.combat.player, energy: 3 }
      }
    }, 0);

    expect(phase4.combat.enemy.phase).toBe(4);
    expect(phase4.combat.enemy.intents).toEqual(phase4.combat.enemy.phaseIntents[3]);
    expect(phase4.combat.phaseTransitionLabel).toBe("PHASE 4");
  });
});
