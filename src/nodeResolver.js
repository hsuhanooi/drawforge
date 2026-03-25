const { createCombatEncounter } = require("./combat");

const resolveNode = ({ node, player }) => {
  if (node.type === "combat") {
    return {
      state: "combat",
      combat: createCombatEncounter({
        player,
        enemy: { id: "slime", health: 30 }
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
