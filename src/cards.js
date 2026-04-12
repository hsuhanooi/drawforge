// @ts-check

/** @typedef {import("./domain").CombatState} CombatState */
/** @typedef {import("./domain").Card} Card */
/** @typedef {import("./domain").CardFactory} CardFactory */

const { createCard } = require("./card");
const { createCardCatalog } = require("./cardCatalog");
const { CARD_REGISTRY } = require("./cardRegistry");
const { MAX_HEX_STACKS, MAX_POISON_STACKS, MAX_BURN_STACKS, MAX_EXHAUST_ENERGY_PER_TURN } = require("./constants");

const STRIKE_DAMAGE = 5;
const DEFEND_BLOCK = 5;
const BASH_DAMAGE = 7;
const BARRIER_BLOCK = 10;
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
const CREMATE_BLOCK = 6;
const MARK_OF_RUIN_HEX = 1;
const HEXBLADE_DAMAGE = 7;
const HEXBLADE_HEX = 1;
const REAPERS_CLAUSE_DAMAGE = 10;
const HARVESTER_DAMAGE = 4;
const HARVESTER_BONUS = 4;
const ARC_LASH_DAMAGE = 7;
const BLOOD_PACT_SELF_DAMAGE = 3;
const BLOOD_PACT_ENERGY = 2;
const SPITE_SHIELD_BLOCK = 6;
const SPITE_SHIELD_HEX = 1;

const clone = (value) => JSON.parse(JSON.stringify(value));

const RUNTIME_OVERRIDES = {
  wither: { damage: WITHER_DAMAGE },
  reapers_clause: { damage: REAPERS_CLAUSE_DAMAGE },
  blood_pact: { selfDamage: BLOOD_PACT_SELF_DAMAGE, energyGain: BLOOD_PACT_ENERGY }
};

const CARD_CATALOG = createCardCatalog();

