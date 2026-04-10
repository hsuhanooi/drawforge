const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");
const { applyVictoryToRun } = require("../src/browserPostNodeActions");

const makeRun = (relicIds = [], overrides = {}) => ({
  player: {
    health: 80,
    maxHealth: 80,
    gold: 0,
    deck: ["strike", "strike", "defend", "defend", "strike"],
    ...overrides.player
  },
  relics: relicIds.map((id) => ({ id, name: id })),
  phoenix_used: false,
  combatsWon: 0,
  ...overrides
});

const combatNode = (type = "combat") => ({ id: "r1c0", row: 1, col: 0, type });

const startCombat = (run, node = combatNode()) => ({
  ...run,
  combat: startCombatForNode(run, node)
});

// ── Phase 2: Combat start relics ────────────────────────────────────────────

describe("storm_diadem", () => {
  it("starts combat already charged", () => {
    const run = startCombat(makeRun(["storm_diadem"]));
    expect(run.combat.player.charged).toBe(true);
  });

  it("does not charge without relic", () => {
    const run = startCombat(makeRun([]));
    expect(run.combat.player.charged).toBe(false);
  });
});

describe("hex_crown", () => {
  it("enemy starts with 1 hex", () => {
    const run = startCombat(makeRun(["hex_crown"]));
    expect(run.combat.enemy.hex).toBe(1);
  });

  it("enemy has no hex without relic", () => {
    const run = startCombat(makeRun([]));
    expect(run.combat.enemy.hex || 0).toBe(0);
  });
});

describe("ashen_idol", () => {
  it("gives +1 energy on turn 1", () => {
    const run = startCombat(makeRun(["ashen_idol"]));
    expect(run.combat.player.energy).toBe(4);
  });

  it("does not give bonus energy on subsequent turns", () => {
    const run = startCombat(makeRun(["ashen_idol"]));
    const run2 = endCombatTurn(run);
    expect(run2.combat.player.energy).toBe(3);
  });
});

describe("brass_lantern", () => {
  it("gives +1 energy vs elite node", () => {
    const run = startCombat(makeRun(["brass_lantern"]), combatNode("elite"));
    expect(run.combat.player.energy).toBe(4);
  });

  it("gives +1 energy vs boss node", () => {
    const run = startCombat(makeRun(["brass_lantern"]), combatNode("boss"));
    expect(run.combat.player.energy).toBe(4);
  });

  it("does not give bonus energy vs normal combat", () => {
    const run = startCombat(makeRun(["brass_lantern"]), combatNode("combat"));
    expect(run.combat.player.energy).toBe(3);
  });
});

describe("crown_of_cinders and infernal_battery energy bonus", () => {
  it("crown_of_cinders gives +1 energy per turn", () => {
    const run = startCombat(makeRun(["crown_of_cinders"]));
    expect(run.combat.player.energy).toBe(4);
    const run2 = endCombatTurn(run);
    expect(run2.combat.player.energy).toBe(4);
  });

  it("infernal_battery gives +1 energy per turn", () => {
    const run = startCombat(makeRun(["infernal_battery"]));
    expect(run.combat.player.energy).toBe(4);
    const run2 = endCombatTurn(run);
    expect(run2.combat.player.energy).toBe(4);
  });
});

describe("empty_throne draw counts", () => {
  it("draws 7 on turn 1", () => {
    const run = makeRun(["empty_throne"], {
      player: {
        health: 80,
        maxHealth: 80,
        gold: 0,
        deck: Array(10).fill("strike")
      }
    });
    const started = startCombat(run);
    expect(started.combat.hand.length).toBe(7);
  });

  it("draws 4 on turn 2", () => {
    const run = makeRun(["empty_throne"], {
      player: {
        health: 80,
        maxHealth: 80,
        gold: 0,
        deck: Array(10).fill("strike")
      }
    });
    const started = startCombat(run);
    const afterTurn = endCombatTurn(started);
    expect(afterTurn.combat.hand.length).toBe(4);
  });
});

