const { UPGRADE_ID_MAP, getUpgradedId, canUpgrade, upgradeCardInDeck, UPGRADED_CARD_ENTRIES } = require("../src/cardUpgrade");
const { createCardCatalog } = require("../src/cardCatalog");
const { upgradeCard } = require("../src/browserPostNodeActions");
const { createBrowserRun, chooseArchetype } = require("../src/browserRunActions");
const { startCombatForNode, endCombatTurn, playCombatCard } = require("../src/browserCombatActions");

const makeMap = () => ({
  nodes: [{ id: "r0c0", row: 0, col: 0, type: "rest", next: [] }],
  currentNodeId: "r0c0"
});

const makeRun = (deck = ["strike", "defend"]) => ({
  player: { health: 70, maxHealth: 70, deck, gold: 50 },
  relics: [],
  map: makeMap(),
  state: "in_progress",
  combat: null,
  pendingRewards: null,
  event: { kind: "campfire", options: [] }
});

describe("cardUpgrade module", () => {
  it("canUpgrade returns true for starter and milestone upgrade cards", () => {
    expect(canUpgrade("strike")).toBe(true);
    expect(canUpgrade("defend")).toBe(true);
    expect(canUpgrade("hex")).toBe(true);
    expect(canUpgrade("deep_hex")).toBe(true);
    expect(canUpgrade("fire_sale")).toBe(true);
    expect(canUpgrade("charge_up")).toBe(true);
    expect(canUpgrade("venom_strike")).toBe(true);
    expect(canUpgrade("heavy_swing")).toBe(true);
  });

  it("canUpgrade returns false for non-upgradeable cards and already-upgraded cards", () => {
    expect(canUpgrade("parasite")).toBe(false);
    expect(canUpgrade("strike_plus")).toBe(false);
  });

  it("getUpgradedId returns the correct upgraded card ID", () => {
    expect(getUpgradedId("strike")).toBe("strike_plus");
    expect(getUpgradedId("defend")).toBe("defend_plus");
    expect(getUpgradedId("hex")).toBe("hex_plus");
  });

  it("getUpgradedId returns null for non-upgradeable cards", () => {
    expect(getUpgradedId("parasite")).toBeNull();
    expect(getUpgradedId("strike_plus")).toBeNull();
  });

  it("upgradeCardInDeck replaces the card at the given index", () => {
    const deck = ["strike", "defend", "strike"];
    const result = upgradeCardInDeck(deck, 0);
    expect(result).toEqual(["strike_plus", "defend", "strike"]);
  });

  it("upgradeCardInDeck replaces a specific index without affecting others", () => {
    const deck = ["strike", "defend", "strike"];
    const result = upgradeCardInDeck(deck, 2);
    expect(result).toEqual(["strike", "defend", "strike_plus"]);
  });

  it("upgradeCardInDeck throws if card cannot be upgraded", () => {
    const deck = ["parasite"];
    expect(() => upgradeCardInDeck(deck, 0)).toThrow();
  });

  it("upgradeCardInDeck throws if index is out of bounds", () => {
    const deck = ["strike"];
    expect(() => upgradeCardInDeck(deck, 5)).toThrow();
  });
});

