// @ts-check

/** @typedef {import("./domain").CombatMutationState} CombatMutationState */
/** @typedef {import("./domain").Card} Card */

const { createCard } = require("./card");

const STRIKE_DAMAGE = 6;
const DEFEND_BLOCK = 5;
const BASH_DAMAGE = 8;
const BARRIER_BLOCK = 8;
const QUICK_STRIKE_DAMAGE = 4;
const VOLLEY_DAMAGE = 5;
const HEX_DAMAGE_BONUS = 4;
const BURNOUT_DAMAGE = 12;
const CRACKDOWN_DAMAGE = 14;
const MOMENTUM_BLOCK = 7;
const WITHER_DAMAGE = 3;
const SIPHON_WARD_BLOCK = 4;
const DETONATE_SIGIL_DAMAGE = 7;
const DETONATE_SIGIL_HEX_BONUS = 10;
const LINGERING_CURSE_HEX = 2;

/** @returns {Card} */
const strikeCardDefinition = () =>
  createCard({
    id: "strike",
    name: "Strike",
    cost: 1,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - STRIKE_DAMAGE
      }
    })
  });

/** @returns {Card} */
const defendCardDefinition = () =>
  createCard({
    id: "defend",
    name: "Defend",
    cost: 1,
    type: "skill",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + DEFEND_BLOCK
      }
    })
  });

/** @returns {Card} */
const bashCardDefinition = () =>
  createCard({
    id: "bash",
    name: "Bash",
    cost: 2,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - BASH_DAMAGE
      }
    })
  });

/** @returns {Card} */
const barrierCardDefinition = () =>
  createCard({
    id: "barrier",
    name: "Barrier",
    cost: 2,
    type: "skill",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + BARRIER_BLOCK
      }
    })
  });

/** @returns {Card} */
const quickStrikeCardDefinition = () =>
  createCard({
    id: "quick_strike",
    name: "Quick Strike",
    cost: 0,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - QUICK_STRIKE_DAMAGE
      }
    })
  });

/** @returns {Card} */
const focusCardDefinition = () =>
  createCard({
    id: "focus",
    name: "Focus",
    cost: 1,
    type: "skill",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        energy: (state.player.energy ?? 0) + 1
      }
    })
  });

/** @returns {Card} */
const volleyCardDefinition = () =>
  createCard({
    id: "volley",
    name: "Volley",
    cost: 1,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - VOLLEY_DAMAGE
      },
      drawCount: (state.drawCount || 0) + 1
    })
  });

/** @returns {Card} */
const surgeCardDefinition = () =>
  createCard({
    id: "surge",
    name: "Surge",
    cost: 0,
    type: "skill",
    exhaust: true,
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        energy: (state.player.energy ?? 0) + 2
      }
    })
  });

/** @returns {Card} */
const hexCardDefinition = () =>
  createCard({
    id: "hex",
    name: "Hex",
    cost: 1,
    type: "skill",
    exhaust: true,
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        hex: (state.enemy.hex || 0) + 1
      }
    })
  });

/** @returns {Card} */
const punishCardDefinition = () =>
  createCard({
    id: "punish",
    name: "Punish",
    cost: 1,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - (STRIKE_DAMAGE + ((state.enemy.hex || 0) > 0 ? HEX_DAMAGE_BONUS : 0))
      }
    })
  });

/** @returns {Card} */
const burnoutCardDefinition = () =>
  createCard({
    id: "burnout",
    name: "Burnout",
    cost: 1,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - ((state.exhaustPile || []).length > 0 ? BURNOUT_DAMAGE : STRIKE_DAMAGE)
      }
    })
  });

/** @returns {Card} */
const crackdownCardDefinition = () =>
  createCard({
    id: "crackdown",
    name: "Crackdown",
    cost: 2,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - ((state.enemy.hex || 0) > 0 ? CRACKDOWN_DAMAGE : BASH_DAMAGE)
      }
    })
  });

/** @returns {Card} */
const momentumCardDefinition = () =>
  createCard({
    id: "momentum",
    name: "Momentum",
    cost: 1,
    type: "skill",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + ((state.player.energy ?? 0) >= 2 ? MOMENTUM_BLOCK : DEFEND_BLOCK)
      },
      drawCount: (state.drawCount || 0) + 1
    })
  });

/** @returns {Card} */
const witherCardDefinition = () =>
  createCard({
    id: "wither",
    name: "Wither",
    cost: 1,
    type: "skill",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - WITHER_DAMAGE,
        hex: (state.enemy.hex || 0) + 1
      }
    })
  });

/** @returns {Card} */
const siphonWardCardDefinition = () =>
  createCard({
    id: "siphon_ward",
    name: "Siphon Ward",
    cost: 1,
    type: "skill",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + SIPHON_WARD_BLOCK + ((state.enemy.hex || 0) > 0 ? 4 : 0)
      }
    })
  });

/** @returns {Card} */
const detonateSigilCardDefinition = () =>
  createCard({
    id: "detonate_sigil",
    name: "Detonate Sigil",
    cost: 2,
    type: "attack",
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - (DETONATE_SIGIL_DAMAGE + ((state.enemy.hex || 0) > 0 ? DETONATE_SIGIL_HEX_BONUS : 0))
      }
    })
  });

/** @returns {Card} */
const lingeringCurseCardDefinition = () =>
  createCard({
    id: "lingering_curse",
    name: "Lingering Curse",
    cost: 1,
    type: "skill",
    exhaust: true,
    /** @param {CombatMutationState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        hex: (state.enemy.hex || 0) + LINGERING_CURSE_HEX
      }
    })
  });

module.exports = {
  STRIKE_DAMAGE,
  DEFEND_BLOCK,
  BASH_DAMAGE,
  BARRIER_BLOCK,
  QUICK_STRIKE_DAMAGE,
  VOLLEY_DAMAGE,
  HEX_DAMAGE_BONUS,
  BURNOUT_DAMAGE,
  CRACKDOWN_DAMAGE,
  MOMENTUM_BLOCK,
  WITHER_DAMAGE,
  SIPHON_WARD_BLOCK,
  DETONATE_SIGIL_DAMAGE,
  DETONATE_SIGIL_HEX_BONUS,
  LINGERING_CURSE_HEX,
  strikeCardDefinition,
  defendCardDefinition,
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition,
  surgeCardDefinition,
  hexCardDefinition,
  punishCardDefinition,
  burnoutCardDefinition,
  crackdownCardDefinition,
  momentumCardDefinition,
  witherCardDefinition,
  siphonWardCardDefinition,
  detonateSigilCardDefinition,
  lingeringCurseCardDefinition
};
