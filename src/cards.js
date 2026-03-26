// @ts-check

/** @typedef {import("./domain").CombatState} CombatState */
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

// New card constants
const CREMATE_BLOCK = 6;
const MARK_OF_RUIN_HEX = 1;
const HEXBLADE_DAMAGE = 7;
const HEXBLADE_HEX = 1;
const REAPERS_CLAUSE_DAMAGE = 10;
const BRAND_THE_SOUL_HEX = 1;
const HARVESTER_DAMAGE = 4;
const HARVESTER_BONUS = 4;
const ARC_LASH_DAMAGE = 7;
const BLOOD_PACT_SELF_DAMAGE = 3;
const BLOOD_PACT_ENERGY = 2;
const SPITE_SHIELD_BLOCK = 6;
const SPITE_SHIELD_HEX = 1;

/** @returns {Card} */
const strikeCardDefinition = () =>
  createCard({
    id: "strike",
    name: "Strike",
    cost: 1,
    type: "attack",
    rarity: "common",
    /** @param {CombatState} state */
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
    rarity: "common",
    /** @param {CombatState} state */
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
    rarity: "common",
    /** @param {CombatState} state */
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
    rarity: "common",
    /** @param {CombatState} state */
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
    rarity: "common",
    /** @param {CombatState} state */
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
    rarity: "common",
    /** @param {CombatState} state */
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
    rarity: "common",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
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
    rarity: "uncommon",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        hex: (state.enemy.hex || 0) + LINGERING_CURSE_HEX
      }
    })
  });

// ── New cards ──────────────────────────────────────────────────────────────

/** @returns {Card} */
const markOfRuinCardDefinition = () =>
  createCard({
    id: "mark_of_ruin",
    name: "Mark of Ruin",
    cost: 1,
    type: "skill",
    rarity: "common",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        hex: (state.enemy.hex || 0) + MARK_OF_RUIN_HEX
      },
      drawCount: (state.drawCount || 0) + 1
    })
  });

/** @returns {Card} */
const hexbladeCardDefinition = () =>
  createCard({
    id: "hexblade",
    name: "Hexblade",
    cost: 1,
    type: "attack",
    rarity: "common",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - HEXBLADE_DAMAGE,
        hex: (state.enemy.hex || 0) + HEXBLADE_HEX
      }
    })
  });

/** @returns {Card} */
const reaperSClauseCardDefinition = () =>
  createCard({
    id: "reapers_clause",
    name: "Reaper's Clause",
    cost: 2,
    type: "attack",
    rarity: "uncommon",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - REAPERS_CLAUSE_DAMAGE
      }
    })
  });

/** @returns {Card} */
const fireSaleCardDefinition = () =>
  createCard({
    id: "fire_sale",
    name: "Fire Sale",
    cost: 0,
    type: "skill",
    rarity: "common",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      exhaustFromHand: true,
      drawCount: (state.drawCount || 0) + 2
    })
  });

/** @returns {Card} */
const cremateCardDefinition = () =>
  createCard({
    id: "cremate",
    name: "Cremate",
    cost: 1,
    type: "skill",
    rarity: "common",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + CREMATE_BLOCK
      },
      exhaustFromHand: true
    })
  });

/** @returns {Card} */
const graveFuelCardDefinition = () =>
  createCard({
    id: "grave_fuel",
    name: "Grave Fuel",
    cost: 1,
    type: "skill",
    rarity: "rare",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        energy: (state.player.energy ?? 0) + (state.exhaustedThisTurn || 0)
      }
    })
  });

/** @returns {Card} */
const brandTheSoulCardDefinition = () =>
  createCard({
    id: "brand_the_soul",
    name: "Brand the Soul",
    cost: 1,
    type: "skill",
    rarity: "uncommon",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        hex: (state.enemy.hex || 0) + BRAND_THE_SOUL_HEX
      },
      exhaustFromHand: true
    })
  });

/** @returns {Card} */
const harvesterCardDefinition = () =>
  createCard({
    id: "harvester",
    name: "Harvester",
    cost: 1,
    type: "attack",
    rarity: "rare",
    /** @param {CombatState} state */
    effect: (state) => {
      const hexBonus = (state.enemy.hex || 0) > 0 ? HARVESTER_BONUS : 0;
      const exhaustBonus = (state.exhaustedThisTurn || 0) > 0 ? HARVESTER_BONUS : 0;
      return {
        ...state,
        enemy: {
          ...state.enemy,
          health: state.enemy.health - HARVESTER_DAMAGE - hexBonus - exhaustBonus
        }
      };
    }
  });

/** @returns {Card} */
const chargeUpCardDefinition = () =>
  createCard({
    id: "charge_up",
    name: "Charge Up",
    cost: 1,
    type: "skill",
    rarity: "common",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        charged: true
      },
      drawCount: (state.drawCount || 0) + 1
    })
  });

/** @returns {Card} */
const arcLashCardDefinition = () =>
  createCard({
    id: "arc_lash",
    name: "Arc Lash",
    cost: 1,
    type: "attack",
    rarity: "common",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - ARC_LASH_DAMAGE
      },
      drawCount: state.player.charged ? (state.drawCount || 0) + 1 : (state.drawCount || 0)
    })
  });

/** @returns {Card} */
const bloodPactCardDefinition = () =>
  createCard({
    id: "blood_pact",
    name: "Blood Pact",
    cost: 0,
    type: "skill",
    rarity: "rare",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        health: state.player.health - BLOOD_PACT_SELF_DAMAGE,
        energy: (state.player.energy ?? 0) + BLOOD_PACT_ENERGY
      },
      drawCount: (state.drawCount || 0) + 1
    })
  });

/** @returns {Card} */
const spiteShieldCardDefinition = () =>
  createCard({
    id: "spite_shield",
    name: "Spite Shield",
    cost: 1,
    type: "skill",
    rarity: "uncommon",
    /** @param {CombatState} state */
    effect: (state) => ({
      ...state,
      player: {
        ...state.player,
        block: state.player.block + SPITE_SHIELD_BLOCK
      },
      enemy: {
        ...state.enemy,
        hex: (state.enemy.hex || 0) + SPITE_SHIELD_HEX
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
  MARK_OF_RUIN_HEX,
  HEXBLADE_DAMAGE,
  HEXBLADE_HEX,
  REAPERS_CLAUSE_DAMAGE,
  CREMATE_BLOCK,
  HARVESTER_DAMAGE,
  HARVESTER_BONUS,
  ARC_LASH_DAMAGE,
  BLOOD_PACT_SELF_DAMAGE,
  BLOOD_PACT_ENERGY,
  SPITE_SHIELD_BLOCK,
  SPITE_SHIELD_HEX,
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
  lingeringCurseCardDefinition,
  markOfRuinCardDefinition,
  hexbladeCardDefinition,
  reaperSClauseCardDefinition,
  fireSaleCardDefinition,
  cremateCardDefinition,
  graveFuelCardDefinition,
  brandTheSoulCardDefinition,
  harvesterCardDefinition,
  chargeUpCardDefinition,
  arcLashCardDefinition,
  bloodPactCardDefinition,
  spiteShieldCardDefinition
};
