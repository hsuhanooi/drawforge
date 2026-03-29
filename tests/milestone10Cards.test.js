const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");
const { IMPLEMENTED_CARD_IDS, MISSING_CARD_IDS } = require("../src/cardRegistry");

const makeRun = (deck) => ({
  player: { health: 80, maxHealth: 80, gold: 0, deck },
  relics: [],
  phoenix_used: false,
  combatsWon: 0
});

const node = { id: "r1c0", row: 1, col: 0, type: "combat" };

const startCombat = (run) => ({ ...run, combat: startCombatForNode(run, node) });

const playCard = (run, cardId) => {
  const idx = run.combat.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) throw new Error(`${cardId} not in hand`);
  return playCombatCard(run, idx);
};

// Force a specific hand for deterministic tests
const withHand = (run, cardIds) => {
  const catalog = run.combat.drawPile.concat(run.combat.hand);
  const hand = cardIds.map((id) => catalog.find((c) => c.id === id) || { id, name: id, cost: 0, type: "skill", rarity: "common" });
  const remaining = catalog.filter((c) => !cardIds.includes(c.id));
  return { ...run, combat: { ...run.combat, hand, drawPile: remaining, discardPile: [] } };
};

// ─── Charged archetype ────────────────────────────────────────────────────────

describe("Charged archetype", () => {
  it("static_guard gains 6 block", () => {
    const run = withHand(startCombat(makeRun(["static_guard", "strike", "strike", "strike", "strike"])), ["static_guard"]);
    const blockBefore = run.combat.player.block;
    const run2 = playCard(run, "static_guard");
    expect(run2.combat.player.block).toBe(blockBefore + 6);
    expect(run2.combat.player.energy).toBe(2); // no energy gain, not charged
  });

  it("static_guard gains 1 extra energy when charged", () => {
    const run = withHand(startCombat(makeRun(["static_guard", "charge_up", "strike", "strike", "strike"])), ["charge_up", "static_guard"]);
    const run2 = playCard(run, "charge_up");
    const energyAfterCharge = run2.combat.player.energy;
    const run3 = playCard(run2, "static_guard");
    expect(run3.combat.player.energy).toBe(energyAfterCharge - 1 + 1); // paid 1, gained 1 → net 0 change
  });

  it("capacitor becomes charged and exhausts", () => {
    const run = withHand(startCombat(makeRun(["capacitor", "strike", "strike", "strike", "strike"])), ["capacitor"]);
    const run2 = playCard(run, "capacitor");
    expect(run2.combat.player.charged).toBe(true);
    expect(run2.combat.exhaustPile.some((c) => c.id === "capacitor")).toBe(true);
    expect(run2.combat.player.energy).toBe(3); // cost 0
  });

  it("release deals 14 damage normally", () => {
    const run = withHand(startCombat(makeRun(["release", "strike", "strike", "strike", "strike"])), ["release"]);
    const hpBefore = run.combat.enemy.health;
    const run2 = playCard(run, "release");
    expect(run2.combat.enemy.health).toBe(hpBefore - 14);
  });

  it("release costs 1 less when charged and clears charged", () => {
    const run = withHand(startCombat(makeRun(["release", "charge_up", "strike", "strike", "strike"])), ["charge_up", "release"]);
    const run2 = playCard(run, "charge_up");
    expect(run2.combat.player.charged).toBe(true);
    const energyBeforeRelease = run2.combat.player.energy;
    const run3 = playCard(run2, "release");
    // Cost reduced from 2 to 1 when charged
    expect(run3.combat.player.energy).toBe(energyBeforeRelease - 1);
    expect(run3.combat.player.charged).toBe(false);
  });

  it("guarded_pulse gives 5 block without charge, 10 with charge", () => {
    const run = withHand(startCombat(makeRun(["guarded_pulse", "strike", "strike", "strike", "strike"])), ["guarded_pulse"]);
    const blockBefore = run.combat.player.block;
    const run2 = playCard(run, "guarded_pulse");
    expect(run2.combat.player.block).toBe(blockBefore + 5);

    const runC = withHand(startCombat(makeRun(["guarded_pulse", "charge_up", "strike", "strike", "strike"])), ["charge_up", "guarded_pulse"]);
    const run3 = playCard(runC, "charge_up");
    const blockBefore2 = run3.combat.player.block;
    const run4 = playCard(run3, "guarded_pulse");
    expect(run4.combat.player.block).toBe(blockBefore2 + 10); // 5 base + 5 bonus
  });

  it("flashstep draws 2 if charged", () => {
    const run = withHand(startCombat(makeRun(["flashstep", "charge_up", "strike", "strike", "strike", "strike", "strike"])), ["charge_up", "flashstep"]);
    const run2 = playCard(run, "charge_up");
    const handSize = run2.combat.hand.length;
    const run3 = playCard(run2, "flashstep");
    expect(run3.combat.hand.length).toBe(handSize - 1 + 2);
  });

  it("flashstep becomes charged if not already charged", () => {
    const run = withHand(startCombat(makeRun(["flashstep", "strike", "strike", "strike", "strike"])), ["flashstep"]);
    expect(run.combat.player.charged).toBeFalsy();
    const run2 = playCard(run, "flashstep");
    expect(run2.combat.player.charged).toBe(true);
    expect(run2.combat.hand.length).toBe(run.combat.hand.length - 1); // no draw
  });
});