const FACTORY_EXPORT_NAMES = {
  strike: "strikeCardDefinition",
  defend: "defendCardDefinition",
  bash: "bashCardDefinition",
  barrier: "barrierCardDefinition",
  quick_strike: "quickStrikeCardDefinition",
  focus: "focusCardDefinition",
  volley: "volleyCardDefinition",
  surge: "surgeCardDefinition",
  hex: "hexCardDefinition",
  punish: "punishCardDefinition",
  burnout: "burnoutCardDefinition",
  crackdown: "crackdownCardDefinition",
  momentum: "momentumCardDefinition",
  wither: "witherCardDefinition",
  siphon_ward: "siphonWardCardDefinition",
  detonate_sigil: "detonateSigilCardDefinition",
  lingering_curse: "lingeringCurseCardDefinition",
  mark_of_ruin: "markOfRuinCardDefinition",
  hexblade: "hexbladeCardDefinition",
  reapers_clause: "reaperSClauseCardDefinition",
  fire_sale: "fireSaleCardDefinition",
  cremate: "cremateCardDefinition",
  grave_fuel: "graveFuelCardDefinition",
  brand_the_soul: "brandTheSoulCardDefinition",
  harvester: "harvesterCardDefinition",
  charge_up: "chargeUpCardDefinition",
  arc_lash: "arcLashCardDefinition",
  blood_pact: "bloodPactCardDefinition",
  spite_shield: "spiteShieldCardDefinition",
  war_cry: "warCryCardDefinition",
  fortify: "fortifyCardDefinition",
  expose: "exposeCardDefinition",
  cripple: "crippleCardDefinition",
  titan_strike: "titanStrikeCardDefinition",
  exploit: "exploitCardDefinition",
  enfeeble: "enfeebleCardDefinition",
  echo_strike: "echoStrikeCardDefinition",
  pommel: "pommelCardDefinition",
  brace: "braceCardDefinition",
  insight: "insightCardDefinition",
  parry: "parryCardDefinition",
  heavy_swing: "heavySwingCardDefinition",
  recover: "recoverCardDefinition",
  plan_ahead: "planAheadCardDefinition",
  deep_hex: "deepHexCardDefinition",
  black_seal: "blackSealCardDefinition",
  feast_on_weakness: "feastOnWeaknessCardDefinition",
  malediction: "maledictionCardDefinition",
  venom_strike: "venomStrikeCardDefinition",
  toxic_cloud: "toxicCloudCardDefinition",
  creeping_blight: "creepingBlightCardDefinition",
  septic_touch: "septicTouchCardDefinition",
  infectious_wound: "infectiousWoundCardDefinition",
  plague_burst: "plagueBurstCardDefinition",
  toxic_barrage: "toxicBarrageCardDefinition",
  virulent_aura: "virulentAuraCardDefinition",
  contagion: "contagionCardDefinition",
  fetid_wound: "fetidWoundCardDefinition",
  noxious_presence: "noxiousPresenceCardDefinition",
  immolate: "immolateCardDefinition",
  backdraft: "backdraftCardDefinition",
  inferno_aura: "infernoAuraCardDefinition",
  heat_shield: "heatShieldCardDefinition",
  flash_fire: "flashFireCardDefinition",
  ember_throw: "emberThrowCardDefinition",
  kindle: "kindleCardDefinition",
  scorch: "scorchCardDefinition",
  funeral_pyre: "funeralPyreCardDefinition",
  smoldering_brand: "smolderingBrandCardDefinition",
  iron_will: "ironWillCardDefinition",
  burning_aura: "burningAuraCardDefinition",
  hex_resonance: "hexResonanceCardDefinition",
  static_guard: "staticGuardCardDefinition",
  capacitor: "capacitorCardDefinition",
  release: "releaseCardDefinition",
  guarded_pulse: "guardedPulseCardDefinition",
  flashstep: "flashstepCardDefinition",
  volt_barrage: "voltBarrageCardDefinition",
  charged_field: "chargedFieldCardDefinition",
  overclock: "overclockCardDefinition",
  ashen_blow: "ashenBlowCardDefinition",
  final_draft: "finalDraftCardDefinition",
  scorch_nerves: "scorchNervesCardDefinition",
  cinder_rush: "cinderRushCardDefinition",
  empty_the_chamber: "emptyTheChamberCardDefinition",
  curse_spiral: "curseSpiralCardDefinition",
  cataclysm_sigil: "cataclysmSigilCardDefinition",
  no_mercy: "noMercyCardDefinition",
  hexburst: "hexburstCardDefinition",
  soul_rend: "soulRendCardDefinition",
  doom_engine: "doomEngineCardDefinition",
  unseal: "unsealCardDefinition",
  ritual_collapse: "ritualCollapseCardDefinition",
  doom_bell: "doomBellCardDefinition",
  hollow_ward: "hollowWardCardDefinition",
  refrain: "refrainCardDefinition",
  warding_circle: "wardingCircleCardDefinition",
  last_word: "lastWordCardDefinition",
  flurry_of_blows: "flurryOfBlowsCardDefinition",
  wound: "woundCardDefinition",
  decay: "decayCardDefinition",
  parasite: "parasiteCardDefinition",
  caustic_inferno: "causticInfernoCardDefinition",
  volatile_compound: "volatileCompoundCardDefinition",
  charged_toxin: "chargedToxinCardDefinition",
  hex_blight: "hexBlightCardDefinition",
  shocking_brand: "shockingBrandCardDefinition",
  whirlwind: "whirlwindCardDefinition",
  chain_lightning: "chainLightningCardDefinition",
  plague_wave: "plagueWaveCardDefinition",
  calculated_risk: "calculatedRiskCardDefinition",
  compress: "compressCardDefinition",
  momentum_card: "momentumCardCardDefinition",
  bulwark: "bulwarkCardDefinition",
  desperation: "desperationCardDefinition"
};

