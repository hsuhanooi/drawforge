const checkCombatEnd = (combat) => {
  if (combat.enemy.health <= 0) {
    return {
      ...combat,
      state: "victory",
      turn: null
    };
  }

  if (combat.player.health <= 0) {
    return {
      ...combat,
      state: "defeat",
      turn: null
    };
  }

  return combat;
};

module.exports = {
  checkCombatEnd
};
