const { applyEnemyIntent, BASIC_ENEMY_ATTACK_DAMAGE, performEnemyAttack } = require("../src/enemy");
const { createEnemyForNode, resolveEnemyIntent } = require("../src/enemies");

describe("enemy turn", () => {
  it("performs a deterministic attack and ends its turn", () => {
    const combat = {
      state: "active",
      turn: "enemy",
      enemyPhase: "action",
      player: { health: 20, block: 0 },
      enemy: { health: 10, damage: BASIC_ENEMY_ATTACK_DAMAGE },
      enemyIntent: { type: "attack", value: BASIC_ENEMY_ATTACK_DAMAGE, label: "Attack for 6" },
      enemyTurnNumber: 0
    };

    const next = performEnemyAttack(combat);

    expect(next.player.health).toBe(20 - BASIC_ENEMY_ATTACK_DAMAGE);
    expect(next.turn).toBe("player");
    expect(next.enemyPhase).toBeNull();
  });

  it("applies damage through block correctly", () => {
    const combat = {
      state: "active",
      turn: "enemy",
      enemyPhase: "action",
      player: { health: 20, block: 4 },
      enemy: { health: 10, damage: 6 },
      enemyIntent: { type: "attack", value: 6, label: "Attack for 6" },
      enemyTurnNumber: 0
    };

    const next = performEnemyAttack(combat);

    expect(next.player.block).toBe(0);
    expect(next.player.health).toBe(18);
  });

  it("supports multi-hit enemy intents", () => {
    const combat = {
      state: "active",
      player: { health: 20, block: 2 },
      enemy: { health: 12, damage: 3 }
    };

    const next = applyEnemyIntent(combat, { type: "multi_attack", value: 3, hits: 2 });

    expect(next.player.health).toBe(16);
    expect(next.player.block).toBe(0);
  });

  it("supports defensive and buff intents", () => {
    const combat = {
      state: "active",
      player: { health: 20, block: 0 },
      enemy: { health: 12, damage: 5, block: 1 }
    };

    const blocked = applyEnemyIntent(combat, { type: "block", value: 6 });
    const buffed = applyEnemyIntent(combat, { type: "buff", value: 2 });

    expect(blocked.enemy.block).toBe(7);
    expect(buffed.enemy.damage).toBe(7);
  });

  it("cycles deterministic intents from enemy definitions", () => {
    const slime = createEnemyForNode({ row: 0, col: 0, type: "combat" });

    expect(resolveEnemyIntent(slime, 0).type).toBe("attack");
    expect(resolveEnemyIntent(slime, 1).type).toBe("block");
  });
});