const computeDamage = (card, state, next) => {
  const enemyHex = next.enemy?.hex || 0;
  const playerStrength = next.player?.strength || 0;
  const enemyVulnerable = next.enemy?.vulnerable || 0;
  const exhaustedThisTurn = state.exhaustedThisTurn || 0;
  const exhaustPileCount = (state.exhaustPile || []).length;
  let damage = card.damage || 0;

  if (card.bonusVsHex && enemyHex > 0) damage += card.bonusVsHex;
  if (card.bonusVsExhaust && exhaustPileCount > 0) damage += card.bonusVsExhaust;
  if (card.bonusVsHexedOrExhausted && enemyHex > 0) damage += card.bonusVsHexedOrExhausted;
  if (card.bonusVsHexedOrExhausted && exhaustedThisTurn > 0) damage += card.bonusVsHexedOrExhausted;
  if (card.bonusPerStrength) damage += playerStrength * card.bonusPerStrength;
  if (card.bonusVsVulnerable && enemyVulnerable > 0) damage += card.bonusVsVulnerable;
  if (card.bonusDmgPerHex) damage += enemyHex * card.bonusDmgPerHex;
  if (card.bonusDmgPerPoison) damage += (next.enemy?.poison || 0) * card.bonusDmgPerPoison;
  if (card.bonusDmgPerBurn) damage += (next.enemy?.burn || 0) * card.bonusDmgPerBurn;
  if (card.bonusDmgPerExhausted) damage += exhaustedThisTurn * card.bonusDmgPerExhausted;
  if (card.bonusIfLastCard && (state.hand || []).length <= 1) damage += card.bonusIfLastCard;
  if (card.consumeHexBonus && enemyHex > 0) {
    damage += enemyHex * card.consumeHexBonus;
    next.enemy.hex = 0;
  }
  if (card.consumePoisonBonus && (next.enemy?.poison || 0) > 0) {
    damage += (next.enemy.poison || 0) * card.consumePoisonBonus;
    next.enemy.poison = 0;
  }
  if (card.consumeBurnBonus && (next.enemy?.burn || 0) > 0) {
    damage += (next.enemy.burn || 0) * card.consumeBurnBonus;
    next.enemy.burn = 0;
  }
  if (card.bonusVsPoisonAndBurn && (next.enemy?.poison || 0) > 0 && (next.enemy?.burn || 0) > 0) {
    damage += card.bonusVsPoisonAndBurn;
  }
  if (card.type === "attack") damage += playerStrength;
  if ((next.player?.weak || 0) > 0 && card.type === "attack") damage = Math.floor(damage * 0.75);
  if ((next.enemy?.vulnerable || 0) > 0 && damage > 0) damage = Math.floor(damage * 1.5);

  return damage;
};

const applyDamage = (next, amount) => {
  if (!amount) return;
  const blocked = Math.min(next.enemy?.block || 0, amount);
  next.enemy.block = (next.enemy?.block || 0) - blocked;
  next.enemy.health -= amount - blocked;
};

