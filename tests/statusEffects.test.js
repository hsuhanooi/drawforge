const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");

const { toRenderableCard } = require("../src/cardCatalog");

const makeNode = (type = "combat") => ({ id: "r0c0", row: 0, col: 0, type, next: [] });

const makeRun = (relics = []) => ({
  player: { health: 80, maxHealth: 80, deck: ["strike", "defend"], gold: 50 },
  relics,
  phoenix_used: false
});

// startCombatForNode returns a combat state; wrap into run shape for playCombatCard/endCombatTurn
const startCombat = (run, node) => ({ ...run, combat: startCombatForNode(run, node) });

const getCard = (combat, id) => {
  const idx = combat.hand.findIndex((c) => c.id === id);
  return { idx, card: combat.hand[idx] };
};

const injectHand = (run, cards) => ({
  ...run,
  combat: {
    ...run.combat,
    hand: cards.map((c) => toRenderableCard(c)),
    drawPile: []
  }
});

describe("Status effects: Strength", () => {
  it("adds flat damage to attack cards", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["strike"]);
    withCombat.combat.player.strength = 3;
    const enemyHpBefore = withCombat.combat.enemy.health;
    const { idx } = getCard(withCombat.combat, "strike");
    const result = playCombatCard(withCombat, idx);
    // Strike deals 6 + 3 strength = 9 damage
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 9);
  });

  it("does not add to skill/block cards", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["defend"]);
    withCombat.combat.player.strength = 3;
    const blockBefore = withCombat.combat.player.block;
    const { idx } = getCard(withCombat.combat, "defend");
    const result = playCombatCard(withCombat, idx);
    // Defend gives 5 block + 0 dexterity = 5; strength does not add
    expect(result.combat.player.block).toBe(blockBefore + 5);
  });

  it("war_cry card grants 2 Strength", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["war_cry"]);
    const { idx } = getCard(withCombat.combat, "war_cry");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.player.strength).toBe(2);
  });

  it("warlords_brand relic grants +1 extra Strength when applying Strength", () => {
    const node = makeNode();
    const run = makeRun([{ id: "warlords_brand" }]);
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["war_cry"]);
    const { idx } = getCard(withCombat.combat, "war_cry");
    const result = playCombatCard(withCombat, idx);
    // War Cry gives 2, +1 from brand = 3
    expect(result.combat.player.strength).toBe(3);
  });
});

describe("Status effects: Dexterity", () => {
  it("adds to block from block cards", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["defend"]);
    withCombat.combat.player.dexterity = 2;
    const blockBefore = withCombat.combat.player.block;
    const { idx } = getCard(withCombat.combat, "defend");
    const result = playCombatCard(withCombat, idx);
    // Defend gives 5 + 2 dex = 7
    expect(result.combat.player.block).toBe(blockBefore + 7);
  });

  it("fortify card grants 2 Dexterity", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["fortify"]);
    const { idx } = getCard(withCombat.combat, "fortify");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.player.dexterity).toBe(2);
  });
});

describe("Status effects: Vulnerable", () => {
  it("expose card applies 2 Vulnerable to enemy", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["expose"]);
    const { idx } = getCard(withCombat.combat, "expose");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.enemy.vulnerable).toBe(2);
  });

  it("increases damage dealt to enemy by 50%", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["strike"]);
    withCombat.combat.enemy.vulnerable = 1;
    const enemyHpBefore = withCombat.combat.enemy.health;
    const { idx } = getCard(withCombat.combat, "strike");
    const result = playCombatCard(withCombat, idx);
    // Strike 6 × 1.5 = 9 (floor)
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 9);
  });

  it("decays by 1 at end of turn", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat.combat.enemy.vulnerable = 2;
    const result = endCombatTurn(withCombat);
    expect(result.combat.enemy.vulnerable).toBe(1);
  });

  it("does not go below 0 on decay", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat.combat.enemy.vulnerable = 0;
    const result = endCombatTurn(withCombat);
    expect(result.combat.enemy.vulnerable).toBe(0);
  });
});