// ─── Exhaust archetype ────────────────────────────────────────────────────────

describe("Exhaust archetype", () => {
  it("overclock gains 2 energy, discards 1 card, exhausts itself", () => {
    const run = withHand(startCombat(makeRun(["overclock", "strike", "strike", "strike", "strike"])), ["overclock", "strike"]);
    const energyBefore = run.combat.player.energy;
    const handBefore = run.combat.hand.length;
    const run2 = playCard(run, "overclock");
    expect(run2.combat.player.energy).toBe(energyBefore - 1 + 2); // paid 1, gained 2
    expect(run2.combat.exhaustPile.some((c) => c.id === "overclock")).toBe(true);
    expect(run2.combat.hand.length).toBe(handBefore - 2); // played overclock + discarded 1
    expect(run2.combat.discardPile.length).toBe(1); // the discarded card
  });

  it("ashen_blow deals 7 damage; gains 1 energy if something was exhausted", () => {
    const run = withHand(startCombat(makeRun(["ashen_blow", "strike", "strike", "strike", "strike"])), ["ashen_blow"]);
    const hpBefore = run.combat.enemy.health;
    // No prior exhaust
    const run2 = playCard(run, "ashen_blow");
    expect(run2.combat.enemy.health).toBe(hpBefore - 7);
    expect(run2.combat.player.energy).toBe(2); // paid 1, no energy gain

    // With prior exhaust via capacitor
    const runE = withHand(startCombat(makeRun(["ashen_blow", "capacitor", "strike", "strike", "strike"])), ["capacitor", "ashen_blow"]);
    const run3 = playCard(runE, "capacitor");
    const energyAfter = run3.combat.player.energy;
    const run4 = playCard(run3, "ashen_blow");
    expect(run4.combat.player.energy).toBe(energyAfter - 1 + 1); // paid 1, gained 1
  });

  it("final_draft draws 2 then exhausts 1 from hand", () => {
    // Use unique IDs so withHand's filter doesn't drain the draw pile
    const run = withHand(
      startCombat(makeRun(["final_draft", "mark_of_ruin", "hexblade", "brace", "pommel", "parry"])),
      ["final_draft", "mark_of_ruin", "hexblade"]
    );
    const handBefore = run.combat.hand.length; // 3
    const run2 = playCard(run, "final_draft");
    // played 1, drew 2, exhausted 1 → net handBefore
    expect(run2.combat.hand.length).toBe(handBefore);
    expect(run2.combat.exhaustPile.length).toBe(1);
  });

  it("scorch_nerves deals 12 damage and exhausts", () => {
    const run = withHand(startCombat(makeRun(["scorch_nerves", "strike", "strike", "strike", "strike"])), ["scorch_nerves"]);
    const hpBefore = run.combat.enemy.health;
    const run2 = playCard(run, "scorch_nerves");
    expect(run2.combat.enemy.health).toBe(hpBefore - 12);
    expect(run2.combat.exhaustPile.some((c) => c.id === "scorch_nerves")).toBe(true);
  });

  it("cinder_rush deals 6 + 3 per exhausted card this turn", () => {
    const run = withHand(startCombat(makeRun(["cinder_rush", "capacitor", "strike", "strike", "strike"])), ["capacitor", "cinder_rush"]);
    const hpBefore = run.combat.enemy.health;
    const run2 = playCard(run, "capacitor"); // exhaust 1 card
    const run3 = playCard(run2, "cinder_rush");
    expect(run3.combat.enemy.health).toBe(hpBefore - (6 + 3 * 1)); // 9 damage
  });

  it("cinder_rush deals base 6 with no prior exhaust", () => {
    const run = withHand(startCombat(makeRun(["cinder_rush", "strike", "strike", "strike", "strike"])), ["cinder_rush"]);
    const hpBefore = run.combat.enemy.health;
    const run2 = playCard(run, "cinder_rush");
    expect(run2.combat.enemy.health).toBe(hpBefore - 6);
  });

  it("empty_the_chamber exhausts all hand cards and gains 1 energy each", () => {
    const run = withHand(startCombat(makeRun(["empty_the_chamber", "strike", "strike", "strike", "strike"])), ["empty_the_chamber", "strike", "strike"]);
    const energyBefore = run.combat.player.energy;
    const handSize = run.combat.hand.length; // 3 (empty_the_chamber + 2 strikes)
    const run2 = playCard(run, "empty_the_chamber");
    // Played empty_the_chamber (cost 1), exhausted 2 remaining strikes (+2 energy)
    expect(run2.combat.hand.length).toBe(0);
    expect(run2.combat.exhaustPile.length).toBe(2); // the 2 strikes
    expect(run2.combat.player.energy).toBe(energyBefore - 1 + 2);
    expect(handSize).toBe(3);
  });
});

