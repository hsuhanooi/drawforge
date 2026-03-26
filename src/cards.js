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

const strikeCardDefinition = () =>
  createCard({
    id: "strike",
    name: "Strike",
    cost: 1,
    type: "attack",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - STRIKE_DAMAGE
      }
    })
  });

const defendCardDefinition = () =>
  createCard({
    id: "defend",
    name: "Defend",
    cost: 1,
    type: "skill",
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + DEFEND_BLOCK
      }
    })
  });

const bashCardDefinition = () =>
  createCard({
    id: "bash",
    name: "Bash",
    cost: 2,
    type: "attack",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - BASH_DAMAGE
      }
    })
  });

const barrierCardDefinition = () =>
  createCard({
    id: "barrier",
    name: "Barrier",
    cost: 2,
    type: "skill",
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + BARRIER_BLOCK
      }
    })
  });

const quickStrikeCardDefinition = () =>
  createCard({
    id: "quick_strike",
    name: "Quick Strike",
    cost: 0,
    type: "attack",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - QUICK_STRIKE_DAMAGE
      }
    })
  });

const focusCardDefinition = () =>
  createCard({
    id: "focus",
    name: "Focus",
    cost: 1,
    type: "skill",
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        energy: (state.player.energy ?? 0) + 1
      }
    })
  });

const volleyCardDefinition = () =>
  createCard({
    id: "volley",
    name: "Volley",
    cost: 1,
    type: "attack",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - VOLLEY_DAMAGE
      },
      drawCount: (state.drawCount || 0) + 1
    })
  });

const surgeCardDefinition = () =>
  createCard({
    id: "surge",
    name: "Surge",
    cost: 0,
    type: "skill",
    exhaust: true,
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        energy: (state.player.energy ?? 0) + 2
      }
    })
  });

const hexCardDefinition = () =>
  createCard({
    id: "hex",
    name: "Hex",
    cost: 1,
    type: "skill",
    exhaust: true,
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        hex: (state.enemy.hex || 0) + 1
      }
    })
  });

const punishCardDefinition = () =>
  createCard({
    id: "punish",
    name: "Punish",
    cost: 1,
    type: "attack",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - (STRIKE_DAMAGE + ((state.enemy.hex || 0) > 0 ? HEX_DAMAGE_BONUS : 0))
      }
    })
  });

const burnoutCardDefinition = () =>
  createCard({
    id: "burnout",
    name: "Burnout",
    cost: 1,
    type: "attack",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - ((state.exhaustPile || []).length > 0 ? BURNOUT_DAMAGE : STRIKE_DAMAGE)
      }
    })
  });

const crackdownCardDefinition = () =>
  createCard({
    id: "crackdown",
    name: "Crackdown",
    cost: 2,
    type: "attack",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - ((state.enemy.hex || 0) > 0 ? CRACKDOWN_DAMAGE : BASH_DAMAGE)
      }
    })
  });

const momentumCardDefinition = () =>
  createCard({
    id: "momentum",
    name: "Momentum",
    cost: 1,
    type: "skill",
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + ((state.player.energy ?? 0) >= 2 ? MOMENTUM_BLOCK : DEFEND_BLOCK)
      },
      drawCount: (state.drawCount || 0) + 1
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
  momentumCardDefinition
};
