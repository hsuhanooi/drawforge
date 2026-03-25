const { createBalanceConfig } = require("./balance");
const { checkCombatEnd } = require("./combatState");
const { applyDamage } = require("./damage");

const BASIC_ENEMY_ATTACK_DAMAGE = 6;

const resolveEnemyDamage = (damageOrBalance) => {
  if (typeof damageOrBalance === "number") {
    return damageOrBalance;
  }

  if (damageOrBalance && typeof damageOrBalance === "object") {
    return createBalanceConfig(damageOrBalance).enemy.basicAttackDamage;
  }

  return BASIC_ENEMY_ATTACK_DAMAGE;
};

const performEnemyAttack = (combat, damageOrBalance = BASIC_ENEMY_ATTACK_DAMAGE) => {
  const damage = resolveEnemyDamage(damageOrBalance);
  const afterDamage = checkCombatEnd(applyDamage(combat, damage));

  return {
    ...afterDamage,
    turn: "player",
    enemyPhase: null
  };
};

module.exports = {
  BASIC_ENEMY_ATTACK_DAMAGE,
  performEnemyAttack
};
