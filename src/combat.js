// @ts-check

/** @typedef {import("./domain").CombatState} CombatState */
/** @typedef {import("./domain").CombatState["player"]} CombatPlayer */
/** @typedef {import("./domain").CombatState["enemy"]} CombatEnemy */

/**
 * @param {{ player: { health: number }, enemy: CombatEnemy }} input
 * @returns {CombatState}
 */
const createCombatEncounter = ({ player, enemy }) => ({
  state: "active",
  turn: "player",
  player: {
    health: player.health,
    block: 0,
    energy: 0,
    poison: 0,
    burn: 0
  },
  hand: [],
  drawPile: [],
  discardPile: [],
  enemy: {
    poison: 0,
    burn: 0,
    ...enemy
  }
});

module.exports = {
  createCombatEncounter
};
