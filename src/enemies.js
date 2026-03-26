const createEnemy = ({ id, name, health, damage, rewardGold = 10, intents = [] }) => ({
  id,
  name,
  health,
  damage,
  rewardGold,
  intents
});

const resolveEnemyIntent = (enemy, turnNumber = 0) => {
  const intents = enemy.intents && enemy.intents.length > 0
    ? enemy.intents
    : [{ type: "attack", value: enemy.damage, label: `Attack for ${enemy.damage}` }];

  return intents[turnNumber % intents.length];
};

const createEnemyForNode = (node) => {
  if (node.type === "elite") {
    return createEnemy({
      id: "cultist_captain",
      name: "Cultist Captain",
      health: 45,
      damage: 9,
      rewardGold: 25,
      intents: [
        { type: "attack", value: 9, label: "Heavy attack for 9" },
        { type: "buff", value: 2, label: "Rally: gain +2 future damage" },
        { type: "attack", value: 11, label: "Heavy attack for 11" }
      ]
    });
  }

  if (node.type === "boss") {
    return createEnemy({
      id: "spire_guardian",
      name: "Spire Guardian",
      health: 70,
      damage: 12,
      rewardGold: 50,
      intents: [
        { type: "attack", value: 12, label: "Crush for 12" },
        { type: "block", value: 10, label: "Fortify: gain 10 block" },
        { type: "multi_attack", value: 4, hits: 3, label: "Barrage: 3x4" }
      ]
    });
  }

  const combatEnemies = [
    createEnemy({
      id: "slime",
      name: "Slime",
      health: 30,
      damage: 6,
      rewardGold: 12,
      intents: [
        { type: "attack", value: 6, label: "Slam for 6" },
        { type: "block", value: 6, label: "Harden: gain 6 block" }
      ]
    }),
    createEnemy({
      id: "fangling",
      name: "Fangling",
      health: 26,
      damage: 7,
      rewardGold: 12,
      intents: [
        { type: "multi_attack", value: 3, hits: 2, label: "Flurry: 2x3" },
        { type: "attack", value: 8, label: "Pounce for 8" }
      ]
    }),
    createEnemy({
      id: "mossling",
      name: "Mossling",
      health: 34,
      damage: 5,
      rewardGold: 12,
      intents: [
        { type: "buff", value: 2, label: "Grow: gain +2 future damage" },
        { type: "attack", value: 7, label: "Vine lash for 7" }
      ]
    })
  ];

  const index = (node.row + node.col) % combatEnemies.length;
  return combatEnemies[index];
};

module.exports = {
  createEnemy,
  createEnemyForNode,
  resolveEnemyIntent
};