// ─── Hex archetype ────────────────────────────────────────────────────────────

describe("Hex archetype", () => {
  it("curse_spiral applies hex 1 and draws 1", () => {
    const run = withHand(startCombat(makeRun(["curse_spiral", "strike", "strike", "strike", "strike", "strike", "strike"])), ["curse_spiral"]);
    const hexBefore = run.combat.enemy.hex || 0;
    const handBefore = run.combat.hand.length;
    const run2 = playCard(run, "curse_spiral");
    expect(run2.combat.enemy.hex).toBe(hexBefore + 1);
    expect(run2.combat.hand.length).toBe(handBefore - 1 + 1);
  });

  it("cataclysm_sigil deals 18 + 4 per hex stack", () => {
    const run = withHand(startCombat(makeRun(["cataclysm_sigil", "strike", "strike", "strike", "strike"])), ["cataclysm_sigil"]);
    // Set hex directly to avoid spending energy on hex cards before the 3-cost sigil
    const runH = { ...run, combat: { ...run.combat, enemy: { ...run.combat.enemy, hex: 3 } } };
    const hpBefore = runH.combat.enemy.health;
    const run2 = playCard(runH, "cataclysm_sigil");
    // 18 + 4*3 = 30 damage; clamp to 0 if it exceeds enemy HP
    expect(run2.combat.enemy.health).toBe(Math.max(0, hpBefore - 30));
    // confirm hex was not consumed
    expect(runH.combat.enemy.hex).toBe(3);
  });

  it("no_mercy deals 10 damage and repeats vs hexed enemy", () => {
    // Use mark_of_ruin (cost 1) to hex cheaply, leaving 2 energy for no_mercy (cost 2)
    const run = withHand(startCombat(makeRun(["no_mercy", "mark_of_ruin", "strike", "strike", "strike"])), ["mark_of_ruin", "no_mercy"]);
    const run2 = playCard(run, "mark_of_ruin"); // 1 energy, applies hex 1
    expect(run2.combat.player.energy).toBe(2);
    const hpAfterHex = run2.combat.enemy.health;
    const run3 = playCard(run2, "no_mercy");
    expect(run3.combat.enemy.health).toBe(hpAfterHex - 20); // 10 + repeated 10

    // Without hex: only 10 damage
    const runNoHex = withHand(startCombat(makeRun(["no_mercy", "strike", "strike", "strike", "strike"])), ["no_mercy"]);
    const hpB = runNoHex.combat.enemy.health;
    const runR = playCard(runNoHex, "no_mercy");
    expect(runR.combat.enemy.health).toBe(hpB - 10);
  });

  it("hexburst deals 6 + 4 per hex stack and consumes all hex", () => {
    // Set hex directly to preserve 3 energy for hexburst (cost 2) + mark_of_ruin (cost 1)
    const run = withHand(startCombat(makeRun(["hexburst", "mark_of_ruin", "strike", "strike", "strike"])), ["mark_of_ruin", "hexburst"]);
    const run2 = playCard(run, "mark_of_ruin"); // hex 1, cost 1 → 2 energy left
    const hpBefore = run2.combat.enemy.health;
    const run3 = playCard(run2, "hexburst");
    expect(run3.combat.enemy.health).toBe(hpBefore - (6 + 4 * 1)); // 10 damage
    expect(run3.combat.enemy.hex).toBe(0); // hex consumed
  });

  it("hexburst with 0 hex deals just 6 damage", () => {
    const run = withHand(startCombat(makeRun(["hexburst", "strike", "strike", "strike", "strike"])), ["hexburst"]);
    const hpBefore = run.combat.enemy.health;
    const run2 = playCard(run, "hexburst");
    expect(run2.combat.enemy.health).toBe(hpBefore - 6);
  });
});

