const {
  DEFAULT_PLAYER_GOLD,
  DEFAULT_PLAYER_HEALTH,
  RUN_STATE_IN_PROGRESS
} = require("../src/constants");
const { startNewRun } = require("../src/run");

describe("startNewRun", () => {
  it("initializes player state, deck, and run status", () => {
    const run = startNewRun();

    expect(run.player.health).toBe(DEFAULT_PLAYER_HEALTH);
    expect(run.player.gold).toBe(DEFAULT_PLAYER_GOLD);
    expect(run.player.deck.length).toBeGreaterThan(0);
    expect(run.state).toBe(RUN_STATE_IN_PROGRESS);
  });

  it("starts with no combat or selected map node", () => {
    const run = startNewRun();

    expect(run.combat).toBeNull();
    expect(run.map.currentNodeId).toBeNull();
  });
});
