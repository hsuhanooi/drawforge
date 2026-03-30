const {
  CARD_REGISTRY,
  DESIGNED_CARD_SET,
  STARTER_CARD_IDS,
  DESIGNED_CARD_IDS,
  IMPLEMENTED_CARD_IDS,
  MISSING_CARD_IDS
} = require("../src/cardRegistry");

describe("card registry", () => {
  it("contains the canonical designed set plus 2 starter cards", () => {
    expect(DESIGNED_CARD_SET).toHaveLength(72);
    expect(STARTER_CARD_IDS).toEqual(["strike", "defend"]);
    expect(CARD_REGISTRY).toHaveLength(74);
  });

  it("tracks implemented vs missing cards explicitly", () => {
    expect(new Set(IMPLEMENTED_CARD_IDS).size).toBe(IMPLEMENTED_CARD_IDS.length);
    expect(new Set(MISSING_CARD_IDS).size).toBe(MISSING_CARD_IDS.length);
    expect(IMPLEMENTED_CARD_IDS.length + MISSING_CARD_IDS.length).toBe(CARD_REGISTRY.length);
  });

  it("tracks designed-card IDs separately from starter IDs", () => {
    expect(DESIGNED_CARD_IDS).not.toContain("strike");
    expect(DESIGNED_CARD_IDS).not.toContain("defend");
    expect(DESIGNED_CARD_IDS.length + STARTER_CARD_IDS.length).toBe(CARD_REGISTRY.length);
  });

  it("keeps stable identity fields for every card", () => {
    for (const card of CARD_REGISTRY) {
      expect(card).toHaveProperty("id");
      expect(card).toHaveProperty("name");
      expect(card).toHaveProperty("cost");
      expect(card).toHaveProperty("type");
      expect(card).toHaveProperty("effectText");
      expect(card).toHaveProperty("rarity");
      expect(card).toHaveProperty("archetype");
      expect(["implemented", "missing"]).toContain(card.status);
    }
  });
});
