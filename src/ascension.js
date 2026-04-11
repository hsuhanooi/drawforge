const MAX_ASCENSION_LEVEL = 10;
const ASCENSION_HP_BONUS_PCT = {
  1: 0.1,
  4: 0.2,
  7: 0.35,
  10: 0.6
};

const clampAscensionLevel = (level) => {
  const value = Number.isFinite(Number(level)) ? Number(level) : 0;
  return Math.max(0, Math.min(MAX_ASCENSION_LEVEL, Math.floor(value)));
};

const getUnlockedAscensionLevel = (wins = 0) => {
  const unlocked = Math.max(0, Math.min(MAX_ASCENSION_LEVEL, Math.floor(Number(wins) || 0)));
  return unlocked;
};

const getRecommendedAscensionLevel = (wins = 0) => getUnlockedAscensionLevel(wins);

const applyAscensionToDeck = (deck, ascensionLevel = 0) => {
  const level = clampAscensionLevel(ascensionLevel);
  const wounds = level >= 10 ? 3 : level >= 6 ? 2 : level >= 3 ? 1 : 0;
  const extra = Array.from({ length: wounds }, () => "wound");
  return [...deck, ...extra];
};

const scaleEnemyForAscension = (enemy, ascensionLevel = 0, nodeType = "combat") => {
  const level = clampAscensionLevel(ascensionLevel);
  if (!level) return { ...enemy };

  let health = enemy.health;
  let damage = enemy.damage;

  // HP scaling: tiered
  if (level >= 10) {
    health = Math.ceil(health * (1 + ASCENSION_HP_BONUS_PCT[10]));
  } else if (level >= 7) {
    health = Math.ceil(health * (1 + ASCENSION_HP_BONUS_PCT[7]));
  } else if (level >= 4) {
    health = Math.ceil(health * (1 + ASCENSION_HP_BONUS_PCT[4]));
  } else if (level >= 1) {
    health = Math.ceil(health * (1 + ASCENSION_HP_BONUS_PCT[1]));
  }

  // Damage scaling
  if (level >= 9) {
    damage += 3;
  } else if (level >= 6) {
    damage += 2;
  } else if (level >= 2) {
    damage += 1;
  }

  const intentDamageBonus = level >= 9 ? 3 : level >= 6 ? 2 : level >= 2 ? 1 : 0;

  const next = {
    ...enemy,
    health,
    damage,
    intents: (enemy.intents || []).map((intent) => {
      if (typeof intent.value !== "number") return { ...intent };
      const scaledValue = intentDamageBonus > 0 && ["attack", "multi_attack", "attack_poison"].includes(intent.type)
        ? intent.value + intentDamageBonus
        : intent.value;
      return {
        ...intent,
        value: scaledValue,
        label: typeof intent.label === "string"
          ? intent.label.replace(/(\d+)(?!.*\d)/, String(scaledValue))
          : intent.label
      };
    })
  };

  // Level 8+: elites and bosses start with 1 strength
  if (level >= 8 && nodeType !== "combat") {
    next.strength = (next.strength || 0) + 1;
  }

  // Level 5+: boss starts in phase 2
  if (level >= 5 && nodeType === "boss") {
    if (Array.isArray(next.phaseIntents) && next.phaseIntents[1]) {
      next.phase = 2;
      next.intents = next.phaseIntents[1];
      next.strength = (next.strength || 0) + (next.phase2Strength || 0);
    } else if (Array.isArray(next.phase2Intents)) {
      next.phase = 2;
      next.intents = next.phase2Intents;
      next.strength = (next.strength || 0) + (next.phase2Strength || 0);
    }
  }

  // Level 10: boss starts in phase 3 (if available)
  if (level >= 10 && nodeType === "boss") {
    if (Array.isArray(next.phaseIntents) && next.phaseIntents[2]) {
      next.phase = 3;
      next.intents = next.phaseIntents[2];
      next.strength = (next.strength || 0) + (next.phase3Strength || 0);
    }
  }

  return next;
};

const scaleShopPrice = (price, ascensionLevel = 0) => {
  const level = clampAscensionLevel(ascensionLevel);
  if (level >= 8) return Math.ceil(price * 1.5);
  if (level >= 4) return Math.ceil(price * 1.25);
  return price;
};

module.exports = {
  MAX_ASCENSION_LEVEL,
  clampAscensionLevel,
  getUnlockedAscensionLevel,
  getRecommendedAscensionLevel,
  applyAscensionToDeck,
  scaleEnemyForAscension,
  scaleShopPrice
};
