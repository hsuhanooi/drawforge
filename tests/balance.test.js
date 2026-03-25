const { DEFAULT_PLAYER_HEALTH, DEFAULT_PLAYER_GOLD, DEFAULT_PLAYER_ENERGY } = require("../src/constants");
const { createBalanceConfig } = require("../src/balance");
const { startNewRun } = require("../src/run");
const { generateMap } = require("../src/map");
const { createRewardOptions } = require("../src/rewards");
const { performEnemyAttack, BASIC_ENEMY_ATTACK_DAMAGE } = require("../src/enemy");
const { startPlayerTurn } = require("../src/energy");
const { resolveNode } = require("../src/nodeResolver");

describe("balance tuning hooks", () => {
  it("creates a balance config with default values", () => {
    const balance = createBalanceConfig();

    expect(balance.player.health).toBe(DEFAULT_PLAYER_HEALTH);
    expect(balance.player.gold).toBe(DEFAULT_PLAYER_GOLD);
    expect(balance.player.energy).toBe(DEFAULT_PLAYER_ENERGY);
    expect(balance.enemy.basicAttackDamage).toBe(BASIC_ENEMY_ATTACK_DAMAGE);
    expect(balance.rewards.cardOptionCount).toBe(3);
    expect(balance.map.rows).toBe(5);
    expect(balance.map.columns).toBe(3);
  });

  it("allows run initialization to use balance overrides", () => {
    const run = startNewRun({
      player: {
        health: 100,
        gold: 25
      }
    });

    expect(run.player.health).toBe(100);
    expect(run.player.gold).toBe(25);
  });

  it("allows player turn energy to come from balance overrides", () => {
    const combat = {
      turn: "enemy",
      player: { health: 20, block: 0, energy: 0 },
      enemy: { health: 10 }
    };

    const next = startPlayerTurn(combat, {
      player: { energy: 5 }
    });

    expect(next.player.energy).toBe(5);
    expect(next.turn).toBe("player");
  });

  it("allows map generation to use balance defaults when explicit dimensions are omitted", () => {
    const map = generateMap({}, {
      map: {
        rows: 2,
        columns: 4
      }
    });

    expect(map.rows).toBe(2);
    expect(map.columns).toBe(4);
    expect(map.nodes).toHaveLength(8);
  });

  it("allows reward generation to use a tuned default option count", () => {
    const rewards = createRewardOptions(undefined, {
      rewards: {
        cardOptionCount: 2
      }
    });

    expect(rewards).toHaveLength(2);
  });

  it("allows enemy attacks to use tuned damage", () => {
    const combat = {
      turn: "enemy",
      enemyPhase: "action",
      player: { health: 20, block: 0 },
      enemy: { health: 10 }
    };

    const next = performEnemyAttack(combat, {
      enemy: {
        basicAttackDamage: 9
      }
    });

    expect(next.player.health).toBe(11);
  });

  it("allows combat node resolution to use tuned enemy health", () => {
    const result = resolveNode({
      node: { type: "combat" },
      player: { health: 80 },
      balanceOverrides: {
        enemy: {
          basicEnemyHealth: 45
        }
      }
    });

    expect(result.combat.enemy.health).toBe(45);
  });
});