describe("infernal_battery draw penalty", () => {
  it("draws 4 on turn 1", () => {
    const run = makeRun(["infernal_battery"], {
      player: {
        health: 80,
        maxHealth: 80,
        gold: 0,
        deck: Array(10).fill("strike")
      }
    });
    const started = startCombat(run);
    expect(started.combat.hand.length).toBe(4);
  });
});

// ── Phase 3: Per-card damage relics ────────────────────────────────────────

describe("flicker_charm", () => {
  it("first attack deals +3 damage", () => {
    const run = startCombat(makeRun(["flicker_charm"]));
    const enemyHealthBefore = run.combat.enemy.health;
    const run2 = playCombatCard(run, run.combat.hand.findIndex((c) => c.type === "attack"));
    const dmgDealt = enemyHealthBefore - run2.combat.enemy.health;
    expect(dmgDealt).toBeGreaterThan(6);
    expect(run2.combat.flicker_used).toBe(true);
  });

  it("second attack does not get the bonus", () => {
    const run = makeRun(["flicker_charm"], {
      player: {
        health: 80, maxHealth: 80, gold: 0,
        deck: ["strike", "strike", "strike", "strike", "strike"]
      }
    });
    const started = startCombat(run);
    const run2 = playCombatCard(started, 0);
    const enemyHealthAfterFirst = run2.combat.enemy.health;
    const run3 = playCombatCard(run2, 0);
    const dmg = enemyHealthAfterFirst - run3.combat.enemy.health;
    expect(dmg).toBe(6);
  });
});

describe("duelists_thread", () => {
  it("first attack per turn deals +2 damage", () => {
    const run = makeRun(["duelists_thread"], {
      player: {
        health: 80, maxHealth: 80, gold: 0,
        deck: ["strike", "strike", "strike", "strike", "strike"]
      }
    });
    const started = startCombat(run);
    const enemyBefore = started.combat.enemy.health;
    const run2 = playCombatCard(started, 0);
    const dmg = enemyBefore - run2.combat.enemy.health;
    expect(dmg).toBe(8);
    expect(run2.combat.duelist_used_this_turn).toBe(true);
  });

  it("second attack in same turn does not get bonus", () => {
    const run = makeRun(["duelists_thread"], {
      player: {
        health: 80, maxHealth: 80, gold: 0,
        deck: ["strike", "strike", "strike", "strike", "strike"]
      }
    });
    const started = startCombat(run);
    const run2 = playCombatCard(started, 0);
    const enemyBefore = run2.combat.enemy.health;
    const run3 = playCombatCard(run2, 0);
    expect(run3.combat.enemy.health).toBe(enemyBefore - 6);
  });

  it("bonus resets next turn", () => {
    const run = makeRun(["duelists_thread"], {
      player: {
        health: 80, maxHealth: 80, gold: 0,
        deck: Array(10).fill("strike")
      }
    });
    const started = startCombat(run);
    const turn1 = playCombatCard(started, 0);
    const afterEndTurn = endCombatTurn(turn1);
    expect(afterEndTurn.combat.duelist_used_this_turn).toBe(false);
    const enemyBefore = afterEndTurn.combat.enemy.health;
    const turn2 = playCombatCard(afterEndTurn, 0);
    expect(turn2.combat.enemy.health).toBe(enemyBefore - 8);
  });
});

describe("grave_wick", () => {
  it("first exhaust card each combat costs 0", () => {
    const run = makeRun(["grave_wick"], {
      player: {
        health: 80, maxHealth: 80, gold: 0,
        deck: ["surge", "strike", "strike", "strike", "strike"]
      }
    });
    const started = startCombat(run);
    const surgeIdx = started.combat.hand.findIndex((c) => c.id === "surge");
    const energyBefore = started.combat.player.energy;
    const run2 = playCombatCard(started, surgeIdx);
    // surge normally costs 2; with grave_wick it costs 0, and surge also gains +2 energy
    expect(run2.combat.player.energy).toBe(energyBefore + 2);
    expect(run2.combat.grave_wick_used).toBe(true);
  });
});

