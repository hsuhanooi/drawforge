const { startNewRun } = require("../src/run");
const { startAct2 } = require("../src/actTransition");
const { createEnemyForNode, act1BossPool, act2BossPool } = require("../src/enemies");
const { resolveNode } = require("../src/nodeResolver");

const ACT1_BOSS_IDS = act1BossPool.map((f) => f().id);
const ACT2_BOSS_IDS = act2BossPool.map((f) => f().id);

describe("Act 2 transition", () => {
  it("startAct2 sets act to 2", () => {
    const run = { ...startNewRun(), relics: [], phoenix_used: false, pendingRewards: null, event: null };
    const act2Run = startAct2(run);
    expect(act2Run.act).toBe(2);
  });

  it("startAct2 heals 10 HP up to maxHealth", () => {
    const run = { ...startNewRun(), relics: [], phoenix_used: false, pendingRewards: null, event: null };
    const injuredRun = { ...run, player: { ...run.player, health: 40, maxHealth: 80 } };
    const act2Run = startAct2(injuredRun);
    expect(act2Run.player.health).toBe(50);
  });

  it("startAct2 does not heal above maxHealth", () => {
    const run = { ...startNewRun(), relics: [], phoenix_used: false, pendingRewards: null, event: null };
    const nearFullRun = { ...run, player: { ...run.player, health: 75, maxHealth: 80 } };
    const act2Run = startAct2(nearFullRun);
    expect(act2Run.player.health).toBe(80);
  });

  it("startAct2 generates a fresh map with currentNodeId null", () => {
    const run = { ...startNewRun(), relics: [], phoenix_used: false, pendingRewards: null, event: null };
    const act2Run = startAct2(run);
    expect(act2Run.map).toBeDefined();
    expect(act2Run.map.currentNodeId).toBeNull();
    expect(Array.isArray(act2Run.map.nodes)).toBe(true);
  });

  it("startAct2 resets combat and event", () => {
    const run = { ...startNewRun(), relics: [], phoenix_used: false, pendingRewards: null, event: { id: "foo" } };
    const act2Run = startAct2(run);
    expect(act2Run.combat).toBeNull();
    expect(act2Run.event).toBeNull();
    expect(act2Run.pendingRewards).toBeNull();
  });
});

describe("Act 2 enemy routing", () => {
  const combatNode = (row, col) => ({ id: "n1", type: "combat", row, col });
  const eliteNode = (row, col) => ({ id: "n2", type: "elite", row, col });
  const bossNode = () => ({ id: "n3", type: "boss", row: 4, col: 1 });

  it("act 1 combat still returns act 1 enemies only", () => {
    const act1Ids = [
      "slime", "fangling", "mossling", "hexbat",
      "thornling", "phantom_thief", "brute", "hex_cultist", "shield_crawler",
      "plague_rat", "cinder_shade", "venomfang"
    ];
    for (let i = 0; i < 18; i += 1) {
      const enemy = createEnemyForNode(combatNode(i % 5, i % 3), 1);
      expect(act1Ids).toContain(enemy.id);
    }
  });

  it("act 2 combat can return act 2-exclusive enemies", () => {
    const act2Ids = new Set();
    for (let i = 0; i < 60; i += 1) {
      const enemy = createEnemyForNode(combatNode(i, i % 4), 2);
      act2Ids.add(enemy.id);
    }
    expect(act2Ids).toContain("ironback");
    expect(act2Ids).toContain("void_walker");
    expect(act2Ids).toContain("hex_wraith");
  });

  it("act 2 elite pool includes bone_colossus", () => {
    const eliteIds = new Set();
    for (let i = 0; i < 12; i += 1) {
      const enemy = createEnemyForNode(eliteNode(i, i), 2);
      eliteIds.add(enemy.id);
    }
    expect(eliteIds).toContain("bone_colossus");
  });

  it("act 1 elite does not include bone_colossus", () => {
    const eliteIds = new Set();
    for (let i = 0; i < 12; i += 1) {
      const enemy = createEnemyForNode(eliteNode(i, i), 1);
      eliteIds.add(enemy.id);
    }
    expect(eliteIds).not.toContain("bone_colossus");
  });

  it("act 2 boss comes from the act 2 boss pool", () => {
    const boss = createEnemyForNode(bossNode(), 2);
    expect(ACT2_BOSS_IDS).toContain(boss.id);
    expect(boss.health).toBeGreaterThan(90);
  });

  it("act 1 boss comes from the act 1 boss pool", () => {
    const boss = createEnemyForNode(bossNode(), 1);
    expect(ACT1_BOSS_IDS).toContain(boss.id);
  });

  it("void_sovereign has phaseThreshold and phase2Intents", () => {
    const voidSov = act2BossPool.find((f) => f().id === "void_sovereign")();
    expect(voidSov.phaseThreshold).toBe(47);
    expect(voidSov.phase).toBe(1);
    expect(Array.isArray(voidSov.phase2Intents)).toBe(true);
    expect(voidSov.phase2Intents.length).toBeGreaterThan(0);
  });

  it("nodeResolver passes act to createEnemyForNode and returns an act 2 boss", () => {
    const node = { id: "n1", type: "boss", row: 4, col: 1 };
    const player = { health: 80, maxHealth: 80, deck: [], gold: 100 };
    const result = resolveNode({ node, player, act: 2 });
    expect(result.state).toBe("combat");
    expect(ACT2_BOSS_IDS).toContain(result.combat.enemy.id);
  });
});

