const { RELICS, createRelicReward, addRelicToRun, getCombatEnergyBonus } = require("../src/relics");

describe("relic system", () => {
  it("creates deterministic relic rewards", () => {
    const relic = createRelicReward(1);

    expect(relic).toHaveProperty("id");
    expect(relic).toHaveProperty("name");
  });

  it("applies relic effects to the run", () => {
    const run = {
      player: { health: 80, gold: 99 },
      relics: []
    };

    const ironCore = RELICS.find((r) => r.id === "iron_core");
    const healed = addRelicToRun(run, ironCore);
    expect(healed.player.health).toBe(85);
  });

  it("grants combat energy bonus from ember ring", () => {
    const emberRing = RELICS.find((r) => r.id === "ember_ring");
    const run = { relics: [emberRing] };

    expect(getCombatEnergyBonus(run)).toBe(1);
  });

  it("does not grant energy bonus when ember ring is absent", () => {
    const ironCore = RELICS.find((r) => r.id === "iron_core");
    const run = { relics: [ironCore] };

    expect(getCombatEnergyBonus(run)).toBe(0);
  });

  it("all relics have a rarity field", () => {
    const validRarities = new Set(["common", "uncommon", "rare", "boss", "starter"]);
    for (const relic of RELICS) {
      expect(validRarities.has(relic.rarity)).toBe(true);
    }
  });

  it("has 45 relics total (44 reward relics + plague_sigil starter)", () => {
    expect(RELICS).toHaveLength(45);
  });

  it("derives relic descriptions and metadata from the canonical registry", () => {
    const burnoutCoil = RELICS.find((r) => r.id === "burnout_coil");
    expect(burnoutCoil.description).toBe(burnoutCoil.effectText);
    expect(burnoutCoil.triggerType).toBe("triggered");
    expect(burnoutCoil.assetRef).toBe("relics/burnout_coil");
    expect(burnoutCoil.status).toBe("implemented");
  });

  it("tier 1 reward (elite) only returns common or uncommon relics", () => {
    // Run many samples to verify no rare ever comes from tier 1
    for (let i = 0; i < 50; i += 1) {
      const relic = createRelicReward(1);
      expect(["common", "uncommon"]).toContain(relic.rarity);
    }
  });

  it("tier 2 reward (boss) only returns uncommon or rare relics", () => {
    // Run many samples to verify no common ever comes from tier 2
    for (let i = 0; i < 50; i += 1) {
      const relic = createRelicReward(2);
      expect(["uncommon", "rare"]).toContain(relic.rarity);
    }
  });

  it("bone token has no immediate health effect on acquisition", () => {
    const run = { player: { health: 80, gold: 99 }, relics: [] };
    const boneToken = RELICS.find((r) => r.id === "bone_token");
    const result = addRelicToRun(run, boneToken);
    expect(result.player.health).toBe(80);
  });

  it("phoenix ash is rare", () => {
    const phoenixAsh = RELICS.find((r) => r.id === "phoenix_ash");
    expect(phoenixAsh.rarity).toBe("rare");
  });

  it("adds presentation asset metadata for relics", () => {
    const burnoutCoil = RELICS.find((r) => r.id === "burnout_coil");

    expect(burnoutCoil.presentation).toEqual({
      card: { category: "card", assetRef: "cards/_placeholder", placeholderRef: "cards/_placeholder", isPlaceholder: true },
      relic: { category: "relic", assetRef: "relics/burnout_coil", placeholderRef: "relics/_placeholder", isPlaceholder: false },
      enemy: { category: "enemy", assetRef: "enemies/_placeholder", placeholderRef: "enemies/_placeholder", isPlaceholder: true },
      icon: { category: "icon", assetRef: "icons/burnout_coil", placeholderRef: "icons/_placeholder", isPlaceholder: false },
      background: { category: "background", assetRef: "backgrounds/_placeholder", placeholderRef: "backgrounds/_placeholder", isPlaceholder: true },
      vfx: { category: "vfx", assetRef: "vfx/burnout_coil", placeholderRef: "vfx/_placeholder", isPlaceholder: false }
    });
  });
});
