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

/** @returns {Card} */
const warCryCardDefinition = () =>
  createCard({
    id: "war_cry",
    name: "War Cry",
    cost: 1,
    type: "skill",
    rarity: "uncommon",
    effect: (state) => ({
      ...state,
      player: { ...state.player, strength: (state.player.strength || 0) + 2 }
    })
  });

/** @returns {Card} */
const fortifyCardDefinition = () =>
  createCard({
    id: "fortify",
    name: "Fortify",
    cost: 1,
    type: "skill",
    rarity: "uncommon",
    effect: (state) => ({
      ...state,
      player: { ...state.player, dexterity: (state.player.dexterity || 0) + 2 }
    })
  });

/** @returns {Card} */
const exposeCardDefinition = () =>
  createCard({
    id: "expose",
    name: "Expose",
    cost: 1,
    type: "skill",
    rarity: "common",
    effect: (state) => ({
      ...state,
      enemy: { ...state.enemy, vulnerable: (state.enemy.vulnerable || 0) + 2 }
    })
  });

/** @returns {Card} */
const crippleCardDefinition = () =>
  createCard({
    id: "cripple",
    name: "Cripple",
    cost: 1,
    type: "skill",
    rarity: "common",
    effect: (state) => ({
      ...state,
      enemy: { ...state.enemy, weak: (state.enemy.weak || 0) + 2 }
    })
  });

/** @returns {Card} */
const titanStrikeCardDefinition = () =>
  createCard({
    id: "titan_strike",
    name: "Titan Strike",
    cost: 2,
    type: "attack",
    rarity: "uncommon",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - 8 - (state.player.strength || 0) * 2
      }
    })
  });

/** @returns {Card} */
const exploitCardDefinition = () =>
  createCard({
    id: "exploit",
    name: "Exploit",
    cost: 2,
    type: "attack",
    rarity: "uncommon",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - ((state.enemy.vulnerable || 0) > 0 ? 12 : 6)
      }
    })
  });

/** @returns {Card} */
const enfeebleCardDefinition = () =>
  createCard({
    id: "enfeeble",
    name: "Enfeeble",
    cost: 2,
    type: "skill",
    rarity: "uncommon",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        weak: (state.enemy.weak || 0) + 3,
        vulnerable: (state.enemy.vulnerable || 0) + 1
      }
    })
  });

/** @returns {Card} */
const echoStrikeCardDefinition = () =>
  createCard({
    id: "echo_strike",
    name: "Echo Strike",
    cost: 2,
    type: "attack",
    rarity: "common",
    effect: (state) => ({
      ...state,
      enemy: {
        ...state.enemy,
        health: state.enemy.health - ((state.enemy.vulnerable || 0) > 0 ? 10 : 5)
      }
    })
  });

/** @returns {Card} */
const pommelCardDefinition = () => createCard({ id: "pommel", name: "Pommel", cost: 1, type: "attack", rarity: "common",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 7 } }) });

/** @returns {Card} */
const braceCardDefinition = () => createCard({ id: "brace", name: "Brace", cost: 1, type: "skill", rarity: "common",
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + 7 } }) });

/** @returns {Card} */
const insightCardDefinition = () => createCard({ id: "insight", name: "Insight", cost: 1, type: "skill", rarity: "common",
  effect: (state) => state });

/** @returns {Card} */
const parryCardDefinition = () => createCard({ id: "parry", name: "Parry", cost: 0, type: "skill", rarity: "common",
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + 3 } }) });

/** @returns {Card} */
const heavySwingCardDefinition = () => createCard({ id: "heavy_swing", name: "Heavy Swing", cost: 2, type: "attack", rarity: "common",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 12 } }) });

/** @returns {Card} */
const recoverCardDefinition = () => createCard({ id: "recover", name: "Recover", cost: 1, type: "skill", rarity: "uncommon",
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + 6 } }) });

/** @returns {Card} */
const planAheadCardDefinition = () => createCard({ id: "plan_ahead", name: "Plan Ahead", cost: 0, type: "skill", rarity: "common",
  effect: (state) => state });

