const {
  clampAscensionLevel,
  getUnlockedAscensionLevel,
  applyAscensionToDeck,
  scaleEnemyForAscension,
  scaleShopPrice
} = require("../src/ascension");
const { createBrowserRun, chooseArchetype } = require("../src/browserRunActions");
const { createPlayShopState } = require("../src/playContent");

describe("ascension helpers", () => {
  it("clamps ascension level to the supported range", () => {
    expect(clampAscensionLevel(-3)).toBe(0);
    expect(clampAscensionLevel(2.9)).toBe(2);
    expect(clampAscensionLevel(9)).toBe(5);
  });

  it("unlocks one additional ascension per true-victory win up to level 5", () => {
    expect(getUnlockedAscensionLevel(0)).toBe(0);
    expect(getUnlockedAscensionLevel(1)).toBe(1);
    expect(getUnlockedAscensionLevel(4)).toBe(4);
    expect(getUnlockedAscensionLevel(9)).toBe(5);
  });

  it("adds a Wound to the starter deck from ascension 3 onward", () => {
    expect(applyAscensionToDeck(["strike", "defend"], 2)).toEqual(["strike", "defend"]);
    expect(applyAscensionToDeck(["strike", "defend"], 3)).toEqual(["strike", "defend", "wound"]);
  });

  it("scales enemy hp and damage at ascension 1 and 2", () => {
    const scaled = scaleEnemyForAscension({
      id: "slime",
      health: 30,
      damage: 6,
      intents: [{ type: "attack", value: 6, label: "Slam for 6" }]
    }, 2, "combat");

    expect(scaled.health).toBe(33);
    expect(scaled.damage).toBe(7);
    expect(scaled.intents[0].value).toBe(7);
    expect(scaled.intents[0].label).toBe("Slam for 7");
  });

  it("applies the stronger ascension 4 hp multiplier and ascension 5 boss skip", () => {
    const scaled = scaleEnemyForAscension({
      id: "boss",
      health: 100,
      damage: 12,
      phase: 1,
      phase2Strength: 2,
      intents: [{ type: "attack", value: 12, label: "Hit for 12" }],
      phaseIntents: [
        [{ type: "attack", value: 12, label: "Hit for 12" }],
        [{ type: "attack", value: 18, label: "Phase 2 hit for 18" }]
      ]
    }, 5, "boss");

    expect(scaled.health).toBe(120);
    expect(scaled.phase).toBe(2);
    expect(scaled.intents).toEqual(scaled.phaseIntents[1]);
    expect(scaled.strength).toBe(2);
  });

  it("raises shop prices by 25% at ascension 4", () => {
    expect(scaleShopPrice(40, 3)).toBe(40);
    expect(scaleShopPrice(40, 4)).toBe(50);
  });
});

describe("ascension integration", () => {
  it("stores ascension level on new browser runs and adds a Wound on archetype choice at ascension 3", () => {
    const run = createBrowserRun({}, { ascensionLevel: 3 });
    const chosen = chooseArchetype(run, "hex_witch");

    expect(chosen.ascensionLevel).toBe(3);
    expect(chosen.player.deck[chosen.player.deck.length - 1]).toBe("wound");
  });

  it("raises shop prices for ascension 4 runs", async () => {
    const run = createBrowserRun({}, { ascensionLevel: 4 });
    const shop = await createPlayShopState(run);

    expect(shop.services.find((item) => item.id === "heal").price).toBe(50);
    expect(shop.services.find((item) => item.id === "remove").price).toBe(94);
  });
});
