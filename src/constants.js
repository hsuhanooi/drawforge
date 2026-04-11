const DEFAULT_PLAYER_HEALTH = 80;
const DEFAULT_PLAYER_GOLD = 99;
const DEFAULT_PLAYER_ENERGY = 3;
const MAX_POISON_STACKS = 20;
const MAX_BURN_STACKS = 20;
const MAX_HEX_STACKS = 10;
const MAX_EXHAUST_ENERGY_PER_TURN = 2;
const MAX_ENEMIES = 3;
const MAX_POWERS = 3;
const RUN_STATE_IN_PROGRESS = "in_progress";
const DEFAULT_STARTER_DECK = [
  "strike",
  "strike",
  "strike",
  "strike",
  "strike",
  "defend",
  "defend",
  "defend",
  "defend",
  "defend"
];

module.exports = {
  DEFAULT_PLAYER_HEALTH,
  DEFAULT_PLAYER_GOLD,
  DEFAULT_PLAYER_ENERGY,
  MAX_POISON_STACKS,
  MAX_BURN_STACKS,
  MAX_HEX_STACKS,
  MAX_EXHAUST_ENERGY_PER_TURN,
  MAX_ENEMIES,
  MAX_POWERS,
  RUN_STATE_IN_PROGRESS,
  DEFAULT_STARTER_DECK
};
