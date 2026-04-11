const { buildPresentationAssets, makeAssetRef } = require("./assets");
const { scaleEnemyForAscension } = require("./ascension");

const createEnemy = ({ id, name, health, damage, rewardGold = 10, intents = [], assetRef = null, ...rest }) => ({
  id,
  name,
  health,
  damage,
  rewardGold,
  intents,
  assetRef: assetRef || makeAssetRef("enemy", id),
  presentation: buildPresentationAssets({
    enemyId: id,
    iconId: id,
    backgroundId: "combat_default",
    vfxId: id
  }),
  ...rest
});

const createMultiPhaseBoss = ({ phaseIntents = [], phaseThresholds = [], ...enemy }) => createEnemy({
  ...enemy,
  phase: 1,
  phaseIntents,
  phaseThresholds,
  intents: phaseIntents[0] || enemy.intents || []
});

const resolveEnemyIntent = (enemy, turnNumber = 0) => {
  const intents = enemy.intents && enemy.intents.length > 0
    ? enemy.intents
    : [{ type: "attack", value: enemy.damage, label: `Attack for ${enemy.damage}` }];

  return intents[turnNumber % intents.length];
};

// Boss pool definitions — ordered as [existing, new1, new2] so act3 stays single
const act1BossPool = [
  () => createEnemy({
    id: "spire_guardian",
    name: "Spire Guardian",
    health: 70,
    damage: 12,
    rewardGold: 50,
    trait: "Barrage: Strikes 3 times each turn for 4 damage each",
    intents: [
      { type: "attack", value: 12, label: "Crush for 12" },
      { type: "block", value: 10, label: "Fortify: gain 10 block" },
      { type: "multi_attack", value: 4, hits: 3, label: "Barrage: 3x4" }
    ]
  }),
  () => createEnemy({
    id: "crypt_warden",
    name: "Crypt Warden",
    health: 75,
    damage: 11,
    rewardGold: 55,
    trait: "Wail: Applies Vulnerable, then crushes for heavy damage",
    intents: [
      { type: "attack", value: 11, label: "Bone Crush for 11" },
      { type: "block", value: 12, label: "Fortify: gain 12 block" },
      { type: "debuff_vulnerable", value: 1, label: "Wail: apply Vulnerable 1" },
      { type: "attack", value: 11, label: "Bone Crush for 11" }
    ]
  }),
  () => createEnemy({
    id: "stone_idol",
    name: "Stone Idol",
    health: 85,
    damage: 10,
    rewardGold: 55,
    trait: "Regenerate: Builds block every other turn, then Pulverizes",
    intents: [
      { type: "attack", value: 10, label: "Slam for 10" },
      { type: "block", value: 8, label: "Regenerate: gain 8 block" },
      { type: "attack", value: 14, label: "Pulverize for 14" },
      { type: "attack", value: 10, label: "Slam for 10" }
    ]
  })
];

const act2BossPool = [
  () => createEnemy({
    id: "void_sovereign",
    name: "Void Sovereign",
    health: 95,
    damage: 14,
    rewardGold: 75,
    trait: "Phase Shift: Grows stronger below half health, gaining +2 Strength",
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
  }),
  () => createEnemy({
    id: "hex_lord",
    name: "Hex Lord",
    health: 105,
    damage: 13,
    rewardGold: 70,
    trait: "Hex Pulse: Curses you with Hex on every strike, amplifying all damage",
    startHex: 2,
    intents: [
      { type: "debuff_hex_attack", hex: 2, value: 9, label: "Hex Pulse: apply Hex 2 + 9 dmg" },
      { type: "multi_attack", value: 7, hits: 2, label: "Void Drain: 2x7" },
      { type: "debuff_hex", value: 2, label: "Hex Ascend: apply Hex 2" },
      { type: "attack", value: 14, label: "Annihilate for 14" }
    ]
  }),
  () => createMultiPhaseBoss({
    id: "bone_emperor",
    name: "Bone Emperor",
    health: 115,
    damage: 14,
    rewardGold: 70,
    trait: "Imperial Wrath: Below half health, enters a frenzied phase with triple strikes",
    phaseThresholds: [55],
    phaseIntents: [
      [
        { type: "attack", value: 14, label: "Decree for 14" },
        { type: "block", value: 11, label: "Crown Parry: gain 11 block" },
        { type: "multi_attack", value: 7, hits: 2, label: "Imperial Strike: 2x7" }
      ],
      [
        { type: "multi_attack", value: 6, hits: 3, label: "Frenzy: 3x6" },
        { type: "attack", value: 17, label: "Shatter for 17" },
        { type: "debuff_weak", value: 2, label: "Edict: apply Weak 2" }
      ]
    ]
  })
];

