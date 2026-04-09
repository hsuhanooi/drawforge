// @ts-check

/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CombatState} CombatState */

const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * @param {import("./domain").CardCondition} condition
 * @param {CombatState} state
 * @returns {boolean}
 */
const evaluateCondition = (condition, state) => {
  if (!condition) return false;
  switch (condition.kind) {
    case "enemy_hexed":
      return (state.enemy?.hex || 0) > 0;
    case "player_charged":
      return !!state.player?.charged;
    case "exhausted_this_turn":
      return (state.exhaustedThisTurn || 0) >= (condition.value || 1);
    case "player_energy_at_least":
      return (state.player?.energy || 0) >= (condition.value || 0);
    default:
      return false;
  }
};

/**
 * @param {CombatState} state
 * @param {import("./domain").CardEffectStep} step
 * @returns {CombatState}
 */
const applyEffectStep = (state, step) => {
  const next = clone(state);
  switch (step.type) {
    case "damage":
      next.enemy.health -= step.amount || 0;
      return next;
    case "block":
      next.player.block = (next.player.block || 0) + (step.amount || 0);
      return next;
    case "draw":
      next.drawCount = (next.drawCount || 0) + (step.amount || 0);
      return next;
    case "energy":
      next.player.energy = (next.player.energy || 0) + (step.amount || 0);
      return next;
    case "hex":
      next.enemy.hex = (next.enemy.hex || 0) + (step.amount || 0);
      return next;
    case "exhaust_hand":
      next.exhaustFromHand = true;
      return next;
    case "conditional": {
      const branch = evaluateCondition(step.condition, next) ? step.then : step.else;
      return (branch || []).reduce(applyEffectStep, next);
    }
    default:
      return next;
  }
};

/**
 * @param {Card} card
 * @param {CombatState} state
 * @returns {CombatState}
 */
const executeCardEffect = (card, state) => {
  if (Array.isArray(card.effects) && card.effects.length > 0) {
    return card.effects.reduce(applyEffectStep, state);
  }
  if (typeof card.effect === "function") {
    return card.effect(state);
  }
  return state;
};

module.exports = {
  executeCardEffect
};
