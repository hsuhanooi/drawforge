const { DEFAULT_PLAYER_HEALTH, DEFAULT_PLAYER_GOLD, DEFAULT_PLAYER_ENERGY } = require("./constants");
const { STRIKE_DAMAGE, DEFEND_BLOCK } = require("./cards");

const DEFAULT_BALANCE = {
  player: {
    health: DEFAULT_PLAYER_HEALTH,
    gold: DEFAULT_PLAYER_GOLD,
    energy: DEFAULT_PLAYER_ENERGY
  },
  cards: {
    strikeDamage: STRIKE_DAMAGE,
    defendBlock: DEFEND_BLOCK
  },
  enemy: {
    basicAttackDamage: 6,
    basicEnemyHealth: 30
  },
  rewards: {
    cardOptionCount: 3
  },
  map: {
    rows: 5,
    columns: 3
  }
};

const mergeSection = (defaults, overrides = {}) => ({
  ...defaults,
  ...overrides
});

const createBalanceConfig = (overrides = {}) => ({
  player: mergeSection(DEFAULT_BALANCE.player, overrides.player),
  cards: mergeSection(DEFAULT_BALANCE.cards, overrides.cards),
  enemy: mergeSection(DEFAULT_BALANCE.enemy, overrides.enemy),
  rewards: mergeSection(DEFAULT_BALANCE.rewards, overrides.rewards),
  map: mergeSection(DEFAULT_BALANCE.map, overrides.map)
});

module.exports = {
  DEFAULT_BALANCE,
  createBalanceConfig
};
