const { createBalanceConfig } = require("./balance");
const { createCombatEncounter } = require("./combat");

const resolveNode = ({ node, player, balanceOverrides = {} }) => {
  const balance = createBalanceConfig(balanceOverrides);

  if (node.type === "combat") {
    return {
      state: "combat",
      combat: createCombatEncounter({
        player,
        enemy: { id: "slime", health: balance.enemy.basicEnemyHealth }
      })
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
