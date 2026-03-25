const { startNewRun } = require("../src/run");
const { generateMap } = require("../src/map");
const { createCombatEncounter } = require("../src/combat");
const {
  serializeRun,
  saveRun,
  loadRun,
  loadRunFromStorage,
  createMemoryStorage
} = require("../src/save");

describe("save/load run", () => {
  it("serializes and saves the current run state", () => {
    const storage = createMemoryStorage();
    const run = startNewRun();
    run.map = {
      ...generateMap({ rows: 3, columns: 3 }),
      currentNodeId: "r1c1"
    };
    run.combat = createCombatEncounter({
      player: run.player,
      enemy: { id: "slime", health: 24 }
    });
    run.combat.hand = ["strike"];
    run.combat.drawPile = ["defend"];

    const serialized = saveRun(run, storage);
    const parsed = JSON.parse(serialized);

    expect(parsed.player).toEqual(run.player);
    expect(parsed.map.currentNodeId).toBe("r1c1");
    expect(parsed.combat.enemy.health).toBe(24);
    expect(storage.getItem("drawforge.run")).toBe(serialized);
  });

  it("restores a previously saved run state including combat", () => {
    const storage = createMemoryStorage();
    const run = startNewRun();
    run.map = {
      ...generateMap({ rows: 2, columns: 2 }),
      currentNodeId: "r0c1"
    };
    run.combat = createCombatEncounter({
      player: run.player,
      enemy: { id: "slime", health: 18 }
    });
    run.combat.player.block = 5;
    run.combat.turn = "enemy";
    run.combat.hand = ["strike", "defend"];

    saveRun(run, storage);
    const loaded = loadRunFromStorage(storage);

    expect(loaded).toEqual(run);
    expect(loaded).not.toBe(run);
    expect(loaded.combat).not.toBe(run.combat);
    expect(loaded.map.currentNodeId).toBe("r0c1");
    expect(loaded.combat.turn).toBe("enemy");
    expect(loaded.combat.player.block).toBe(5);
  });

  it("loads from a serialized JSON string", () => {
    const run = startNewRun();
    const serialized = serializeRun(run);

    const loaded = loadRun(serialized);

    expect(loaded).toEqual(run);
    expect(loaded).not.toBe(run);
  });

  it("rejects malformed save data", () => {
    expect(() => loadRun("not-json")).toThrow("Saved run data is not valid JSON");
  });

  it("rejects incomplete save data", () => {
    expect(() =>
      loadRun({
        state: "in_progress",
        player: { health: 80, gold: 99, deck: ["strike"] }
      })
    ).toThrow("Saved run is missing map state");
  });

  it("rejects invalid combat state", () => {
    const run = startNewRun();
    run.map = {
      ...generateMap({ rows: 2, columns: 2 }),
      currentNodeId: "r0c0"
    };
    run.combat = {
      player: { health: 80 },
      enemy: null
    };

    expect(() => loadRun(run)).toThrow("Saved run combat enemy state is invalid");
  });

  it("fails clearly when no save exists", () => {
    const storage = createMemoryStorage();

    expect(() => loadRunFromStorage(storage)).toThrow("No saved run found");
  });
});
