const createEnemy = ({ id, name, health, damage, rewardGold = 10, intents = [], ...rest }) => ({
  id,
  name,
  health,
  damage,
  rewardGold,
  intents,
  ...rest
});

const resolveEnemyIntent = (enemy, turnNumber = 0) => {
  const intents = enemy.intents && enemy.intents.length > 0
    ? enemy.intents
    : [{ type: "attack", value: enemy.damage, label: `Attack for ${enemy.damage}` }];

  return intents[turnNumber % intents.length];
};

const createEnemyForNode = (node, act = 1) => {
  if (node.type === "elite") {
    const act1Elites = [
      createEnemy({
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
      }),
      createEnemy({
        id: "stone_sentinel",
        name: "Stone Sentinel",
        health: 55,
        damage: 11,
        rewardGold: 25,
        intents: [
          { type: "attack", value: 11, label: "Slam for 11" },
          { type: "block", value: 8, label: "Fortify: gain 8 block" },
          { type: "attack", value: 13, label: "Crush for 13" }
        ]
      })
    ];

    const act2Elites = [
      ...act1Elites,
      createEnemy({
        id: "bone_colossus",
        name: "Bone Colossus",
        health: 80,
        damage: 13,
        rewardGold: 30,
        intents: [
          { type: "attack", value: 13, label: "Bone Slam for 13" },
          { type: "multi_attack", value: 6, hits: 2, label: "Shatter: 2x6" },
          { type: "block", value: 12, label: "Reassemble: gain 12 block" }
        ]
      })
    ];

    const pool = act === 2 ? act2Elites : act1Elites;
    return pool[(node.row + node.col) % pool.length];
  }

  if (node.type === "boss") {
    if (act === 2) {
      return createEnemy({
        id: "void_sovereign",
        name: "Void Sovereign",
        health: 95,
        damage: 14,
        rewardGold: 75,
        phaseThreshold: 47,
        phase: 1,
        phase2Strength: 2,
        intents: [
          { type: "attack", value: 14, label: "Void Slash for 14" },
          { type: "debuff_hex", value: 2, label: "Cursed Gaze: apply Hex 2" },
          { type: "multi_attack", value: 7, hits: 2, label: "Rift Strike: 2x7" }
        ],
        phase2Intents: [
          { type: "multi_attack", value: 8, hits: 2, label: "Chaos Rend: 2x8" },
          { type: "debuff_curse", curseId: "wound", label: "Void Brand: add Wound to deck" },
          { type: "attack", value: 18, label: "Annihilate for 18" }
        ]
      });
    }

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

  const act1Enemies = [
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
    }),
    createEnemy({
      id: "hexbat",
      name: "Hexbat",
      health: 22,
      damage: 7,
      rewardGold: 12,
      intents: [
        { type: "debuff_weak", value: 1, label: "Screech: apply Weak 1" },
        { type: "attack", value: 7, label: "Dive for 7" }
      ]
    })
  ];

  const act2Enemies = [
    ...act1Enemies,
    createEnemy({
      id: "hex_fiend",
      name: "Hex Fiend",
      health: 48,
      damage: 9,
      rewardGold: 15,
      intents: [
        { type: "debuff_hex", value: 2, label: "Hex Bolt: apply Hex 2" },
        { type: "attack", value: 9, label: "Cursed Strike for 9" }
      ]
    }),
    createEnemy({
      id: "ironback",
      name: "Ironback",
      health: 54,
      damage: 10,
      rewardGold: 15,
      intents: [
        { type: "block", value: 10, label: "Iron Shell: gain 10 block" },
        { type: "attack", value: 10, label: "Bash for 10" },
        { type: "multi_attack", value: 5, hits: 2, label: "Shell Shards: 2x5" }
      ]
    }),
    createEnemy({
      id: "void_specter",
      name: "Void Specter",
      health: 40,
      damage: 11,
      rewardGold: 15,
      intents: [
        { type: "attack", value: 11, label: "Phase Strike for 11" },
        { type: "debuff_hex", value: 1, label: "Haunt: apply Hex 1" },
        { type: "multi_attack", value: 6, hits: 2, label: "Spectral Barrage: 2x6" }
      ]
    })
  ];

  const pool = act === 2 ? act2Enemies : act1Enemies;
  const index = (node.row + node.col) % pool.length;
  return pool[index];
};

module.exports = {
  createEnemy,
  createEnemyForNode,
  resolveEnemyIntent
};
