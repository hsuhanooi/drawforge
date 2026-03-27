const {
  RELIC_REGISTRY,
  DESIGNED_RELIC_SET,
  IMPLEMENTED_RELIC_IDS,
  MISSING_RELIC_IDS
} = require("../src/relicRegistry");

describe("relic registry", () => {
  it("contains the canonical 39-relic designed set", () => {
    expect(DESIGNED_RELIC_SET).toHaveLength(39);
    expect(RELIC_REGISTRY).toHaveLength(39);
  });

  it("tracks implemented vs missing relics explicitly", () => {
    expect(new Set(IMPLEMENTED_RELIC_IDS).size).toBe(IMPLEMENTED_RELIC_IDS.length);
    expect(new Set(MISSING_RELIC_IDS).size).toBe(MISSING_RELIC_IDS.length);
    expect(IMPLEMENTED_RELIC_IDS.length + MISSING_RELIC_IDS.length).toBe(RELIC_REGISTRY.length);
  });

  it("keeps stable identity fields for every relic", () => {
    for (const relic of RELIC_REGISTRY) {
      expect(relic).toHaveProperty("id");
      expect(relic).toHaveProperty("name");
      expect(relic).toHaveProperty("rarity");
      expect(relic).toHaveProperty("tier");
      expect(relic).toHaveProperty("effectText");
      expect(["implemented", "missing"]).toContain(relic.status);
    }
  });
});
