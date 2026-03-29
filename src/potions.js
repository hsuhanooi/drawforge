const POTIONS = [
  {
    id: "healing_potion",
    name: "Healing Potion",
    description: "Restore 10 HP.",
    rarity: "common"
  },
  {
    id: "strength_potion",
    name: "Strength Potion",
    description: "Gain 2 Strength for this combat.",
    rarity: "uncommon"
  },
  {
    id: "hex_vial",
    name: "Hex Vial",
    description: "Apply Hex 2 to the enemy.",
    rarity: "uncommon"
  }
];

const MAX_POTIONS = 2;

const POTION_DROP_CHANCE = 0.4;

const createRandomPotion = (rng = Math.random) => {
  const index = Math.floor(rng() * POTIONS.length);
  return { ...POTIONS[index] };
};

const applyPotion = (combat, potionId) => {
  if (potionId === "healing_potion") {
    const maxHealth = combat.player.maxHealth || combat.player.health;
    return {
      ...combat,
      player: { ...combat.player, health: Math.min(combat.player.health + 10, maxHealth) }
    };
  }
  if (potionId === "strength_potion") {
    return {
      ...combat,
      player: { ...combat.player, strength: (combat.player.strength || 0) + 2 }
    };
  }
  if (potionId === "hex_vial") {
    return {
      ...combat,
      enemy: { ...combat.enemy, hex: (combat.enemy.hex || 0) + 2 }
    };
  }
  throw new Error(`Unknown potion: ${potionId}`);
};

module.exports = {
  POTIONS,
  MAX_POTIONS,
  POTION_DROP_CHANCE,
  createRandomPotion,
  applyPotion
};
