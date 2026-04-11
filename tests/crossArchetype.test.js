const { createCardCatalog } = require("../src/cardCatalog");
const { createBrowserRun, chooseArchetype } = require("../src/browserRunActions");
const { startCombatForNode, playCombatCard } = require("../src/browserCombatActions");

const CARD_CATALOG = createCardCatalog();
const combatNode = { id: "r0c0", row: 0, col: 0, type: "combat", next: [] };

const makeRunWithHand = (cards) => {
  const run = chooseArchetype(createBrowserRun(), "hex_witch");
  const combat = startCombatForNode(run, combatNode);
  combat.hand = cards.map((id) => ({ ...CARD_CATALOG[id] }));
  combat.player.energy = 3;
  combat.enemyIntent = { type: "block", value: 0, label: "Wait" };
  return { ...run, combat };
};

describe("cross-archetype card catalog entries", () => {
  it("caustic_inferno has damage 8 and bonusVsPoisonAndBurn 10", () => {
    const card = CARD_CATALOG["caustic_inferno"];
    expect(card.damage).toBe(8);
    expect(card.bonusVsPoisonAndBurn).toBe(10);
    expect(card.rarity).toBe("rare");
    expect(card.archetype).toBe("Poison / Burn");
  });

  it("volatile_compound applies Poison 2 and Burn 2", () => {
    const card = CARD_CATALOG["volatile_compound"];
    expect(card.applyPoison).toBe(2);
    expect(card.applyBurn).toBe(2);
    expect(card.rarity).toBe("uncommon");
  });

  it("charged_toxin has damage 6 and applyPoisonIfCharged 3", () => {
    const card = CARD_CATALOG["charged_toxin"];
    expect(card.damage).toBe(6);
    expect(card.applyPoisonIfCharged).toBe(3);
  });

  it("hex_blight has hex 1 and poisonPerHex 1", () => {
    const card = CARD_CATALOG["hex_blight"];
    expect(card.hex).toBe(1);
    expect(card.poisonPerHex).toBe(1);
  });

  it("shocking_brand has damage 5, setCharged true, applyBurn 2", () => {
    const card = CARD_CATALOG["shocking_brand"];
    expect(card.damage).toBe(5);
    expect(card.setCharged).toBe(true);
    expect(card.applyBurn).toBe(2);
  });

  it("all five cross-archetype cards derive relevant keywords", () => {
    expect(CARD_CATALOG["caustic_inferno"].keywords.map((k) => k.key)).toContain("Poison");
    expect(CARD_CATALOG["caustic_inferno"].keywords.map((k) => k.key)).toContain("Burn");
    expect(CARD_CATALOG["volatile_compound"].keywords.map((k) => k.key)).toContain("Poison");
    expect(CARD_CATALOG["volatile_compound"].keywords.map((k) => k.key)).toContain("Burn");
    expect(CARD_CATALOG["charged_toxin"].keywords.map((k) => k.key)).toContain("Charged");
    expect(CARD_CATALOG["hex_blight"].keywords.map((k) => k.key)).toContain("Hex");
    expect(CARD_CATALOG["shocking_brand"].keywords.map((k) => k.key)).toContain("Charged");
    expect(CARD_CATALOG["shocking_brand"].keywords.map((k) => k.key)).toContain("Burn");
  });
});

