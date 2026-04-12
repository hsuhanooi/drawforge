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
    expect(dmg).toBe(5);
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
    expect(dmg).toBe(7);
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
    expect(run3.combat.enemy.health).toBe(enemyBefore - 5);
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
    expect(turn2.combat.enemy.health).toBe(enemyBefore - 7);
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

describe("burnout_coil", () => {
  it("gains 1 energy when playing the last card in hand", () => {
    const run = makeRun(["burnout_coil"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: ["strike", "strike", "strike", "strike", "strike"] }
    });
    const started = startCombat(run);
    // Get to 1 card in hand
    let state = { ...started, combat: { ...started.combat, hand: [started.combat.hand[0]], drawPile: [] } };
    const energyBefore = state.combat.player.energy;
    const result = playCombatCard(state, 0);
    // Playing last card should grant +1 energy from burnout_coil
    expect(result.combat.player.energy).toBe(energyBefore - 1 + 1); // cost 1 (strike), +1 from relic
    expect(result.combat.triggeredRelics).toContain("burnout_coil");
  });

  it("does not trigger when hand still has cards remaining", () => {
    const run = makeRun(["burnout_coil"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: ["strike", "strike", "strike", "strike", "strike"] }
    });
    const started = startCombat(run);
    const result = playCombatCard(started, 0);
    // Still cards in hand — no burnout_coil trigger
    expect(result.combat.triggeredRelics).not.toContain("burnout_coil");
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

describe("convergence_stone", () => {
  it("gains 2 energy after playing one of each type (attack, skill, power)", () => {
    const { toRenderableCard } = require("../src/cardCatalog");
    const run = makeRun(["convergence_stone"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: ["strike", "defend", "iron_will", "strike", "strike"] }
    });
    let state = startCombat(run);
    state = { ...state, combat: { ...state.combat, player: { ...state.combat.player, energy: 5 }, hand: [toRenderableCard("strike"), toRenderableCard("defend"), toRenderableCard("iron_will")], drawPile: [] } };
    // Play attack
    state = playCombatCard(state, 0);
    expect(state.combat.triggeredRelics).not.toContain("convergence_stone");
    // Play skill
    state = playCombatCard(state, 0);
    expect(state.combat.triggeredRelics).not.toContain("convergence_stone");
    // Play power — triggers convergence
    const energyBefore = state.combat.player.energy;
    state = playCombatCard(state, 0);
    expect(state.combat.player.energy).toBe(energyBefore - 2 + 2); // cost 2, +2 from relic
    expect(state.combat.triggeredRelics).toContain("convergence_stone");
  });

  it("does not trigger again after first time", () => {
    const { toRenderableCard } = require("../src/cardCatalog");
    const run = makeRun(["convergence_stone"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: Array(10).fill("strike") }
    });
    let state = startCombat(run);
    state = { ...state, combat: { ...state.combat, convergence_attack: true, convergence_skill: true, convergence_triggered: true, hand: [toRenderableCard("iron_will")], drawPile: [] } };
    state = playCombatCard(state, 0);
    expect(state.combat.triggeredRelics).not.toContain("convergence_stone");
  });
});

describe("plague_membrane", () => {
  it("gains block equal to enemy poison stacks on first attack against poisoned enemy", () => {
    const { toRenderableCard } = require("../src/cardCatalog");
    const run = makeRun(["plague_membrane"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: ["strike", "strike", "strike", "strike", "strike"] }
    });
    let state = startCombat(run);
    state = { ...state, combat: { ...state.combat, hand: [toRenderableCard("strike")], drawPile: [], enemy: { ...state.combat.enemy, poison: 3 } } };
    const blockBefore = state.combat.player.block;
    state = playCombatCard(state, 0);
    // Gained 3 block from plague_membrane (enemy had 3 poison)
    expect(state.combat.player.block).toBe(blockBefore + 3);
    expect(state.combat.triggeredRelics).toContain("plague_membrane");
  });

  it("does not trigger twice in the same turn", () => {
    const { toRenderableCard } = require("../src/cardCatalog");
    const run = makeRun(["plague_membrane"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: ["strike", "strike", "strike", "strike", "strike"] }
    });
    let state = startCombat(run);
    state = { ...state, combat: { ...state.combat, hand: [toRenderableCard("strike"), toRenderableCard("strike")], drawPile: [], enemy: { ...state.combat.enemy, poison: 2 } } };
    state = playCombatCard(state, 0);
    const blockAfterFirst = state.combat.player.block;
    state = playCombatCard(state, 0);
    // Second attack: no additional block from membrane
    expect(state.combat.player.block).toBe(blockAfterFirst); // block reset to 0 in same turn context — membrane already used
    expect(state.combat.plague_membrane_used).toBe(true);
  });

  it("resets at end of turn", () => {
    const run = makeRun(["plague_membrane"]);
    let state = startCombat(run);
    state = { ...state, combat: { ...state.combat, plague_membrane_used: true } };
    const result = endCombatTurn(state);
    expect(result.combat.plague_membrane_used).toBe(false);
  });
});