/** @returns {Card} */
const deepHexCardDefinition = () => createCard({ id: "deep_hex", name: "Deep Hex", cost: 2, type: "skill", rarity: "uncommon",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, hex: (state.enemy.hex || 0) + 3 } }) });

/** @returns {Card} */
const blackSealCardDefinition = () => createCard({ id: "black_seal", name: "Black Seal", cost: 0, type: "skill", rarity: "common",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, hex: (state.enemy.hex || 0) + 1 } }) });

/** @returns {Card} */
const feastOnWeaknessCardDefinition = () => createCard({ id: "feast_on_weakness", name: "Feast on Weakness", cost: 1, type: "attack", rarity: "common",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 5 } }) });

/** @returns {Card} */
const maledictionCardDefinition = () => createCard({ id: "malediction", name: "Malediction", cost: 1, type: "skill", rarity: "uncommon",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, hex: (state.enemy.hex || 0) + 1 } }) });

/** @returns {Card} */
const ironWillCardDefinition = () => createCard({ id: "iron_will", name: "Iron Will", cost: 2, type: "power", rarity: "uncommon",
  effect: (state) => state });

/** @returns {Card} */
const burningAuraCardDefinition = () => createCard({ id: "burning_aura", name: "Burning Aura", cost: 2, type: "power", rarity: "uncommon",
  effect: (state) => state });

/** @returns {Card} */
const hexResonanceCardDefinition = () => createCard({ id: "hex_resonance", name: "Hex Resonance", cost: 1, type: "power", rarity: "uncommon",
  effect: (state) => state });

// ── Milestone 10: Charged archetype ───────────────────────────────────────

/** @returns {Card} */
const staticGuardCardDefinition = () => createCard({ id: "static_guard", name: "Static Guard", cost: 1, type: "skill", rarity: "common",
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + 6 } }) });

/** @returns {Card} */
const capacitorCardDefinition = () => createCard({ id: "capacitor", name: "Capacitor", cost: 0, type: "skill", rarity: "common", exhaust: true,
  effect: (state) => ({ ...state, player: { ...state.player, charged: true } }) });

/** @returns {Card} */
const releaseCardDefinition = () => createCard({ id: "release", name: "Release", cost: 2, type: "attack", rarity: "uncommon",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 14 } }) });

/** @returns {Card} */
const guardedPulseCardDefinition = () => createCard({ id: "guarded_pulse", name: "Guarded Pulse", cost: 1, type: "skill", rarity: "common",
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + (state.player.charged ? 10 : 5) } }) });

/** @returns {Card} */
const flashstepCardDefinition = () => createCard({ id: "flashstep", name: "Flashstep", cost: 0, type: "skill", rarity: "uncommon",
  effect: (state) => state });

// ── Milestone 10: Exhaust archetype ───────────────────────────────────────

/** @returns {Card} */
const overclockCardDefinition = () => createCard({ id: "overclock", name: "Overclock", cost: 1, type: "skill", rarity: "uncommon", exhaust: true,
  effect: (state) => ({ ...state, player: { ...state.player, energy: (state.player.energy ?? 0) + 2 } }) });

/** @returns {Card} */
const ashenBlowCardDefinition = () => createCard({ id: "ashen_blow", name: "Ashen Blow", cost: 1, type: "attack", rarity: "uncommon",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 7 } }) });

/** @returns {Card} */
const finalDraftCardDefinition = () => createCard({ id: "final_draft", name: "Final Draft", cost: 1, type: "skill", rarity: "uncommon",
  effect: (state) => state });

/** @returns {Card} */
const scorchNervesCardDefinition = () => createCard({ id: "scorch_nerves", name: "Scorch Nerves", cost: 2, type: "attack", rarity: "common", exhaust: true,
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 12 } }) });

/** @returns {Card} */
const cinderRushCardDefinition = () => createCard({ id: "cinder_rush", name: "Cinder Rush", cost: 1, type: "attack", rarity: "uncommon",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 6 } }) });

