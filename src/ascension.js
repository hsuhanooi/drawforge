const MAX_ASCENSION_LEVEL = 5;
const ASCENSION_HP_BONUS_PCT = {
  1: 0.1,
  4: 0.2
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
  if (clampAscensionLevel(ascensionLevel) < 3) return [...deck];
  return [...deck, "wound"];
};

const scaleEnemyForAscension = (enemy, ascensionLevel = 0, nodeType = "combat") => {
  const level = clampAscensionLevel(ascensionLevel);
  if (!level) return { ...enemy };

  let health = enemy.health;
  let damage = enemy.damage;

  if (level >= 4) {
    health = Math.ceil(health * (1 + ASCENSION_HP_BONUS_PCT[4]));
  } else if (level >= 1) {
    health = Math.ceil(health * (1 + ASCENSION_HP_BONUS_PCT[1]));
  }

  if (level >= 2) {
    damage += 1;
  }

  const next = {
    ...enemy,
    health,
    damage,
    intents: (enemy.intents || []).map((intent) => {
      if (typeof intent.value !== "number") return { ...intent };
      const scaledValue = level >= 2 && ["attack", "multi_attack", "attack_poison"].includes(intent.type)
        ? intent.value + 1
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

  return next;
};

const scaleShopPrice = (price, ascensionLevel = 0) => {
  if (clampAscensionLevel(ascensionLevel) < 4) return price;
  return Math.ceil(price * 1.25);
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
