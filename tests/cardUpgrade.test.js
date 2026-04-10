const { UPGRADE_ID_MAP, getUpgradedId, canUpgrade, upgradeCardInDeck, UPGRADED_CARD_ENTRIES } = require("../src/cardUpgrade");
const { createCardCatalog } = require("../src/cardCatalog");
const { upgradeCard } = require("../src/browserPostNodeActions");

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

  it("covers more than 40 upgrade mappings for the expanded campfire system", () => {
    expect(Object.keys(UPGRADE_ID_MAP)).toHaveLength(41);
    expect(UPGRADED_CARD_ENTRIES).toHaveLength(41);
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
