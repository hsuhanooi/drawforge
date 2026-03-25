const { createBalanceConfig } = require("./balance");
const { createCombatEncounter } = require("./combat");
const { createEnemyForNode } = require("./enemies");
const { createEventForNode } = require("./events");

const resolveNode = ({ node, player, balanceOverrides = {} }) => {
  const balance = createBalanceConfig(balanceOverrides);

  if (["combat", "elite", "boss"].includes(node.type)) {
    const enemy = createEnemyForNode({ row: node.row ?? 0, col: node.col ?? 0, type: node.type });
    const health = node.type === "combat"
      ? balance.enemy.basicEnemyHealth
      : enemy.health || balance.enemy.basicEnemyHealth;

    return {
      state: "combat",
      combat: createCombatEncounter({
        player,
        enemy: {
          ...enemy,
          health
        }
      })
    };
  }

  if (node.type === "event") {
    return {
      state: "event",
      combat: null,
      event: createEventForNode({ row: node.row ?? 0, col: node.col ?? 0, id: node.id })
    };
  }

  return {
    state: "idle",
    combat: null
  };
};

module.exports = {
  resolveNode
};
