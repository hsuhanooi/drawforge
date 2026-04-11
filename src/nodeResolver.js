const { createBalanceConfig } = require("./balance");
const { createCombatEncounter } = require("./combat");
const { createEnemyForNode } = require("./enemies");
const { createEventForNode, createCampfireEvent } = require("./events");

const resolveNode = ({ node, player, balanceOverrides = {}, act = 1, ascensionLevel = 0, seed = undefined, runFlags = {}, usedChainFlags = [] }) => {
  const balance = createBalanceConfig(balanceOverrides);

  if (["combat", "elite", "boss"].includes(node.type)) {
    const enemy = createEnemyForNode({ row: node.row ?? 0, col: node.col ?? 0, type: node.type }, act, ascensionLevel, seed);
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
      event: createEventForNode({ row: node.row ?? 0, col: node.col ?? 0, id: node.id, act }, runFlags, usedChainFlags)
    };
  }

  if (node.type === "rest") {
    return {
      state: "rest",
      combat: null,
      event: createCampfireEvent(player, act)
    };
  }

  if (node.type === "shop") {
    return {
      state: "shop",
      combat: null
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