const buildRuntimeEffect = (card) => {
  if (Array.isArray(card.effects) && card.effects.length > 0) {
    return undefined;
  }

  return (state) => {
    const next = {
      ...state,
      player: { ...(state.player || {}) },
      enemy: { ...(state.enemy || {}) }
    };

    const hitCount = card.hitCountIfCharged && next.player?.charged
      ? card.hitCountIfCharged
      : (card.hitCount || 1);
    const damage = computeDamage(card, state, next);
    for (let hit = 0; hit < hitCount; hit += 1) {
      applyDamage(next, damage);
      if (card.applyPoisonPerHit) {
        next.enemy.poison = Math.min(MAX_POISON_STACKS, (next.enemy.poison || 0) + card.applyPoisonPerHit);
      }
    }
    if (card.repeatIfHexed && ((state.enemy?.hex || 0) > 0)) {
      applyDamage(next, damage);
    }

    const playerEnergyBeforeEffect = state.player?.energy ?? 0;
    const playerDexterity = next.player?.dexterity || 0;
    if (card.block) next.player.block = (next.player.block || 0) + card.block + playerDexterity;
    if (card.bonusBlockIfHighEnergy && playerEnergyBeforeEffect >= 2) {
      next.player.block = (next.player.block || 0) + card.bonusBlockIfHighEnergy;
    }
    if (card.bonusBlockIfHexed && (next.enemy?.hex || 0) > 0) {
      next.player.block = (next.player.block || 0) + card.bonusBlockIfHexed;
    }
    if (card.bonusBlockIfCharged && next.player?.charged) {
      next.player.block = (next.player.block || 0) + card.bonusBlockIfCharged;
    }
    if (card.blockPerBurn) {
      next.player.block = (next.player.block || 0) + ((next.enemy?.burn || 0) * card.blockPerBurn);
    }

    if (card.draw) next.drawCount = (next.drawCount || 0) + card.draw;
    if (card.drawIfCharged && next.player?.charged) next.drawCount = (next.drawCount || 0) + card.drawIfCharged;

    if (card.energyGain) next.player.energy = (next.player.energy || 0) + card.energyGain;
    if (card.energyIfCharged && next.player?.charged) next.player.energy = (next.player.energy || 0) + card.energyIfCharged;
    if (card.energyPerExhausted) next.player.energy = (next.player.energy || 0) + Math.min(state.exhaustedThisTurn || 0, MAX_EXHAUST_ENERGY_PER_TURN);
    if (card.ifHexedEnergyGain && (next.enemy?.hex || 0) > 0) next.player.energy = (next.player.energy || 0) + card.ifHexedEnergyGain;

    if (card.hex) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + card.hex);
    if (card.applyPoison) next.enemy.poison = Math.min(MAX_POISON_STACKS, (next.enemy.poison || 0) + card.applyPoison);
    if (card.applyBurn) next.enemy.burn = Math.min(MAX_BURN_STACKS, (next.enemy.burn || 0) + card.applyBurn);
    if (card.applyWeak) next.enemy.weak = (next.enemy.weak || 0) + card.applyWeak;
    if (card.applyVulnerable) next.enemy.vulnerable = (next.enemy.vulnerable || 0) + card.applyVulnerable;
    if (card.doublePoison) next.enemy.poison = Math.min(MAX_POISON_STACKS, (next.enemy.poison || 0) * 2);
    if (card.applyStrength) next.player.strength = (next.player.strength || 0) + card.applyStrength;
    if (card.applyDexterity) next.player.dexterity = (next.player.dexterity || 0) + card.applyDexterity;

    if (card.setCharged) next.player.charged = true;
    if (card.setChargedIfNotCharged && !next.player?.charged) next.player.charged = true;
    if (card.loseCharged) next.player.charged = false;

    if (card.selfDamage) next.player.health = Math.max(0, next.player.health - card.selfDamage);

    if (card.exhaustFromHand || card.exhaustHand || card.exhaustSkillsFromHand || card.exhaustFromHandCount) {
      next.exhaustFromHand = true;
    }
    if (card.hexPerExhausted) {
      const exhausted = card.exhaustFromHandCount || 0;
      next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + exhausted);
    }
    if (card.ifHexedExhaustFromHand && (next.enemy?.hex || 0) > 0) {
      next.exhaustFromHand = true;
    }

    return next;
  };
};

const createDefinitionFromId = (cardId) => {
  const catalogCard = CARD_CATALOG[cardId];
  if (!catalogCard) {
    throw new Error(`Unknown card id: ${cardId}`);
  }

  const runtimeCard = {
    ...clone(catalogCard),
    ...(RUNTIME_OVERRIDES[cardId] || {})
  };

  return createCard({
    ...runtimeCard,
    effect: buildRuntimeEffect(runtimeCard)
  });
};

/** @type {Record<string, CardFactory>} */
const CARD_FACTORIES = Object.fromEntries(
  Object.keys(FACTORY_EXPORT_NAMES).map((cardId) => [cardId, () => createDefinitionFromId(cardId)])
);

const rewardCardIds = CARD_REGISTRY
  .filter((card) => !card.starter && card.type !== "curse")
  .map((card) => card.id);

const REWARD_POOL = rewardCardIds
  .filter((cardId) => typeof CARD_FACTORIES[cardId] === "function")
  .map((cardId) => CARD_FACTORIES[cardId]);

const moduleExports = {
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
  REWARD_POOL
};

for (const [cardId, exportName] of Object.entries(FACTORY_EXPORT_NAMES)) {
  moduleExports[exportName] = CARD_FACTORIES[cardId];
}

module.exports = moduleExports;
