const { checkCombatEnd } = require("./combatState");
const { applyDamage } = require("./damage");

const BASIC_ENEMY_ATTACK_DAMAGE = 6;

const performEnemyAttack = (combat, damage = BASIC_ENEMY_ATTACK_DAMAGE) => {
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