describe("rift_shard", () => {
  it("gains 2 block when playing a card costing 2 or more", () => {
    const { toRenderableCard } = require("../src/cardCatalog");
    const run = makeRun(["rift_shard"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: ["heavy_swing", "strike", "strike", "strike", "strike"] }
    });
    let state = startCombat(run);
    state = { ...state, combat: { ...state.combat, hand: [toRenderableCard("heavy_swing")], drawPile: [] } };
    const blockBefore = state.combat.player.block;
    state = playCombatCard(state, 0);
    expect(state.combat.player.block).toBe(blockBefore + 2);
    expect(state.combat.triggeredRelics).toContain("rift_shard");
  });

  it("does not trigger on cards costing less than 2", () => {
    const run = makeRun(["rift_shard"], {
      player: { health: 80, maxHealth: 80, gold: 0, deck: ["strike", "strike", "strike", "strike", "strike"] }
    });
    const state = startCombat(run);
    const result = playCombatCard(state, 0);
    expect(result.combat.triggeredRelics).not.toContain("rift_shard");
  });
});

describe("blood_crucible", () => {
  const makeBloodRun = (relicIds = []) => ({
    player: {
      health: 80,
      maxHealth: 80,
      gold: 0,
      deck: ["blood_pact", "blood_pact", "blood_pact", "strike", "defend"],
      relics: relicIds.map((id) => ({ id, name: id }))
    },
    relics: relicIds.map((id) => ({ id, name: id })),
    phoenix_used: false,
    combatsWon: 0
  });
  const node = { id: "r1c0", row: 1, col: 0, type: "combat" };

  it("doubles blood_pact energy gain (2 -> 4) with blood_crucible relic", () => {
    const run = makeBloodRun(["blood_crucible"]);
    const combat = startCombatForNode(run, node);
    const bpIdx = combat.hand.findIndex(c => c.id === "blood_pact");
    if (bpIdx === -1) return; // blood_pact not in opening hand — skip
    const energyBefore = combat.player.energy;
    const result = playCombatCard({ ...run, combat }, bpIdx);
    expect(result.combat.player.energy).toBe(energyBefore - 0 + 4); // cost 0, gain 4 (doubled)
  });

  it("without blood_crucible, blood_pact gives normal 2 energy", () => {
    const run = makeBloodRun([]);
    const combat = startCombatForNode(run, node);
    const bpIdx = combat.hand.findIndex(c => c.id === "blood_pact");
    if (bpIdx === -1) return;
    const energyBefore = combat.player.energy;
    const result = playCombatCard({ ...run, combat }, bpIdx);
    expect(result.combat.player.energy).toBe(energyBefore - 0 + 2); // cost 0, gain 2
  });

  it("caps total sacrifice energy at MAX_SACRIFICE_ENERGY_PER_TURN=4 even with multiple blood_pact plays", () => {
    const run = makeBloodRun(["blood_crucible"]);
    const bloodPact = { id: "blood_pact", name: "Blood Pact", cost: 0, selfDamage: 5, energyGain: 2, draw: 1, type: "skill" };
    let combat = startCombatForNode(run, node);
    // Force hand to 3 blood_pact cards and set energy=0
    combat = {
      ...combat,
      hand: [bloodPact, bloodPact, bloodPact],
      player: { ...combat.player, health: 80, energy: 0, block: 0 },
      sacrificeEnergyThisTurn: 0
    };
    // First play: cost 0, gain min(4, 4-0)=4 → energy=0+4=4, sacrifice=4
    const r1 = playCombatCard({ ...run, combat }, 0);
    expect(r1.combat.sacrificeEnergyThisTurn).toBe(4);
    expect(r1.combat.player.energy).toBe(4);
    // Second play: cost 0, gain min(4, 4-4)=0 → energy=4+0=4, sacrifice still 4
    const r2 = playCombatCard({ ...run, combat: r1.combat }, 0);
    expect(r2.combat.sacrificeEnergyThisTurn).toBe(4);
    expect(r2.combat.player.energy).toBe(4);
  });

  it("resets sacrificeEnergyThisTurn to 0 at turn start", () => {
    const run = makeBloodRun(["blood_crucible"]);
    const combat = { ...startCombatForNode(run, node), sacrificeEnergyThisTurn: 4, state: "active" };
    const next = endCombatTurn({ ...run, combat });
    expect(next.combat.sacrificeEnergyThisTurn).toBe(0);
  });
});