describe("Status effects: Weak", () => {
  it("cripple card applies 2 Weak to enemy", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["cripple"]);
    const { idx } = getCard(withCombat.combat, "cripple");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.enemy.weak).toBe(2);
  });

  it("reduces enemy attack damage by 25% when enemy is Weak", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    // Give player full HP, known enemy damage
    withCombat.combat.enemy.intents = [{ type: "attack", value: 8, label: "Swing for 8" }];
    withCombat.combat.enemyIntent = { type: "attack", value: 8, label: "Swing for 8" };
    withCombat.combat.enemy.weak = 1;
    const playerHpBefore = withCombat.combat.player.health;
    const result = endCombatTurn(withCombat);
    // 8 × 0.75 = 6 damage (floor)
    expect(result.combat.player.health).toBe(playerHpBefore - 6);
  });

  it("player Weak reduces player attack damage by 25%", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["strike"]);
    withCombat.combat.player.weak = 1;
    const enemyHpBefore = withCombat.combat.enemy.health;
    const { idx } = getCard(withCombat.combat, "strike");
    const result = playCombatCard(withCombat, idx);
    // Strike 6 × 0.75 = 4 (floor)
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 4);
  });

  it("player Weak decays by 1 at end of turn", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat.combat.player.weak = 2;
    const result = endCombatTurn(withCombat);
    expect(result.combat.player.weak).toBe(1);
  });
});

describe("Status effects: combined", () => {
  it("Vulnerable + Strength both apply to a single attack", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["strike"]);
    withCombat.combat.player.strength = 2;
    withCombat.combat.enemy.vulnerable = 1;
    const enemyHpBefore = withCombat.combat.enemy.health;
    const { idx } = getCard(withCombat.combat, "strike");
    const result = playCombatCard(withCombat, idx);
    // Strike 6 + 2 str = 8, then × 1.5 = 12
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 12);
  });

  it("cracked_lens relic starts enemy with 1 Vulnerable", () => {
    const node = makeNode();
    const run = makeRun([{ id: "cracked_lens" }]);
    const withCombat = startCombat(run, node);
    expect(withCombat.combat.enemy.vulnerable).toBe(1);
  });

  it("iron_boots relic starts player with 1 Strength", () => {
    const node = makeNode();
    const run = makeRun([{ id: "iron_boots" }]);
    const withCombat = startCombat(run, node);
    expect(withCombat.combat.player.strength).toBe(1);
  });

  it("nimble_cloak relic starts player with 1 Dexterity", () => {
    const node = makeNode();
    const run = makeRun([{ id: "nimble_cloak" }]);
    const withCombat = startCombat(run, node);
    expect(withCombat.combat.player.dexterity).toBe(1);
  });
});

describe("New status effect cards: titan_strike and exploit", () => {
  it("titan_strike deals 8 + 2 per strength", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["titan_strike"]);
    withCombat.combat.player.strength = 2;
    const enemyHpBefore = withCombat.combat.enemy.health;
    const { idx } = getCard(withCombat.combat, "titan_strike");
    const result = playCombatCard(withCombat, idx);
    // 8 (base) + 2 (strength flat) + 2×2 (bonusPerStrength) = 14
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 14);
  });

  it("exploit deals 22 damage vs Vulnerable enemy", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["exploit"]);
    withCombat.combat.enemy.vulnerable = 1;
    const enemyHpBefore = withCombat.combat.enemy.health;
    const { idx } = getCard(withCombat.combat, "exploit");
    const result = playCombatCard(withCombat, idx);
    // 6 (base) + 9 (bonusVsVulnerable) = 15, then × 1.5 = 22 (floor)
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 22);
  });

  it("exploit deals 6 damage normally", () => {
    const node = makeNode();
    const run = makeRun();
    let withCombat = startCombat(run, node);
    withCombat = injectHand(withCombat, ["exploit"]);
    const enemyHpBefore = withCombat.combat.enemy.health;
    const { idx } = getCard(withCombat.combat, "exploit");
    const result = playCombatCard(withCombat, idx);
    expect(result.combat.enemy.health).toBe(enemyHpBefore - 6);
  });
});