const act3BossPool = [
  () => createMultiPhaseBoss({
    id: "the_undying",
    name: "The Undying",
    health: 180,
    damage: 18,
    rewardGold: 100,
    trait: "Undying: Four escalating phases — each threshold passed grants new strength and fury",
    phaseThresholds: [150, 100, 50],
    phase2Strength: 2,
    phase3Strength: 3,
    phase4Strength: 4,
    phaseIntents: [
      [
        { type: "attack", value: 18, label: "Final Slash for 18" },
        { type: "debuff_hex", value: 2, label: "Death Mark: apply Hex 2" },
        { type: "block", value: 14, label: "Unending Guard: gain 14 block" }
      ],
      [
        { type: "multi_attack", value: 10, hits: 2, label: "Soul Rend: 2x10" },
        { type: "debuff_weak", value: 2, label: "Withering Cry: apply Weak 2" },
        { type: "attack", value: 22, label: "Grave Crash for 22" }
      ],
      [
        { type: "debuff_burn", value: 3, label: "Ashen Wake: apply Burn 3" },
        { type: "multi_attack", value: 8, hits: 3, label: "Eternal Barrage: 3x8" },
        { type: "attack", value: 24, label: "Oblivion for 24" }
      ],
      [
        { type: "debuff_poison", value: 4, label: "Rot Bloom: apply Poison 4" },
        { type: "multi_attack", value: 11, hits: 3, label: "Death Spiral: 3x11" },
        { type: "attack", value: 30, label: "Undying End for 30" }
      ]
    ]
  })
];

/**
 * Select a boss from the act's pool deterministically by run seed.
 * @param {number} act
 * @param {string | number | undefined} runSeed
 * @returns {object}
 */
const selectBossForAct = (act, runSeed) => {
  const pool = act === 1 ? act1BossPool : act === 2 ? act2BossPool : act3BossPool;
  if (pool.length === 1) return pool[0]();
  const seedStr = String(runSeed || "default");
  const hash = [...seedStr].reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[(hash + act) % pool.length]();
};