/** @returns {Card} */
const emptyTheChamberCardDefinition = () => createCard({ id: "empty_the_chamber", name: "Empty the Chamber", cost: 1, type: "skill", rarity: "rare",
  effect: (state) => state });

// ── Milestone 10: Hex archetype ────────────────────────────────────────────

/** @returns {Card} */
const curseSpiralCardDefinition = () => createCard({ id: "curse_spiral", name: "Curse Spiral", cost: 2, type: "skill", rarity: "uncommon",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, hex: (state.enemy.hex || 0) + 1 } }) });

/** id: "cataclysm_sigil" @returns {Card} */
const cataclysmSigilCardDefinition = () => createCard({ id: "cataclysm_sigil", name: "Cataclysm Sigil", cost: 3, type: "attack", rarity: "rare",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 18 } }) });

/** @returns {Card} */
const noMercyCardDefinition = () => createCard({ id: "no_mercy", name: "No Mercy", cost: 2, type: "attack", rarity: "rare",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 10 } }) });

/** @returns {Card} */
const hexburstCardDefinition = () => createCard({ id: "hexburst", name: "Hexburst", cost: 2, type: "attack", rarity: "rare",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 6, hex: 0 } }) });

// ── Milestone 10: Hex / Exhaust hybrids ───────────────────────────────────

/** @returns {Card} */
const soulRendCardDefinition = () => createCard({ id: "soul_rend", name: "Soul Rend", cost: 2, type: "attack", rarity: "rare",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 9 } }) });

/** @returns {Card} */
const doomEngineCardDefinition = () => createCard({ id: "doom_engine", name: "Doom Engine", cost: 1, type: "skill", rarity: "rare",
  effect: (state) => state });

/** @returns {Card} */
const unsealCardDefinition = () => createCard({ id: "unseal", name: "Unseal", cost: 1, type: "attack", rarity: "uncommon", exhaust: true,
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - ((state.enemy.hex || 0) > 0 ? 10 : 5) } }) });

/** @returns {Card} */
const ritualCollapseCardDefinition = () => createCard({ id: "ritual_collapse", name: "Ritual Collapse", cost: 2, type: "skill", rarity: "rare",
  effect: (state) => state });

/** @returns {Card} */
const doomBellCardDefinition = () => createCard({ id: "doom_bell", name: "Doom Bell", cost: 2, type: "skill", rarity: "rare",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, hex: (state.enemy.hex || 0) + 2 } }) });

// ── Milestone 10: Defense / utility ───────────────────────────────────────

/** @returns {Card} */
const hollowWardCardDefinition = () => createCard({ id: "hollow_ward", name: "Hollow Ward", cost: 1, type: "skill", rarity: "common", exhaust: true,
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + 8 } }) });

/** @returns {Card} */
const refrainCardDefinition = () => createCard({ id: "refrain", name: "Refrain", cost: 1, type: "skill", rarity: "uncommon",
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + 4 } }) });

/** @returns {Card} */
const wardingCircleCardDefinition = () => createCard({ id: "warding_circle", name: "Warding Circle", cost: 2, type: "skill", rarity: "uncommon",
  effect: (state) => ({ ...state, player: { ...state.player, block: (state.player.block || 0) + 12 } }) });

/** @returns {Card} */
const lastWordCardDefinition = () => createCard({ id: "last_word", name: "Last Word", cost: 1, type: "attack", rarity: "rare",
  effect: (state) => ({ ...state, enemy: { ...state.enemy, health: state.enemy.health - 8 } }) });

// ─── Curse cards ─────────────────────────────────────────────────────────────
// Curses are never in the reward pool — they are inflicted as penalties.

/** When drawn: deal 1 damage to self */
const woundCardDefinition = () => createCard({ id: "wound", name: "Wound", cost: 1, type: "curse", rarity: "curse",
  effect: (state) => state });

/** While in hand at turn end: lose 1 block */
const decayCardDefinition = () => createCard({ id: "decay", name: "Decay", cost: 1, type: "curse", rarity: "curse",
  effect: (state) => state });

