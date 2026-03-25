const { BASIC_ENEMY_ATTACK_DAMAGE, performEnemyAttack } = require("../src/enemy");

describe("enemy turn", () => {
  it("performs a deterministic attack and ends its turn", () => {
    const combat = {
      turn: "enemy",
      enemyPhase: "action",
      player: { health: 20, block: 0 },
      enemy: { health: 10 }
    };

    const next = performEnemyAttack(combat);

    expect(next.player.health).toBe(20 - BASIC_ENEMY_ATTACK_DAMAGE);
    expect(next.turn).toBe("player");
    expect(next.enemyPhase).toBeNull();
  });

  it("applies damage through block correctly", () => {
    const combat = {
      turn: "enemy",
      enemyPhase: "action",
      player: { health: 20, block: 4 },
      enemy: { health: 10 }
    };

    const next = performEnemyAttack(combat, 6);

    expect(next.player.block).toBe(0);
    expect(next.player.health).toBe(18);
  });
});