// ─── Hex / Exhaust hybrids ────────────────────────────────────────────────────

describe("Hex / Exhaust hybrids", () => {
  it("unseal deals 5 damage; 10 vs hexed enemy. Exhausts.", () => {
    const runNoHex = withHand(startCombat(makeRun(["unseal", "strike", "strike", "strike", "strike"])), ["unseal"]);
    const hpBefore = runNoHex.combat.enemy.health;
    const run2 = playCard(runNoHex, "unseal");
    expect(run2.combat.enemy.health).toBe(hpBefore - 5);
    expect(run2.combat.exhaustPile.some((c) => c.id === "unseal")).toBe(true);

    const runHex = withHand(startCombat(makeRun(["unseal", "mark_of_ruin", "strike", "strike", "strike"])), ["mark_of_ruin", "unseal"]);
    const run3 = playCard(runHex, "mark_of_ruin");
    const hpB2 = run3.combat.enemy.health;
    const run4 = playCard(run3, "unseal");
    expect(run4.combat.enemy.health).toBe(hpB2 - 10);
  });

  it("soul_rend deals 9 damage; if hexed also exhausts a hand card and gains 1 energy", () => {
    // mark_of_ruin (cost 1) to hex, leaving 2 energy for soul_rend (cost 2)
    const run = withHand(startCombat(makeRun(["soul_rend", "mark_of_ruin", "brace", "strike", "strike"])), ["mark_of_ruin", "soul_rend", "brace"]);
    const run2 = playCard(run, "mark_of_ruin"); // hex 1, 2 energy left
    const energyBefore = run2.combat.player.energy;
    const handBefore = run2.combat.hand.length;
    const hpBefore = run2.combat.enemy.health;
    const run3 = playCard(run2, "soul_rend");
    expect(run3.combat.enemy.health).toBe(hpBefore - 9);
    expect(run3.combat.exhaustPile.length).toBe(1);
    expect(run3.combat.hand.length).toBe(handBefore - 2); // played soul_rend + exhausted 1
    expect(run3.combat.player.energy).toBe(energyBefore - 2 + 1); // paid 2, gained 1
  });

  it("soul_rend with no hex only deals damage, no exhaust/energy bonus", () => {
    const run = withHand(startCombat(makeRun(["soul_rend", "strike", "strike", "strike", "strike"])), ["soul_rend"]);
    const hpBefore = run.combat.enemy.health;
    const run2 = playCard(run, "soul_rend");
    expect(run2.combat.enemy.health).toBe(hpBefore - 9);
    expect(run2.combat.exhaustPile.length).toBe(0);
  });

  it("doom_engine: subsequent exhausts apply hex 1 to enemy", () => {
    const run = withHand(startCombat(makeRun(["doom_engine", "capacitor", "strike", "strike", "strike"])), ["doom_engine", "capacitor"]);
    const run2 = playCard(run, "doom_engine");
    expect(run2.combat.doom_engine_active).toBe(true);
    const hexBefore = run2.combat.enemy.hex || 0;
    const run3 = playCard(run2, "capacitor"); // exhaust capacitor
    expect(run3.combat.enemy.hex).toBe(hexBefore + 1); // doom_engine triggered
  });

  it("doom_engine resets at turn end", () => {
    const run = withHand(startCombat(makeRun(["doom_engine", "strike", "strike", "strike", "strike"])), ["doom_engine"]);
    const run2 = playCard(run, "doom_engine");
    expect(run2.combat.doom_engine_active).toBe(true);
    const run3 = endCombatTurn(run2);
    expect(run3.combat.doom_engine_active).toBe(false);
  });

  it("ritual_collapse exhausts up to 2 hand cards and applies hex per exhaust", () => {
    const run = withHand(startCombat(makeRun(["ritual_collapse", "strike", "strike", "strike", "strike"])), ["ritual_collapse", "strike", "strike"]);
    const hexBefore = run.combat.enemy.hex || 0;
    const handBefore = run.combat.hand.length;
    const run2 = playCard(run, "ritual_collapse");
    expect(run2.combat.exhaustPile.length).toBe(2); // 2 exhausted
    expect(run2.combat.hand.length).toBe(handBefore - 3); // played + 2 exhausted
    expect(run2.combat.enemy.hex).toBe(hexBefore + 2); // 1 hex per exhaust
  });

  it("doom_bell applies hex 2 and exhausts all skills in hand", () => {
    const run = withHand(startCombat(makeRun(["doom_bell", "brace", "insight", "strike", "strike"])), ["doom_bell", "brace", "insight", "strike"]);
    const hexBefore = run.combat.enemy.hex || 0;
    const run2 = playCard(run, "doom_bell");
    expect(run2.combat.enemy.hex).toBe(hexBefore + 2);
    // brace and insight are skills → exhausted; strike is attack → stays in hand
    const exhaustedIds = run2.combat.exhaustPile.map((c) => c.id);
    expect(exhaustedIds).toContain("brace");
    expect(exhaustedIds).toContain("insight");
    expect(run2.combat.hand.some((c) => c.id === "strike")).toBe(true);
  });
});