describe("thorn_crest", () => {
  it("deals 3 damage to enemy when player takes HP damage", () => {
    const run = makeRun(["thorn_crest"]);
    const started = startCombat(run);
    const enemyBefore = started.combat.enemy.health;
    const run2 = endCombatTurn(started);
    // After end turn, enemy attacked player; thorn_crest deals 3 back
    if (run2.combat && run2.combat.state === "active") {
      expect(run2.combat.enemy.health).toBeLessThan(enemyBefore);
    }
  });
});

describe("soot_vessel", () => {
  it("heals 6 after winning at ≤50% HP", () => {
    const run = makeRun(["soot_vessel"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 30 } };
    const result = applyVictoryToRun(run, combat);
    expect(result.player.health).toBe(36);
  });

  it("does not heal when above 50% HP", () => {
    const run = makeRun(["soot_vessel"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 60 } };
    const result = applyVictoryToRun(run, combat);
    expect(result.player.health).toBe(60);
  });
});

describe("bone_token health cap", () => {
  it("bone_token heal is capped at maxHealth", () => {
    const run = makeRun(["bone_token"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 79 } };
    const result = applyVictoryToRun(run, combat);
    expect(result.player.health).toBe(80);
  });
});

describe("lucky_coin", () => {
  it("grants +5 gold on top of the enemy-specific combat reward", () => {
    const run = makeRun(["lucky_coin"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 80 }, enemy: { rewardGold: 18 } };
    const result = applyVictoryToRun(run, combat);
    expect(result.player.gold).toBe(run.player.gold + 23);
  });
});

describe("pilgrims_map", () => {
  it("grants +3 gold per non-boss combat on top of the enemy-specific reward", () => {
    const run = makeRun(["pilgrims_map"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 80 }, enemy: { rewardGold: 16 } };
    const result = applyVictoryToRun(run, combat);
    expect(result.player.gold).toBe(run.player.gold + 19);
  });

  it("does not grant bonus on boss combat", () => {
    const run = makeRun(["pilgrims_map"]);
    const goldBefore = run.player.gold;
    const combat = { state: "victory", nodeType: "boss", player: { health: 80 } };
    const result = applyVictoryToRun(run, combat);
    // boss reward is 50 gold, no pilgrims bonus
    expect(result.player.gold).toBe(goldBefore + 50);
  });
});

// ── Phase 4: Reward relics ──────────────────────────────────────────────────

describe("merchant_ledger", () => {
  it("combat victory offers 4 card reward choices", () => {
    const run = makeRun(["merchant_ledger"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 80 } };
    const result = applyVictoryToRun(run, combat);
    expect(result.pendingRewards.cards.length).toBe(4);
  });
});

describe("golden_brand", () => {
  it("combat victory offers 4 card reward choices", () => {
    const run = makeRun(["golden_brand"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 80 } };
    const result = applyVictoryToRun(run, combat);
    expect(result.pendingRewards.cards.length).toBe(4);
  });
});

describe("leather_thread", () => {
  it("grants +1 maxHealth every 3 combats won", () => {
    let run = makeRun(["leather_thread"]);
    const combat = { state: "victory", nodeType: "combat", player: { health: 80 } };
    run = applyVictoryToRun(run, combat);
    expect(run.player.maxHealth).toBe(80);
    run = applyVictoryToRun(run, { ...combat, player: { health: run.player.health } });
    expect(run.player.maxHealth).toBe(80);
    run = applyVictoryToRun(run, { ...combat, player: { health: run.player.health } });
    expect(run.player.maxHealth).toBe(81);
  });
});
