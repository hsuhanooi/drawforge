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
  },
  {
    id: "block_potion",
    name: "Block Potion",
    description: "Gain 12 Block.",
    rarity: "common"
  },
  {
    id: "energy_potion",
    name: "Energy Potion",
    description: "Gain 2 Energy this turn.",
    rarity: "common"
  },
  {
    id: "swift_potion",
    name: "Swift Potion",
    description: "Draw 2 cards.",
    rarity: "common"
  },
  {
    id: "vulnerable_potion",
    name: "Vulnerable Potion",
    description: "Apply 3 Vulnerable to the enemy.",
    rarity: "uncommon"
  },
  {
    id: "weak_potion",
    name: "Weak Potion",
    description: "Apply 3 Weak to the enemy.",
    rarity: "uncommon"
  },
  {
    id: "antidote_potion",
    name: "Antidote Potion",
    description: "Remove Weak from yourself. Restore 5 HP.",
    rarity: "common"
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
  if (potionId === "block_potion") {
    return {
      ...combat,
      player: { ...combat.player, block: (combat.player.block || 0) + 12 }
    };
  }
  if (potionId === "energy_potion") {
    return {
      ...combat,
      player: { ...combat.player, energy: combat.player.energy + 2 }
    };
  }
  if (potionId === "swift_potion") {
    const next = { ...combat, hand: [...combat.hand], drawPile: [...combat.drawPile], discardPile: [...combat.discardPile] };
    for (let i = 0; i < 2; i += 1) {
      if (next.drawPile.length === 0 && next.discardPile.length > 0) {
        next.drawPile = [...next.discardPile];
        next.discardPile = [];
      }
      if (next.drawPile.length === 0) break;
      next.hand.push(next.drawPile.shift());
    }
    return next;
  }
  if (potionId === "vulnerable_potion") {
    return {
      ...combat,
      enemy: { ...combat.enemy, vulnerable: (combat.enemy.vulnerable || 0) + 3 }
    };
  }
  if (potionId === "weak_potion") {
    return {
      ...combat,
      enemy: { ...combat.enemy, weak: (combat.enemy.weak || 0) + 3 }
    };
  }
  if (potionId === "antidote_potion") {
    const maxHealth = combat.player.maxHealth || combat.player.health;
    return {
      ...combat,
      player: {
        ...combat.player,
        weak: 0,
        health: Math.min(combat.player.health + 5, maxHealth)
      }
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