describe("upgraded card catalog entries", () => {
  it("all upgraded cards are present in the catalog", () => {
    const catalog = createCardCatalog();
    for (const card of UPGRADED_CARD_ENTRIES) {
      expect(catalog[card.id]).toBeDefined();
      expect(catalog[card.id].name).toContain("+");
    }
  });

  it("covers the expanded power, defense, remaining upgrade sweep, and cross-archetype cards", () => {
    expect(Object.keys(UPGRADE_ID_MAP)).toHaveLength(81);
    expect(UPGRADED_CARD_ENTRIES).toHaveLength(81);
  });

  it("strike_plus deals more damage than strike", () => {
    const catalog = createCardCatalog();
    expect(catalog["strike_plus"].damage).toBeGreaterThan(catalog["strike"].damage);
  });

  it("defend_plus gives more block than defend", () => {
    const catalog = createCardCatalog();
    expect(catalog["defend_plus"].block).toBeGreaterThan(catalog["defend"].block);
  });

  it("hex_plus costs 0 energy", () => {
    const catalog = createCardCatalog();
    expect(catalog["hex_plus"].cost).toBe(0);
  });

  it("includes meaningful upgrades for Living Spire archetype cards", () => {
    const catalog = createCardCatalog();
    expect(catalog["deep_hex_plus"].hex).toBeGreaterThan(catalog["deep_hex"].hex);
    expect(catalog["fire_sale_plus"].draw).toBeGreaterThan(catalog["fire_sale"].draw);
    expect(catalog["charge_up_plus"].draw).toBeGreaterThan(catalog["charge_up"].draw);
    expect(catalog["venom_strike_plus"].applyPoison).toBeGreaterThan(catalog["venom_strike"].applyPoison);
    expect(catalog["ember_throw_plus"].applyBurn).toBeGreaterThan(catalog["ember_throw"].applyBurn);
    expect(catalog["heavy_swing_plus"].damage).toBeGreaterThan(catalog["heavy_swing"].damage);
    expect(catalog["iron_will_plus"].dexPerTurn).toBe(2);
    expect(catalog["burning_aura_plus"].auraDamage).toBe(5);
    expect(catalog["hex_resonance_plus"].cost).toBe(0);
    expect(catalog["weak_field_plus"].weakPerTurn).toBe(2);
    expect(catalog["dark_pact_plus"].hpLossPerTurn).toBe(1);
    expect(catalog["vampiric_aura_plus"].healOnAttack).toBe(3);
    expect(catalog["brace_plus"].block).toBe(10);
    expect(catalog["parry_plus"].block).toBe(5);
    expect(catalog["spite_shield_plus"].hex).toBe(2);
    expect(catalog["hollow_ward_plus"].block).toBe(12);
    expect(catalog["refrain_plus"].returnToHand).toBe(true);
    expect(catalog["last_word_plus"].bonusIfLastCard).toBe(12);
    expect(catalog["septic_touch_plus"].applyWeak).toBe(2);
    expect(catalog["infectious_wound_plus"].damage).toBe(6);
    expect(catalog["kindle_plus"].applyBurn).toBe(5);
    expect(catalog["smoldering_brand_plus"].applyWeak).toBe(2);
    expect(catalog["funeral_pyre_plus"].applyBurn).toBe(6);
    expect(catalog["harvester_plus"].damage).toBe(6);
    expect(catalog["cripple_plus"].cost).toBe(0);
    expect(catalog["pressure_point_plus"].applyVulnerable).toBe(2);
    expect(catalog["enervate_plus"].applyWeak).toBe(3);
    expect(catalog["echo_strike_plus"].bonusVsVulnerable).toBe(9);
    expect(catalog["titan_strike_plus"].bonusPerStrength).toBe(3);
    expect(catalog["ashen_blow_plus"].damage).toBe(10);
    expect(catalog["scorch_nerves_plus"].damage).toBe(20);
    expect(catalog["final_draft_plus"].draw).toBe(3);
    expect(catalog["doom_engine_plus"].cost).toBe(0);
    expect(catalog["plan_ahead_plus"].draw).toBe(3);
    // Cross-archetype upgrades
    expect(catalog["caustic_inferno_plus"].bonusVsPoisonAndBurn).toBe(12);
    expect(catalog["volatile_compound_plus"].applyPoison).toBe(3);
    expect(catalog["charged_toxin_plus"].damage).toBe(8);
    expect(catalog["hex_blight_plus"].hex).toBe(2);
    expect(catalog["shocking_brand_plus"].damage).toBe(7);
  });
});

describe("upgraded power behavior", () => {
  const combatNode = { id: "r0c0", row: 0, col: 0, type: "combat", next: [] };

  it("iron_will_plus grants 2 dexterity at turn start", () => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    const combat = startCombatForNode(run, combatNode);
    combat.enemyIntent = { type: "block", value: 0, label: "Wait" };
    combat.powers = [{ id: "iron_will_plus", label: "Iron Will+", ...createCardCatalog()["iron_will_plus"] }];

    const afterTurn = endCombatTurn({ ...run, combat });
    expect(afterTurn.combat.player.dexterity).toBe(2);
  });

  it("burning_aura_plus deals 5 damage at turn start", () => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    const combat = startCombatForNode(run, combatNode);
    combat.enemyIntent = { type: "block", value: 0, label: "Wait" };
    combat.enemy.health = 20;
    combat.powers = [{ id: "burning_aura_plus", label: "Burning Aura+", ...createCardCatalog()["burning_aura_plus"] }];

    const afterTurn = endCombatTurn({ ...run, combat });
    expect(afterTurn.combat.enemy.health).toBe(15);
  });

  it("vampiric_aura_plus heals 3 when attack damage lands", () => {
    const run = chooseArchetype(createBrowserRun(), "hex_witch");
    const combat = startCombatForNode(run, combatNode);
    combat.player.health = 50;
    combat.player.energy = 3;
    combat.enemyIntent = { type: "block", value: 0, label: "Wait" };
    combat.hand = [{ ...createCardCatalog().strike }];
    combat.powers = [{ id: "vampiric_aura_plus", label: "Vampiric Aura+", ...createCardCatalog()["vampiric_aura_plus"] }];

    const afterPlay = playCombatCard({ ...run, combat }, 0);
    expect(afterPlay.combat.player.health).toBe(53);
  });
});

describe("upgradeCard run action", () => {
  it("replaces the card in the player deck", () => {
    const run = makeRun(["strike", "defend"]);
    const result = upgradeCard(run, 0);
    expect(result.player.deck[0]).toBe("strike_plus");
    expect(result.player.deck[1]).toBe("defend");
  });

  it("clears the campfire event after upgrading", () => {
    const run = makeRun(["strike", "defend"]);
    const result = upgradeCard(run, 0);
    expect(result.event).toBeNull();
  });

  it("throws if deckIndex refers to a non-upgradeable card", () => {
    const run = makeRun(["parasite"]);
    expect(() => upgradeCard(run, 0)).toThrow();
  });

  it("upgrades newly added archetype cards through the same campfire action", () => {
    const run = makeRun(["deep_hex", "fire_sale", "charge_up"]);
    const result = upgradeCard(run, 1);
    expect(result.player.deck).toEqual(["deep_hex", "fire_sale_plus", "charge_up"]);
  });
});
