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
    expect(clampAscensionLevel(9)).toBe(9);
    expect(clampAscensionLevel(15)).toBe(10);
  });

  it("unlocks one additional ascension per true-victory win up to level 10", () => {
    expect(getUnlockedAscensionLevel(0)).toBe(0);
    expect(getUnlockedAscensionLevel(1)).toBe(1);
    expect(getUnlockedAscensionLevel(4)).toBe(4);
    expect(getUnlockedAscensionLevel(9)).toBe(9);
    expect(getUnlockedAscensionLevel(15)).toBe(10);
  });

  it("adds wounds to the starter deck based on ascension level", () => {
    expect(applyAscensionToDeck(["strike", "defend"], 2)).toEqual(["strike", "defend"]);
    expect(applyAscensionToDeck(["strike", "defend"], 3)).toEqual(["strike", "defend", "wound"]);
    expect(applyAscensionToDeck(["strike", "defend"], 6)).toEqual(["strike", "defend", "wound", "wound"]);
    expect(applyAscensionToDeck(["strike", "defend"], 10)).toEqual(["strike", "defend", "wound", "wound", "wound"]);
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

  it("raises shop prices by 25% at ascension 4 and 50% at ascension 8", () => {
    expect(scaleShopPrice(40, 3)).toBe(40);
    expect(scaleShopPrice(40, 4)).toBe(50);
    expect(scaleShopPrice(40, 8)).toBe(60);
  });

  it("scales enemy damage by +2 at level 6 and +3 at level 9", () => {
    const enemy = {
      id: "test",
      health: 30,
      damage: 6,
      intents: [{ type: "attack", value: 6, label: "Slash for 6" }]
    };
    const scaled6 = scaleEnemyForAscension(enemy, 6, "combat");
    expect(scaled6.damage).toBe(8);
    expect(scaled6.intents[0].value).toBe(8);

    const scaled9 = scaleEnemyForAscension(enemy, 9, "combat");
    expect(scaled9.damage).toBe(9);
    expect(scaled9.intents[0].value).toBe(9);
  });

  it("grants elites +1 strength at ascension 8", () => {
    const elite = { id: "elite", health: 100, damage: 12, intents: [] };
    const scaled = scaleEnemyForAscension(elite, 8, "elite");
    expect(scaled.strength).toBe(1);
    const combat = scaleEnemyForAscension(elite, 8, "combat");
    expect(combat.strength).toBeUndefined();
  });

  it("forces boss to phase 3 at ascension 10 if available", () => {
    const boss = {
      id: "final_boss",
      health: 150,
      damage: 15,
      phase: 1,
      phase2Strength: 2,
      phase3Strength: 3,
      intents: [{ type: "attack", value: 15, label: "Strike for 15" }],
      phaseIntents: [
        [{ type: "attack", value: 15, label: "Strike for 15" }],
        [{ type: "attack", value: 20, label: "Crush for 20" }],
        [{ type: "attack", value: 26, label: "Obliterate for 26" }]
      ]
    };
    const scaled = scaleEnemyForAscension(boss, 10, "boss");
    expect(scaled.phase).toBe(3);
    expect(scaled.intents).toEqual(boss.phaseIntents[2]);
    expect(scaled.strength).toBeGreaterThanOrEqual(3);
  });

  it("scales HP to 60% bonus at ascension 10", () => {
    const enemy = { id: "t", health: 100, damage: 10, intents: [] };
    const scaled = scaleEnemyForAscension(enemy, 10, "combat");
    expect(scaled.health).toBe(160);
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

    expect(shop.services.find((item) => item.id === "heal").price).toBe(30);
    expect(shop.services.find((item) => item.id === "remove").price).toBe(69);
  });

  it("generates a richer shop inventory with four cards and stronger act 2 healing", async () => {
    const run = { ...createBrowserRun(), act: 2 };
    const shop = await createPlayShopState(run);

    expect(shop.cards).toHaveLength(4);
    expect(shop.relics).toHaveLength(3);
    expect(shop.services.find((item) => item.id === "heal").amount).toBe(20);
  });
});
