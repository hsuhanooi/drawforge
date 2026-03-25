const { createCard } = require("./card");

const STRIKE_DAMAGE = 6;
const DEFEND_BLOCK = 5;

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

module.exports = {
  STRIKE_DAMAGE,
  DEFEND_BLOCK,
  strikeCardDefinition,
  defendCardDefinition
};
