const createEnemy = ({ id, name, health, damage, rewardGold = 10 }) => ({
  id,
  name,
  health,
  damage,
  rewardGold
});

const createEnemyForNode = (node) => {
  if (node.type === "elite") {
    return createEnemy({
      id: "cultist_captain",
      name: "Cultist Captain",
      health: 45,
      damage: 9,
      rewardGold: 25
    });
  }

  if (node.type === "boss") {
    return createEnemy({
      id: "spire_guardian",
      name: "Spire Guardian",
      health: 70,
      damage: 12,
      rewardGold: 50
    });
  }

  const combatEnemies = [
    createEnemy({ id: "slime", name: "Slime", health: 30, damage: 6, rewardGold: 12 }),
    createEnemy({ id: "fangling", name: "Fangling", health: 26, damage: 7, rewardGold: 12 }),
    createEnemy({ id: "mossling", name: "Mossling", health: 34, damage: 5, rewardGold: 12 })
  ];

  const index = (node.row + node.col) % combatEnemies.length;
  return combatEnemies[index];
};

module.exports = {
  createEnemy,
  createEnemyForNode
};