describe("caustic_inferno combat behavior", () => {
  it("deals base 8 damage when enemy has no Poison or Burn", () => {
    const run = makeRunWithHand(["caustic_inferno"]);
    run.combat.enemy.health = 30;
    run.combat.enemy.poison = 0;
    run.combat.enemy.burn = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.health).toBe(22); // 30 - 8
  });

  it("deals 18 damage when enemy has both Poison and Burn stacks", () => {
    const run = makeRunWithHand(["caustic_inferno"]);
    run.combat.enemy.health = 40;
    run.combat.enemy.poison = 5;
    run.combat.enemy.burn = 3;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.health).toBe(22); // 40 - 8 - 10 = 22
  });

  it("deals only base 8 damage when enemy has Poison but no Burn", () => {
    const run = makeRunWithHand(["caustic_inferno"]);
    run.combat.enemy.health = 30;
    run.combat.enemy.poison = 5;
    run.combat.enemy.burn = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.health).toBe(22); // 30 - 8
  });

  it("deals only base 8 damage when enemy has Burn but no Poison", () => {
    const run = makeRunWithHand(["caustic_inferno"]);
    run.combat.enemy.health = 30;
    run.combat.enemy.poison = 0;
    run.combat.enemy.burn = 3;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.health).toBe(22); // 30 - 8
  });
});

describe("volatile_compound combat behavior", () => {
  it("applies Poison 2 and Burn 2 to enemy", () => {
    const run = makeRunWithHand(["volatile_compound"]);
    run.combat.enemy.poison = 0;
    run.combat.enemy.burn = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.poison).toBe(2);
    expect(after.combat.enemy.burn).toBe(2);
  });

  it("stacks with existing Poison and Burn", () => {
    const run = makeRunWithHand(["volatile_compound"]);
    run.combat.enemy.poison = 3;
    run.combat.enemy.burn = 4;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.poison).toBe(5);
    expect(after.combat.enemy.burn).toBe(6);
  });
});

describe("charged_toxin combat behavior", () => {
  it("applies Poison 3 when player is Charged", () => {
    const run = makeRunWithHand(["charged_toxin"]);
    run.combat.player.charged = true;
    run.combat.enemy.health = 30;
    run.combat.enemy.poison = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.poison).toBe(3);
    expect(after.combat.enemy.health).toBe(24); // 30 - 6
  });

  it("does not apply Poison when player is not Charged", () => {
    const run = makeRunWithHand(["charged_toxin"]);
    run.combat.player.charged = false;
    run.combat.enemy.health = 30;
    run.combat.enemy.poison = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.poison).toBe(0);
    expect(after.combat.enemy.health).toBe(24); // 30 - 6
  });
});

describe("hex_blight combat behavior", () => {
  it("applies 1 Hex and 1 Poison when enemy has no hex stacks", () => {
    const run = makeRunWithHand(["hex_blight"]);
    run.combat.enemy.hex = 0;
    run.combat.enemy.poison = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.hex).toBe(1);
    expect(after.combat.enemy.poison).toBe(1); // min 1 even with 0 hex
  });

  it("applies 1 Hex then Poison equal to the post-card hex total", () => {
    // hex is applied first (4→5), then poisonPerHex reads the updated 5 stacks
    const run = makeRunWithHand(["hex_blight"]);
    run.combat.enemy.hex = 4;
    run.combat.enemy.poison = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.hex).toBe(5);
    expect(after.combat.enemy.poison).toBe(5); // reads updated 5 hex stacks
  });
});

describe("shocking_brand combat behavior", () => {
  it("deals 5 damage, sets Charged, and applies Burn 2", () => {
    const run = makeRunWithHand(["shocking_brand"]);
    run.combat.player.charged = false;
    run.combat.enemy.health = 30;
    run.combat.enemy.burn = 0;
    const after = playCombatCard(run, 0);
    expect(after.combat.enemy.health).toBe(25); // 30 - 5
    expect(after.combat.player.charged).toBe(true);
    expect(after.combat.enemy.burn).toBe(2);
  });
});

describe("cross-archetype cards are in reward pool", () => {
  it("caustic_inferno, volatile_compound, charged_toxin, hex_blight, shocking_brand are in REWARD_POOL", () => {
    const { REWARD_POOL } = require("../src/cards");
    const ids = REWARD_POOL.map((f) => f().id);
    expect(ids).toContain("caustic_inferno");
    expect(ids).toContain("volatile_compound");
    expect(ids).toContain("charged_toxin");
    expect(ids).toContain("hex_blight");
    expect(ids).toContain("shocking_brand");
  });
});