const createEnemyForNode = (node, act = 1, ascensionLevel = 0, runSeed = undefined) => {
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

    const act3Elites = [
      createMultiPhaseBoss({
        id: "hex_titan",
        name: "Hex Titan",
        health: 165,
        damage: 18,
        rewardGold: 40,
        phaseThresholds: [110, 65],
        phase2Strength: 2,
        phase3Strength: 3,
        phaseIntents: [
          [
            { type: "attack", value: 16, label: "Titan Crush for 16" },
            { type: "debuff_hex", value: 3, label: "Runic Glare: apply Hex 3" },
            { type: "block", value: 14, label: "Obsidian Guard: gain 14 block" }
          ],
          [
            { type: "multi_attack", value: 9, hits: 2, label: "Runebreaker: 2x9" },
            { type: "debuff_weak", value: 2, label: "Titan Roar: apply Weak 2" },
            { type: "attack", value: 20, label: "World Hammer for 20" }
          ],
          [
            { type: "multi_attack", value: 8, hits: 3, label: "Shatterfall: 3x8" },
            { type: "debuff_hex", value: 4, label: "Final Edict: apply Hex 4" },
            { type: "attack", value: 24, label: "Cataclysm Fist for 24" }
          ]
        ]
      }),
      createEnemy({
        id: "cinder_colossus",
        name: "Cinder Colossus",
        health: 150,
        damage: 19,
        rewardGold: 40,
        burnImmune: true,
        intents: [
          { type: "attack", value: 17, label: "Lava Fist for 17" },
          { type: "debuff_burn", value: 3, label: "Ash Storm: apply Burn 3" },
          { type: "multi_attack", value: 10, hits: 2, label: "Magma Barrage: 2x10" }
        ]
      })
    ];

    const pool = act >= 3 ? act3Elites : act === 2 ? act2Elites : act1Elites;
    return scaleEnemyForAscension(pool[(node.row + node.col) % pool.length], ascensionLevel, node.type);
  }

  if (node.type === "boss") {
    return scaleEnemyForAscension(selectBossForAct(act, runSeed), ascensionLevel, node.type);
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
      id: "plague_rat",
      name: "Plague Rat",
      health: 27,
      damage: 5,
      rewardGold: 13,
      intents: [
        { type: "debuff_poison", value: 2, label: "Toxic Spit: apply Poison 2" },
        { type: "attack", value: 7, label: "Bite for 7" }
      ]
    }),
    createEnemy({
      id: "cinder_shade",
      name: "Cinder Shade",
      health: 29,
      damage: 6,
      rewardGold: 13,
      intents: [
        { type: "debuff_burn", value: 2, label: "Scorching Whisper: apply Burn 2" },
        { type: "attack", value: 8, label: "Ash Swipe for 8" }
      ]
    }),
    createEnemy({
      id: "venomfang",
      name: "Venomfang",
      health: 31,
      damage: 7,
      rewardGold: 14,
      intents: [
        { type: "attack_poison", value: 6, poison: 1, label: "Venom Bite for 6 + Poison 1" },
        { type: "multi_attack", value: 3, hits: 2, label: "Rake: 2x3" }
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
    }),
    createEnemy({
      id: "plague_rat",
      name: "Plague Rat",
      health: 32,
      damage: 5,
      rewardGold: 14,
      intents: [
        { type: "debuff_poison", value: 2, label: "Plague Bite: apply Poison 2" },
        { type: "attack", value: 7, label: "Gnaw for 7" }
      ]
    }),
    createEnemy({
      id: "cinder_shade",
      name: "Cinder Shade",
      health: 34,
      damage: 6,
      rewardGold: 14,
      intents: [
        { type: "debuff_burn", value: 2, label: "Ashen Touch: apply Burn 2" },
        { type: "attack", value: 8, label: "Ember Lash for 8" }
      ]
    }),
    createEnemy({
      id: "venomfang",
      name: "Venomfang",
      health: 36,
      damage: 7,
      rewardGold: 15,
      intents: [
        { type: "attack_poison", value: 7, poison: 1, label: "Venom Strike for 7 + Poison 1" },
        { type: "attack", value: 9, label: "Rend for 9" }
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

  const act3Enemies = [
    ...act2Enemies,
    createEnemy({
      id: "nightmare_husk",
      name: "Nightmare Husk",
      health: 58,
      damage: 12,
      rewardGold: 18,
      intents: [
        { type: "attack", value: 12, label: "Night Rend for 12" },
        { type: "debuff_weak", value: 2, label: "Dread Breath: apply Weak 2" },
        { type: "multi_attack", value: 7, hits: 2, label: "Shadow Flurry: 2x7" }
      ]
    }),
    createEnemy({
      id: "hex_revenant",
      name: "Hex Revenant",
      health: 54,
      damage: 11,
      rewardGold: 18,
      intents: [
        { type: "debuff_hex", value: 3, label: "Coffin Whisper: apply Hex 3" },
        { type: "attack", value: 13, label: "Ruin Swipe for 13" },
        { type: "debuff_curse", curseId: "wound", label: "Brand of Grief: add Wound to deck" }
      ]
    }),
    createEnemy({
      id: "stone_eater",
      name: "Stone Eater",
      health: 70,
      damage: 12,
      rewardGold: 18,
      intents: [
        { type: "block", value: 14, label: "Granite Feed: gain 14 block" },
        { type: "attack", value: 15, label: "Quarry Bite for 15" },
        { type: "multi_attack", value: 8, hits: 2, label: "Shard Spray: 2x8" }
      ]
    }),
    createEnemy({
      id: "soul_collector",
      name: "Soul Collector",
      health: 56,
      damage: 12,
      rewardGold: 18,
      intents: [
        { type: "buff", value: 3, label: "Harvest: gain +3 damage" },
        { type: "attack", value: 14, label: "Soul Cleave for 14" },
        { type: "debuff_poison", value: 2, label: "Siphon Rot: apply Poison 2" }
      ]
    }),
    createEnemy({
      id: "void_crawler",
      name: "Void Crawler",
      health: 52,
      damage: 11,
      rewardGold: 18,
      intents: [
        { type: "multi_attack", value: 6, hits: 3, label: "Skitter Storm: 3x6" },
        { type: "debuff_hex", value: 2, label: "Warp Venom: apply Hex 2" },
        { type: "attack", value: 15, label: "Void Fang for 15" }
      ]
    }),
    createEnemy({
      id: "ashwalker",
      name: "Ashwalker",
      health: 60,
      damage: 12,
      rewardGold: 18,
      intents: [
        { type: "debuff_burn", value: 3, label: "Cinder Step: apply Burn 3" },
        { type: "attack", value: 14, label: "Ashen Spear for 14" },
        { type: "block", value: 10, label: "Smoke Veil: gain 10 block" }
      ]
    })
  ];

  const pool = act >= 3 ? act3Enemies : act === 2 ? act2Enemies : act1Enemies;
  const index = (node.row + node.col) % pool.length;
  return scaleEnemyForAscension(pool[index], ascensionLevel, node.type);
};

// Deterministic hash from a string (used for encounter seeding)
const hashString = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
};

// Two-enemy encounter pair definitions. Each entry is a factory pair [() => enemy, () => enemy].
// HP is pre-reduced by 20% in the factory to compensate for double threat.
const act1EncounterPairs = [
  // [slime, slime] — pure damage check
  [
    () => createEnemy({ id: "slime", name: "Slime", health: 24, damage: 6, rewardGold: 6,
      intents: [{ type: "attack", value: 6, label: "Slam for 6" }, { type: "block", value: 6, label: "Harden: gain 6 block" }] }),
    () => createEnemy({ id: "slime", name: "Slime", health: 24, damage: 6, rewardGold: 6,
      intents: [{ type: "block", value: 6, label: "Harden: gain 6 block" }, { type: "attack", value: 6, label: "Slam for 6" }] })
  ],
  // [fangling, hexbat] — fast attacker + debuffer
  [
    () => createEnemy({ id: "fangling", name: "Fangling", health: 21, damage: 7, rewardGold: 6,
      intents: [{ type: "multi_attack", value: 3, hits: 2, label: "Flurry: 2x3" }, { type: "attack", value: 8, label: "Pounce for 8" }] }),
    () => createEnemy({ id: "hexbat", name: "Hexbat", health: 18, damage: 7, rewardGold: 6,
      intents: [{ type: "debuff_weak", value: 1, label: "Screech: apply Weak 1" }, { type: "attack", value: 7, label: "Dive for 7" }] })
  ],
  // [mossling, thornling] — buffer + blocker pressure
  [
    () => createEnemy({ id: "mossling", name: "Mossling", health: 27, damage: 5, rewardGold: 6,
      intents: [{ type: "buff", value: 2, label: "Grow: gain +2 damage" }, { type: "attack", value: 7, label: "Vine Lash for 7" }] }),
    () => createEnemy({ id: "thornling", name: "Thornling", health: 22, damage: 5, rewardGold: 6,
      intents: [{ type: "block", value: 5, label: "Bristle: gain 5 block" }, { type: "attack", value: 8, label: "Thorn Lash for 8" }] })
  ],
  // [plague_rat, cinder_shade] — poison + burn cross-pressure
  [
    () => createEnemy({ id: "plague_rat", name: "Plague Rat", health: 22, damage: 5, rewardGold: 7,
      intents: [{ type: "debuff_poison", value: 2, label: "Toxic Spit: apply Poison 2" }, { type: "attack", value: 7, label: "Bite for 7" }] }),
    () => createEnemy({ id: "cinder_shade", name: "Cinder Shade", health: 23, damage: 6, rewardGold: 7,
      intents: [{ type: "debuff_burn", value: 2, label: "Scorching Whisper: apply Burn 2" }, { type: "attack", value: 8, label: "Ash Swipe for 8" }] })
  ],
  // [hex_cultist, shield_crawler] — hex + block
  [
    () => createEnemy({ id: "hex_cultist", name: "Hex Cultist", health: 22, damage: 6, rewardGold: 7,
      intents: [{ type: "debuff_hex", value: 2, label: "Hex Chant: apply Hex 2" }, { type: "attack", value: 8, label: "Dark Slash for 8" }] }),
    () => createEnemy({ id: "shield_crawler", name: "Shield Crawler", health: 29, damage: 7, rewardGold: 7,
      intents: [{ type: "block", value: 8, label: "Curl Up: gain 8 block" }, { type: "attack", value: 10, label: "Crush for 10" }] })
  ],
  // [venomfang, phantom_thief] — multi-hit + debuff
  [
    () => createEnemy({ id: "venomfang", name: "Venomfang", health: 25, damage: 7, rewardGold: 7,
      intents: [{ type: "attack_poison", value: 6, poison: 1, label: "Venom Bite for 6 + Poison 1" }, { type: "multi_attack", value: 3, hits: 2, label: "Rake: 2x3" }] }),
    () => createEnemy({ id: "phantom_thief", name: "Phantom Thief", health: 19, damage: 5, rewardGold: 7,
      intents: [{ type: "multi_attack", value: 4, hits: 3, label: "Pick Pocket: 3x4" }, { type: "debuff_weak", value: 2, label: "Smoke Bomb: apply Weak 2" }] })
  ]
];

const act2EncounterPairs = [
  // [hex_fiend, plague_rat] — hex + poison
  [
    () => createEnemy({ id: "hex_fiend", name: "Hex Fiend", health: 38, damage: 9, rewardGold: 8,
      intents: [{ type: "debuff_hex", value: 2, label: "Hex Bolt: apply Hex 2" }, { type: "attack", value: 9, label: "Cursed Strike for 9" }] }),
    () => createEnemy({ id: "plague_rat", name: "Plague Rat", health: 26, damage: 5, rewardGold: 8,
      intents: [{ type: "debuff_poison", value: 2, label: "Plague Bite: apply Poison 2" }, { type: "attack", value: 7, label: "Gnaw for 7" }] })
  ],
  // [void_specter, cinder_shade] — void + burn
  [
    () => createEnemy({ id: "void_specter", name: "Void Specter", health: 32, damage: 11, rewardGold: 8,
      intents: [{ type: "multi_attack", value: 5, hits: 2, label: "Void Slash: 2x5" }, { type: "debuff_hex", value: 1, label: "Void Taint: apply Hex 1" }] }),
    () => createEnemy({ id: "cinder_shade", name: "Cinder Shade", health: 27, damage: 6, rewardGold: 8,
      intents: [{ type: "debuff_burn", value: 2, label: "Ashen Touch: apply Burn 2" }, { type: "attack", value: 8, label: "Ember Lash for 8" }] })
  ],
  // [fangling x2 upgraded] — speed check
  [
    () => createEnemy({ id: "fangling", name: "Fangling", health: 32, damage: 8, rewardGold: 8,
      intents: [{ type: "multi_attack", value: 4, hits: 2, label: "Flurry: 2x4" }, { type: "attack", value: 10, label: "Pounce for 10" }] }),
    () => createEnemy({ id: "phantom_thief", name: "Phantom Thief", health: 30, damage: 7, rewardGold: 8,
      intents: [{ type: "multi_attack", value: 5, hits: 3, label: "Pick Pocket: 3x5" }, { type: "debuff_weak", value: 2, label: "Smoke Bomb: apply Weak 2" }] })
  ]
];

/**
 * Returns an array of 1 or 2 enemies for a node.
 * - 30% chance of a two-enemy encounter for `combat` nodes in Acts 1–2 (deterministic by seed + node id).
 * - Elites and bosses always return a single enemy.
 * - Two-enemy encounter HP is pre-reduced 20% in the pair definitions.
 */
const createEncounterForNode = (node, act, ascensionLevel, runSeed) => {
  const singleEnemy = createEnemyForNode(node, act, ascensionLevel, runSeed);

  // Only combat nodes in Acts 1-2 can spawn pairs
  if (node.type !== "combat" || act >= 3) {
    return [{ ...singleEnemy, maxHp: singleEnemy.health, turnIndex: 0 }];
  }

  const hash = hashString(`${runSeed || "x"}:${node.id || `${node.row}:${node.col}`}`);
  const isTwoEnemy = (hash % 10) < 3; // 30% chance

  if (!isTwoEnemy) {
    return [{ ...singleEnemy, maxHp: singleEnemy.health, turnIndex: 0 }];
  }

  const pairs = act === 2 ? act2EncounterPairs : act1EncounterPairs;
  const pairIndex = hash % pairs.length;
  const [makeA, makeB] = pairs[pairIndex];
  const eA = { ...scaleEnemyForAscension(makeA(), ascensionLevel, "combat"), maxHp: undefined };
  const eB = { ...scaleEnemyForAscension(makeB(), ascensionLevel, "combat"), maxHp: undefined };
  eA.maxHp = eA.health;
  eB.maxHp = eB.health;
  eA.turnIndex = 0;
  eB.turnIndex = 0;
  return [eA, eB];
};

module.exports = {
  createEnemy,
  createEnemyForNode,
  createEncounterForNode,
  resolveEnemyIntent,
  selectBossForAct,
  act1BossPool,
  act2BossPool,
  act3BossPool
};
