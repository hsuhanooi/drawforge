const { createCard } = require("./card");

const STRIKE_DAMAGE = 6;
const DEFEND_BLOCK = 5;
const BASH_DAMAGE = 8;
const BARRIER_BLOCK = 8;
const QUICK_STRIKE_DAMAGE = 4;
const VOLLEY_DAMAGE = 5;

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
  strikeCardDefinition,
  defendCardDefinition,
  bashCardDefinition,
  barrierCardDefinition,
  quickStrikeCardDefinition,
  focusCardDefinition,
  volleyCardDefinition
};
