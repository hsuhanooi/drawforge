const createCombatEncounter = ({ player, enemy }) => ({
  state: "active",
  turn: "player",
  player: {
    health: player.health,
    block: 0,
    energy: 0
  },
  hand: [],
  discardPile: [],
  enemy: {
    ...enemy
  }
});

module.exports = {
  createCombatEncounter
};