/** Cost 0, exhaust, lose 3 HP */
const parasiteCardDefinition = () => createCard({ id: "parasite", name: "Parasite", cost: 0, type: "curse", rarity: "curse",
  effect: (state) => ({ ...state, player: { ...state.player, health: Math.max(0, state.player.health - 3) } }) });

/** Canonical reward card pool — the only cards that can appear as rewards. */
const REWARD_POOL = [
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
  spiteShieldCardDefinition,
  warCryCardDefinition,
  fortifyCardDefinition,
  exposeCardDefinition,
  crippleCardDefinition,
  titanStrikeCardDefinition,
  exploitCardDefinition,
  enfeebleCardDefinition,
  echoStrikeCardDefinition,
  pommelCardDefinition,
  braceCardDefinition,
  insightCardDefinition,
  parryCardDefinition,
  heavySwingCardDefinition,
  recoverCardDefinition,
  planAheadCardDefinition,
  deepHexCardDefinition,
  blackSealCardDefinition,
  feastOnWeaknessCardDefinition,
  maledictionCardDefinition,
  ironWillCardDefinition,
  burningAuraCardDefinition,
  hexResonanceCardDefinition,
  // Charged
  staticGuardCardDefinition,
  capacitorCardDefinition,
  releaseCardDefinition,
  guardedPulseCardDefinition,
  flashstepCardDefinition,
  // Exhaust
  overclockCardDefinition,
  ashenBlowCardDefinition,
  finalDraftCardDefinition,
  scorchNervesCardDefinition,
  cinderRushCardDefinition,
  emptyTheChamberCardDefinition,
  // Hex
  curseSpiralCardDefinition,
  cataclysmSigilCardDefinition,
  noMercyCardDefinition,
  hexburstCardDefinition,
  // Hex / Exhaust
  soulRendCardDefinition,
  doomEngineCardDefinition,
  unsealCardDefinition,
  ritualCollapseCardDefinition,
  doomBellCardDefinition,
  // Defense / utility
  hollowWardCardDefinition,
  refrainCardDefinition,
  wardingCircleCardDefinition,
  lastWordCardDefinition
];

module.exports = {
  woundCardDefinition,
  decayCardDefinition,
  parasiteCardDefinition,
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
  spiteShieldCardDefinition,
  warCryCardDefinition,
  fortifyCardDefinition,
  exposeCardDefinition,
  crippleCardDefinition,
  titanStrikeCardDefinition,
  exploitCardDefinition,
  enfeebleCardDefinition,
  echoStrikeCardDefinition,
  pommelCardDefinition,
  braceCardDefinition,
  insightCardDefinition,
  parryCardDefinition,
  heavySwingCardDefinition,
  recoverCardDefinition,
  planAheadCardDefinition,
  deepHexCardDefinition,
  blackSealCardDefinition,
  feastOnWeaknessCardDefinition,
  maledictionCardDefinition,
  ironWillCardDefinition,
  burningAuraCardDefinition,
  hexResonanceCardDefinition,
  // Charged
  staticGuardCardDefinition,
  capacitorCardDefinition,
  releaseCardDefinition,
  guardedPulseCardDefinition,
  flashstepCardDefinition,
  // Exhaust
  overclockCardDefinition,
  ashenBlowCardDefinition,
  finalDraftCardDefinition,
  scorchNervesCardDefinition,
  cinderRushCardDefinition,
  emptyTheChamberCardDefinition,
  // Hex
  curseSpiralCardDefinition,
  cataclysmSigilCardDefinition,
  noMercyCardDefinition,
  hexburstCardDefinition,
  // Hex / Exhaust
  soulRendCardDefinition,
  doomEngineCardDefinition,
  unsealCardDefinition,
  ritualCollapseCardDefinition,
  doomBellCardDefinition,
  // Defense / utility
  hollowWardCardDefinition,
  refrainCardDefinition,
  wardingCircleCardDefinition,
  lastWordCardDefinition,
  REWARD_POOL
};