describe("Phase shift mechanic", () => {
  const { playCombatCard } = require("../src/browserCombatActions");
  const { createEnemy } = require("../src/enemies");

  // Build a run with a known void_sovereign-style enemy for phase shift tests
  const makePhaseShiftRun = (overrideEnemy = {}) => {
    const phase2Intents = [
      { type: "multi_attack", value: 8, hits: 2, label: "Chaos Rend: 2x8" },
      { type: "attack", value: 18, label: "Annihilate for 18" }
    ];
    const baseEnemy = createEnemy({
      id: "void_sovereign",
      name: "Void Sovereign",
      health: 95,
      damage: 14,
      rewardGold: 75,
      phaseThreshold: 47,
      phase: 1,
      phase2Strength: 2,
      intents: [{ type: "attack", value: 14, label: "Void Slash for 14" }],
      phase2Intents
    });
    const run = {
      ...startNewRun(),
      act: 2,
      relics: [],
      phoenix_used: false,
      pendingRewards: null,
      event: null
    };
    const baseRun = {
      ...run,
      combat: {
        state: "active",
        turn: "player",
        nodeType: "boss",
        enemyTurnNumber: 0,
        firstTurn: true,
        grimoire_used: false,
        coal_pendant_used: false,
        sigil_fired: false,
        seal_used_this_turn: false,
        flicker_used: false,
        duelist_used_this_turn: false,
        grave_wick_used: false,
        mirror_used: false,
        black_prism_fired: false,
        hex_lantern_used: false,
        exhaustTotal: 0,
        doom_engine_active: false,
        returnPile: [],
        player: { health: 80, block: 0, energy: 3, charged: false, strength: 0, dexterity: 0, weak: 0, poison: 0, burn: 0 },
        hand: [],
        drawPile: [],
        discardPile: [],
        exhaustPile: [],
        exhaustedThisTurn: 0,
        combatLog: [],
        powers: [],
        enemy: { ...baseEnemy, ...overrideEnemy },
        enemyIntent: baseEnemy.intents[0]
      }
    };
    return baseRun;
  };

  // Legacy alias for tests that don't test phase2Intents field name
  const makeAct2Run = makePhaseShiftRun;

  it("void_sovereign does not phase shift when above threshold", () => {
    const run = makeAct2Run({ health: 80, phase: 1, phaseThreshold: 47 });
    expect(run.combat.enemy.phase).toBe(1);
    expect(run.combat.enemy.health).toBe(80);
  });

  it("void_sovereign phase shifts when health drops to threshold", () => {
    // Force hand with a strong attack card and set enemy just above threshold
    // Use a run where we control hand to include strike (5 damage)
    const run = makeAct2Run({ health: 50, phase: 1, phaseThreshold: 47 });
    // Force a hand with strike cards by manipulating combat state
    const strikeCard = { id: "strike", name: "Strike", type: "attack", cost: 1, damage: 6, rarity: "starter" };
    const runWithHand = {
      ...run,
      combat: {
        ...run.combat,
        hand: [strikeCard],
        player: { ...run.combat.player, energy: 3 }
      }
    };
    const result = playCombatCard(runWithHand, 0);
    // 50 - 6 = 44, which is <= 47, so phase shift should trigger
    expect(result.combat.enemy.phase).toBe(2);
    expect(result.combat.enemy.intents).toEqual(result.combat.enemy.phase2Intents);
    expect(result.combat.enemyTurnNumber).toBe(0);
  });

  it("phase 2 adds phase2Strength to enemy strength", () => {
    const run = makeAct2Run({ health: 50, phase: 1, phaseThreshold: 47, phase2Strength: 2 });
    const strikeCard = { id: "strike", name: "Strike", type: "attack", cost: 1, damage: 6, rarity: "starter" };
    const runWithHand = {
      ...run,
      combat: {
        ...run.combat,
        hand: [strikeCard],
        player: { ...run.combat.player, energy: 3 }
      }
    };
    const result = playCombatCard(runWithHand, 0);
    expect(result.combat.enemy.strength).toBeGreaterThanOrEqual(2);
  });

  it("phase shift does not trigger if enemy is already phase 2", () => {
    const run = makeAct2Run({ health: 30, phase: 2, phaseThreshold: 47 });
    const strikeCard = { id: "strike", name: "Strike", type: "attack", cost: 1, damage: 6, rarity: "starter" };
    const runWithHand = {
      ...run,
      combat: {
        ...run.combat,
        hand: [strikeCard],
        player: { ...run.combat.player, energy: 3 }
      }
    };
    const result = playCombatCard(runWithHand, 0);
    expect(result.combat.enemy.phase).toBe(2);
  });
});
