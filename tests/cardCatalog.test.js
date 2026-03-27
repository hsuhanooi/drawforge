const { createCardCatalog } = require("../src/cardCatalog");

describe("card catalog", () => {
  it("returns renderable card metadata without effect functions", () => {
    const catalog = createCardCatalog();

    expect(catalog.strike).toBeDefined();
    expect(catalog.strike.name).toBe("Strike");
    expect(catalog.strike.effect).toBeUndefined();
    expect(catalog.spite_shield.name).toBe("Spite Shield");
    expect(catalog.spite_shield.rarity).toBe("uncommon");
  });
});
