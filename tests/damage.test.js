const { applyDamage } = require("../src/damage");

describe("damage resolution", () => {
  it("reduces block first and applies remaining damage to health", () => {
    const combat = {
      player: { health: 20, block: 5 }
    };

    const next = applyDamage(combat, 8);

    expect(next.player.block).toBe(0);
    expect(next.player.health).toBe(17);
  });

  it("does not reduce health when block fully absorbs damage", () => {
    const combat = {
      player: { health: 20, block: 10 }
    };

    const next = applyDamage(combat, 4);

    expect(next.player.block).toBe(6);
    expect(next.player.health).toBe(20);
  });
});
