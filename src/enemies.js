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
      }),
      createEnemy({
        id: "void_archon",
        name: "Void Archon",
        health: 90,
        damage: 14,
        rewardGold: 35,
        intents: [
          { type: "debuff_hex", value: 3, label: "Void Rift: apply Hex 3" },
          { type: "multi_attack", value: 7, hits: 2, label: "Annihilate: 2x7" },
          { type: "buff", value: 3, label: "Ascend: gain +3 damage" },
          { type: "attack", value: 14, label: "Void Crush for 14" }
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
    }),
    createEnemy({
      id: "thornling",
      name: "Thornling",
      health: 28,
      damage: 5,
      rewardGold: 12,
      intents: [
        { type: "block", value: 5, label: "Bristle: gain 5 block" },
        { type: "attack", value: 8, label: "Thorn Lash for 8" },
        { type: "multi_attack", value: 3, hits: 2, label: "Spike Volley: 2x3" }
      ]
    }),
    createEnemy({
      id: "phantom_thief",
      name: "Phantom Thief",
      health: 24,
      damage: 5,
      rewardGold: 14,
      intents: [
        { type: "multi_attack", value: 4, hits: 3, label: "Pick Pocket: 3x4" },
        { type: "debuff_weak", value: 2, label: "Smoke Bomb: apply Weak 2" }
      ]
    }),
    createEnemy({
      id: "brute",
      name: "Brute",
      health: 40,
      damage: 6,
      rewardGold: 14,
      intents: [
        { type: "buff", value: 3, label: "Wind Up: gain +3 damage" },
        { type: "attack", value: 9, label: "Heavy Swing for 9" },
        { type: "attack", value: 9, label: "Heavy Swing for 9" }
      ]
    }),
    createEnemy({
      id: "hex_cultist",
      name: "Hex Cultist",
      health: 28,
      damage: 6,
      rewardGold: 14,
      intents: [
        { type: "debuff_hex", value: 2, label: "Hex Chant: apply Hex 2" },
        { type: "attack", value: 8, label: "Dark Slash for 8" },
        { type: "debuff_weak", value: 1, label: "Curse Word: apply Weak 1" }
      ]
    }),
    createEnemy({
      id: "shield_crawler",
      name: "Shield Crawler",
      health: 36,
      damage: 7,
      rewardGold: 14,
      intents: [
        { type: "block", value: 8, label: "Curl Up: gain 8 block" },
        { type: "block", value: 6, label: "Harden: gain 6 block" },
        { type: "attack", value: 10, label: "Crush for 10" }
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
    }),
    createEnemy({
      id: "void_walker",
      name: "Void Walker",
      health: 44,
      damage: 10,
      rewardGold: 16,
      intents: [
        { type: "attack", value: 10, label: "Rift Step for 10" },
        { type: "debuff_hex", value: 2, label: "Void Gaze: apply Hex 2" },
        { type: "multi_attack", value: 5, hits: 2, label: "Phase Burst: 2x5" }
      ]
    }),
    createEnemy({
      id: "dread_knight",
      name: "Dread Knight",
      health: 58,
      damage: 11,
      rewardGold: 16,
      intents: [
        { type: "block", value: 8, label: "Shield Up: gain 8 block" },
        { type: "attack", value: 11, label: "Dark Cleave for 11" },
        { type: "debuff_curse", curseId: "wound", label: "Dread Mark: add Wound to deck" }
      ]
    }),
    createEnemy({
      id: "hex_wraith",
      name: "Hex Wraith",
      health: 38,
      damage: 9,
      rewardGold: 16,
      intents: [
        { type: "debuff_hex", value: 3, label: "Hex Flood: apply Hex 3" },
        { type: "attack", value: 9, label: "Wail for 9" },
        { type: "debuff_weak", value: 2, label: "Siphon Will: apply Weak 2" }
      ]
    }),
    createEnemy({
      id: "soul_siphon",
      name: "Soul Siphon",
      health: 46,
      damage: 8,
      rewardGold: 16,
      intents: [
        { type: "buff", value: 2, label: "Feed: gain +2 damage" },
        { type: "attack", value: 10, label: "Drain for 10" },
        { type: "buff", value: 2, label: "Feed: gain +2 damage" },
        { type: "multi_attack", value: 6, hits: 2, label: "Feast: 2x6" }
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
