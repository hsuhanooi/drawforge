const { checkCombatEnd } = require("./combatState");
const { applyDamage } = require("./damage");
const { resolveEnemyIntent } = require("./enemies");

const BASIC_ENEMY_ATTACK_DAMAGE = 6;

const applyEnemyIntent = (combat, intent) => {
  if (!intent) {
    return combat;
  }

  if (intent.type === "attack") {
    return checkCombatEnd(applyDamage(combat, intent.value));
  }

  if (intent.type === "multi_attack") {
    let next = combat;
    for (let i = 0; i < (intent.hits || 1); i += 1) {
      next = checkCombatEnd(applyDamage(next, intent.value));
      if (next.state !== "active") {
        break;
      }
    }
    return next;
  }

  if (intent.type === "block") {
    return {
      ...combat,
      enemy: {
        ...combat.enemy,
        block: (combat.enemy.block || 0) + intent.value
      }
    };
  }

  if (intent.type === "buff") {
    return {
      ...combat,
      enemy: {
        ...combat.enemy,
        damage: (combat.enemy.damage || BASIC_ENEMY_ATTACK_DAMAGE) + intent.value
      }
    };
  }

  return combat;
};

const resolveOverrideIntent = (damageOrBalance) => {
  if (typeof damageOrBalance === "number") {
    return { type: "attack", value: damageOrBalance, label: `Attack for ${damageOrBalance}` };
  }

  if (damageOrBalance && typeof damageOrBalance === "object" && damageOrBalance.enemy && typeof damageOrBalance.enemy.basicAttackDamage === "number") {
    const damage = damageOrBalance.enemy.basicAttackDamage;
    return { type: "attack", value: damage, label: `Attack for ${damage}` };
  }

  return null;
};

const performEnemyAttack = (combat, damageOrBalance) => {
  const turnNumber = combat.enemyTurnNumber || 0;
  const intent = resolveOverrideIntent(damageOrBalance) || combat.enemyIntent || resolveEnemyIntent(combat.enemy, turnNumber);
  const afterAction = applyEnemyIntent(combat, intent);
  const nextTurnNumber = turnNumber + 1;
  const nextIntent = afterAction.state === "active"
    ? resolveEnemyIntent(afterAction.enemy, nextTurnNumber)
    : null;

  return {
    ...afterAction,
    turn: afterAction.state === "active" ? "player" : afterAction.turn,
    enemyPhase: null,
    enemyTurnNumber: nextTurnNumber,
    enemyIntent: nextIntent
  };
};

module.exports = {
  BASIC_ENEMY_ATTACK_DAMAGE,
  applyEnemyIntent,
  performEnemyAttack
};