// ─── Defense / utility ────────────────────────────────────────────────────────

describe("Defense / utility", () => {
  it("hollow_ward gains 8 block and exhausts", () => {
    const run = withHand(startCombat(makeRun(["hollow_ward", "strike", "strike", "strike", "strike"])), ["hollow_ward"]);
    const blockBefore = run.combat.player.block;
    const run2 = playCard(run, "hollow_ward");
    expect(run2.combat.player.block).toBe(blockBefore + 8);
    expect(run2.combat.exhaustPile.some((c) => c.id === "hollow_ward")).toBe(true);
  });

  it("refrain gains 4 block and returns to hand next turn", () => {
    const run = withHand(startCombat(makeRun(["refrain", "strike", "strike", "strike", "strike"])), ["refrain"]);
    const blockBefore = run.combat.player.block;
    const run2 = playCard(run, "refrain");
    expect(run2.combat.player.block).toBe(blockBefore + 4);
    expect(run2.combat.returnPile.some((c) => c.id === "refrain")).toBe(true);
    // After end of turn, refrain should be in hand
    const run3 = endCombatTurn(run2);
    expect(run3.combat.hand.some((c) => c.id === "refrain")).toBe(true);
    expect(run3.combat.returnPile.length).toBe(0);
  });

  it("warding_circle gains 12 block; costs 1 less if hexed", () => {
    const run = withHand(startCombat(makeRun(["warding_circle", "strike", "strike", "strike", "strike"])), ["warding_circle"]);
    const blockBefore = run.combat.player.block;
    const run2 = playCard(run, "warding_circle"); // cost 2
    expect(run2.combat.player.block).toBe(blockBefore + 12);
    expect(run2.combat.player.energy).toBe(1); // 3 - 2 = 1

    // With hex: cost is 1
    const runH = withHand(startCombat(makeRun(["warding_circle", "mark_of_ruin", "strike", "strike", "strike"])), ["mark_of_ruin", "warding_circle"]);
    const run3 = playCard(runH, "mark_of_ruin");
    const energyBefore = run3.combat.player.energy;
    const run4 = playCard(run3, "warding_circle");
    expect(run4.combat.player.energy).toBe(energyBefore - 1); // cost reduced to 1
  });

  it("last_word deals 8 damage normally; 20 damage when last card in hand", () => {
    // Not last card
    const run = withHand(startCombat(makeRun(["last_word", "strike", "strike", "strike", "strike"])), ["last_word", "strike"]);
    const hpBefore = run.combat.enemy.health;
    const run2 = playCard(run, "last_word");
    expect(run2.combat.enemy.health).toBe(hpBefore - 8);

    // Last card
    const runL = withHand(startCombat(makeRun(["last_word", "strike", "strike", "strike", "strike"])), ["last_word"]);
    const hpB2 = runL.combat.enemy.health;
    const run3 = playCard(runL, "last_word");
    expect(run3.combat.enemy.health).toBe(hpB2 - 20); // 8 + 12 bonus
  });
});

// ─── Registry completeness ─────────────────────────────────────────────────────

describe("card registry completeness after Milestone 10", () => {
  it("no cards have status missing", () => {
    expect(MISSING_CARD_IDS.length).toBe(0);
  });

  it("all 24 newly implemented cards are in IMPLEMENTED_CARD_IDS", () => {
    const newCards = [
      "static_guard", "capacitor", "release", "guarded_pulse", "flashstep",
      "overclock", "ashen_blow", "final_draft", "scorch_nerves", "cinder_rush", "empty_the_chamber",
      "curse_spiral", "cataclysm_sigil", "no_mercy", "hexburst",
      "soul_rend", "doom_engine", "unseal", "ritual_collapse", "doom_bell",
      "hollow_ward", "refrain", "warding_circle", "last_word"
    ];
    for (const id of newCards) {
      expect(IMPLEMENTED_CARD_IDS).toContain(id);
    }
  });

  it("total implemented card count is 60 (all cards implemented)", () => {
    expect(IMPLEMENTED_CARD_IDS.length).toBe(60);
  });
});
