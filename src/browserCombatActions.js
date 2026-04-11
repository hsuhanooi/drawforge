const { createEnemyForNode, resolveEnemyIntent } = require("./enemies");
const { createCardCatalog } = require("./cardCatalog");
const { getCombatEnergyBonus } = require("./relics");
const { applyPotion } = require("./potions");
const { DEFAULT_PLAYER_ENERGY, MAX_POISON_STACKS, MAX_BURN_STACKS, MAX_HEX_STACKS, MAX_EXHAUST_ENERGY_PER_TURN, MAX_POWERS } = require("./constants");
const CARD_CATALOG = createCardCatalog();

const clone = (value) => JSON.parse(JSON.stringify(value));
const COMBAT_LOG_LIMIT = 8;

const clampStacks = (value, max) => Math.max(0, Math.min(max, value || 0));

const normalizeStatusStacks = (combat) => {
  if (!combat) return combat;
  const tIdx = combat.targetIndex || 0;
  // combat.enemy is always the source of truth for the targeted enemy
  const normalizedEnemy = combat.enemy ? {
    ...(combat.enemy),
    poison: clampStacks(combat.enemy.poison, MAX_POISON_STACKS),
    burn: clampStacks(combat.enemy.burn, MAX_BURN_STACKS)
  } : {};
  // Normalize all enemies; keep enemies[tIdx] in sync with the enemy alias
  const enemiesRaw = combat.enemies || [normalizedEnemy];
  const normalizedEnemies = enemiesRaw.map((e, i) => {
    if (i === tIdx) return normalizedEnemy;
    return {
      ...(e || {}),
      poison: clampStacks(e?.poison, MAX_POISON_STACKS),
      burn: clampStacks(e?.burn, MAX_BURN_STACKS)
    };
  });
  return {
    ...combat,
    player: {
      ...(combat.player || {}),
      poison: clampStacks(combat.player?.poison, MAX_POISON_STACKS),
      burn: clampStacks(combat.player?.burn, MAX_BURN_STACKS)
    },
    enemies: normalizedEnemies,
    enemy: normalizedEnemy
  };
};

const applyDotDamage = (target, amount) => {
  if (!amount) return 0;
  const blocked = Math.min(target.block || 0, amount);
  target.block = (target.block || 0) - blocked;
  const damage = amount - blocked;
  target.health = Math.max(0, target.health - damage);
  return damage;
};

const applyStatusTicks = (combat, targetKey, phase = "end") => {
  const next = clone(combat);
  const target = next[targetKey];
  if (!target) return next;

  const logTone = targetKey === "enemy" ? "status" : "enemy";
  const label = targetKey === "enemy" ? (next.enemy?.name || "Enemy") : "You";

  if (phase === "end" && (target.poison || 0) > 0) {
    const poisonStacks = clampStacks(target.poison, MAX_POISON_STACKS);
    const poisonDamage = applyDotDamage(target, poisonStacks);
    target.poison = Math.max(0, poisonStacks - 1);
    if (poisonDamage > 0) {
      return appendCombatLog(next, `${label} suffers ${poisonDamage} poison damage.`, logTone);
    }
  }

  if (phase === "start" && (target.burn || 0) > 0) {
    const burnStacks = clampStacks(target.burn, MAX_BURN_STACKS);
    const burnDamage = applyDotDamage(target, burnStacks);
    target.burn = burnStacks;
    if (burnDamage > 0) {
      return appendCombatLog(next, `${label} burns for ${burnDamage} damage.`, logTone);
    }
  }

  return next;
};

const appendCombatLog = (combat, text, tone = "system") => ({
  ...combat,
  combatLog: [...(combat.combatLog || []), { text, tone }].slice(-COMBAT_LOG_LIMIT)
});

const shuffleCards = (cards) => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const drawCards = (combat, count) => {
  const next = clone(combat);
  next.reshuffled = false;
  for (let i = 0; i < count; i += 1) {
    if (next.drawPile.length === 0 && next.discardPile.length > 0) {
      next.drawPile = [...next.discardPile];
      next.discardPile = [];
      next.reshuffled = true;
    }
    if (next.drawPile.length === 0) break;
    const drawn = next.drawPile.shift();
    next.hand.push(drawn);
    // Wound: deal 1 self-damage when drawn
    if (drawn.id === "wound") {
      next.player.health = Math.max(0, next.player.health - 1);
    }
  }
  return next;
};

const hasRelic = (run, id) => (run.relics || []).some((r) => r.id === id);
const createRenderableCardFromId = (cardId) => {
  const card = CARD_CATALOG[cardId];
  if (!card) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return clone(card);
};

const checkPhaseShift = (combat) => {
  const e = combat.enemy;
  const thresholds = Array.isArray(e.phaseThresholds) && e.phaseThresholds.length > 0
    ? e.phaseThresholds
    : e.phaseThreshold != null
      ? [e.phaseThreshold]
      : [];
  const currentPhase = e.phase || 1;

  if (!thresholds.length || currentPhase > thresholds.length || e.health > thresholds[currentPhase - 1]) return combat;

  const next = clone(combat);
  const nextPhase = currentPhase + 1;
  const phaseIntents = next.enemy.phaseIntents?.[nextPhase - 1];

  next.enemy.phase = nextPhase;
  next.enemy.intents = phaseIntents || next.enemy[`phase${nextPhase}Intents`] || next.enemy.intents;
  next.enemy.strength = (next.enemy.strength || 0) + (next.enemy[`phase${nextPhase}Strength`] || 0);
  next.enemyTurnNumber = 0;
  next.enemyIntent = resolveEnemyIntent(next.enemy, 0);
  next.phaseTransition = true;
  next.phaseTransitionLabel = `PHASE ${nextPhase}`;
  return next;
};

const startCombatForNode = (run, node) => {
  const enemy = { ...createEnemyForNode(node, run.act || 1, run.ascensionLevel || 0, run.seed) };
  enemy.maxHp = enemy.health;
  const energyBonus = getCombatEnergyBonus(run, node.type);
  const ashenBonus = hasRelic(run, "ashen_idol") ? 1 : 0;
  let drawCount = hasRelic(run, "quickened_loop") ? 6 : 5;
  if (hasRelic(run, "empty_throne")) drawCount += 2;
  if (hasRelic(run, "infernal_battery")) drawCount -= 1;
  const startingBlock = hasRelic(run, "rusted_buckler") ? 4 : 0;
  const combatState = appendCombatLog(drawCards({
    state: "active",
    turn: "player",
    nodeType: node.type,
    enemyTurnNumber: 0,
    enemyIntent: resolveEnemyIntent(enemy, 0),
    firstTurn: true,
    grimoire_used: false,
    coal_pendant_used: false,
    sigil_fired: false,
    seal_used_this_turn: false,
    flicker_used: false,
    duelist_used_this_turn: false,
    grave_wick_used: false,
    mirror_used: false,
    black_prism_fired: false,
    hex_lantern_used: false,
    exhaustTotal: 0,
    doom_engine_active: false,
    returnPile: [],
    player: {
      health: run.player.health,
      block: startingBlock,
      energy: DEFAULT_PLAYER_ENERGY + energyBonus + ashenBonus,
      charged: hasRelic(run, "storm_diadem"),
      strength: hasRelic(run, "iron_boots") ? 1 : 0,
      dexterity: hasRelic(run, "nimble_cloak") ? 1 : 0,
      weak: 0,
      poison: 0,
      burn: 0
    },
    hand: [],
    drawPile: shuffleCards(run.player.deck.map(createRenderableCardFromId)),
    discardPile: [],
    exhaustPile: [],
    combatLog: [],
    powers: [],
    exhaustedThisTurn: 0,
    enemiesKilledThisCombat: 0,
    enemies: [{
      ...enemy,
      vulnerable: hasRelic(run, "cracked_lens") ? 1 : 0,
      hex: hasRelic(run, "hex_crown") ? 1 : 0,
      poison: run.carryoverPoison || 0,
      burn: 0,
      turnIndex: 0
    }],
    targetIndex: 0,
    enemy: {
      ...enemy,
      vulnerable: hasRelic(run, "cracked_lens") ? 1 : 0,
      hex: hasRelic(run, "hex_crown") ? 1 : 0,
      poison: run.carryoverPoison || 0,
      burn: 0,
      turnIndex: 0
    }
  }, drawCount), `Combat started against ${enemy.name}.`, "system");
  return normalizeStatusStacks(combatState);
};

const playCombatCard = (run, handIndex) => {
  const combat = run.combat;
  const card = combat.hand[handIndex];
  if (!card) throw new Error("Card not found in hand");
  if (combat.turn !== "player") throw new Error("It is not the player's turn");

  let effectiveCost = card.costReduceIfHexed && (combat.enemy.hex || 0) > 0
    ? Math.max(0, card.cost - card.costReduceIfHexed)
    : card.cost;
  if (card.costReduceIfCharged && combat.player.charged) {
    effectiveCost = Math.max(0, effectiveCost - card.costReduceIfCharged);
  }
  if (hasRelic(run, "time_locked_seal") && !combat.seal_used_this_turn && effectiveCost <= 1) {
    effectiveCost = 0;
  }
  if (hasRelic(run, "silencing_stone") && !combat.silencing_stone_used && (combat.enemy.weak || 0) > 0) {
    effectiveCost = 0;
  }
  if (hasRelic(run, "grave_wick") && !combat.grave_wick_used && card.exhaust) {
    effectiveCost = 0;
  }
  if (combat.player.energy < effectiveCost) throw new Error("Not enough energy");

  let next = normalizeStatusStacks(clone(combat));
  let nextPhoenixUsed = run.phoenix_used || false;
  next.triggeredRelics = [];
  if (hasRelic(run, "time_locked_seal") && !next.seal_used_this_turn && card.cost <= 1) {
    next.seal_used_this_turn = true;
  }
  if (hasRelic(run, "silencing_stone") && !next.silencing_stone_used && (next.enemy.weak || 0) > 0) {
    next.silencing_stone_used = true;
  }
  if (hasRelic(run, "grave_wick") && !next.grave_wick_used && card.exhaust) {
    next.grave_wick_used = true;
    next.triggeredRelics.push("grave_wick");
  }

  next.player.energy -= effectiveCost;
  next.hand.splice(handIndex, 1);
  const enemyHpBefore = next.enemy.health;

  // Route card to destination first so draw effects can reshuffle from discard
  if (card.exhaust) {
    next.exhaustPile = [...(next.exhaustPile || []), card];
    next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
    next.exhaustTotal = (next.exhaustTotal || 0) + 1;
    if (next.doom_engine_active) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + 1);
    if (hasRelic(run, "coal_pendant") && !next.coal_pendant_used) {
      next = drawCards(next, 1);
      next.coal_pendant_used = true;
      next.triggeredRelics.push("coal_pendant");
    }
    if (hasRelic(run, "cinder_box")) {
      next.player.block += 2;
      next.triggeredRelics.push("cinder_box");
    }
    if (hasRelic(run, "crematorium_bell") && next.exhaustTotal <= 2) {
      next.player.energy += 1;
      next.triggeredRelics.push("crematorium_bell");
    }
    if (hasRelic(run, "black_prism") && !next.black_prism_fired && next.exhaustTotal >= 3) {
      next.player.energy += 1;
      next.black_prism_fired = true;
      next.triggeredRelics.push("black_prism");
    }
  } else if (card.returnToHand) {
    next.returnPile = [...(next.returnPile || []), card];
  } else if (card.type === "power") {
    if ((next.powers || []).length >= MAX_POWERS) {
      // Power slots full — exhaust the card instead
      next.exhaustPile = [...(next.exhaustPile || []), card];
      next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
      next.exhaustTotal = (next.exhaustTotal || 0) + 1;
      next = appendCombatLog(next, `Power slots full — ${card.name} exhausted.`, "system");
    } else {
      next.powers = [...(next.powers || []), { id: card.id, label: card.name, ...card }];
    }
  } else {
    next.discardPile = [...(next.discardPile || []), card];
  }

  if (card.damage || card.bonusVsHex || card.bonusVsExhaust || card.bonusVsHexedOrExhausted || card.bonusVsVulnerable || card.bonusPerStrength || card.bonusDmgPerHex || card.bonusDmgPerExhausted || card.bonusIfLastCard || card.consumeHexBonus || card.consumePoisonBonus || card.consumeBurnBonus || card.bonusVsPoisonAndBurn || card.hitCount || card.hitCountIfCharged || card.repeatIfHexed || (card.type === "attack" && (next.player.strength || 0) > 0)) {
    const hexBonus = (next.enemy.hex || 0) > 0 && card.bonusVsHex ? card.bonusVsHex : 0;
    const exhaustBonus = (next.exhaustPile || []).length > 0 && card.bonusVsExhaust ? card.bonusVsExhaust : 0;
    const harvesterHexBonus = (next.enemy.hex || 0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
    const harvesterExhaustBonus = (next.exhaustedThisTurn || 0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
    const hexNailBonus = hasRelic(run, "hex_nail") && card.type === "attack" && (next.enemy.hex || 0) > 0 ? 2 : 0;
    const vulnerableBonus = (next.enemy.vulnerable || 0) > 0 && card.bonusVsVulnerable ? card.bonusVsVulnerable : 0;
    const flickerBonus = hasRelic(run, "flicker_charm") && !next.flicker_used && card.type === "attack" ? 3 : 0;
    const duelistBonus = hasRelic(run, "duelists_thread") && !next.duelist_used_this_turn && card.type === "attack" ? 2 : 0;
    const furnaceBonus = hasRelic(run, "furnace_heart") && card.exhaust && card.type === "attack" ? 4 : 0;
    // Strength adds to all attack damage; bonusPerStrength adds extra scaling for specific cards
    const strengthFlat = card.type === "attack" ? (next.player.strength || 0) : 0;
    const strengthScaling = (next.player.strength || 0) * (card.bonusPerStrength || 0);
    // New scaling bonuses (Milestone 10)
    const hexPerStackBonus = card.bonusDmgPerHex ? (next.enemy.hex || 0) * card.bonusDmgPerHex : 0;
    const poisonStackBonus = card.bonusDmgPerPoison ? (next.enemy.poison || 0) * card.bonusDmgPerPoison : 0;
    const burnStackBonus = card.bonusDmgPerBurn ? (next.enemy.burn || 0) * card.bonusDmgPerBurn : 0;
    const exhaustedStackBonus = card.bonusDmgPerExhausted ? (next.exhaustedThisTurn || 0) * card.bonusDmgPerExhausted : 0;
    const lastCardBonus = card.bonusIfLastCard && next.hand.length === 0 ? card.bonusIfLastCard : 0;
    // consume bonuses: consume all status stacks, deal bonus per stack consumed
    const hexStacks = next.enemy.hex || 0;
    const poisonStacks = next.enemy.poison || 0;
    const burnStacks = next.enemy.burn || 0;
    const hexConsumedBonus = card.consumeHexBonus ? hexStacks * card.consumeHexBonus : 0;
    const poisonConsumedBonus = card.consumePoisonBonus ? poisonStacks * card.consumePoisonBonus : 0;
    const burnConsumedBonus = card.consumeBurnBonus ? burnStacks * card.consumeBurnBonus : 0;
    if (card.consumeHexBonus) next.enemy.hex = 0;
    if (card.consumePoisonBonus) next.enemy.poison = 0;
    if (card.consumeBurnBonus) next.enemy.burn = 0;
    // Cross-archetype bonus: deals extra damage when enemy has BOTH poison and burn
    const poisonAndBurnBonus = card.bonusVsPoisonAndBurn && poisonStacks > 0 && burnStacks > 0 ? card.bonusVsPoisonAndBurn : 0;
    let totalDamage = (card.damage || 0) + hexBonus + exhaustBonus + harvesterHexBonus + harvesterExhaustBonus + hexNailBonus + vulnerableBonus + flickerBonus + duelistBonus + furnaceBonus + strengthFlat + strengthScaling + hexPerStackBonus + poisonStackBonus + burnStackBonus + exhaustedStackBonus + lastCardBonus + hexConsumedBonus + poisonConsumedBonus + burnConsumedBonus + poisonAndBurnBonus;
    // Weak on player reduces outgoing attack damage by 25%
    if (card.type === "attack" && (next.player.weak || 0) > 0) totalDamage = Math.floor(totalDamage * 0.75);
    // Vulnerable on enemy amplifies incoming damage by 50%
    if ((next.enemy.vulnerable || 0) > 0) totalDamage = Math.floor(totalDamage * 1.5);
    const hitCount = card.hitCountIfCharged && next.player.charged
      ? card.hitCountIfCharged
      : (card.hitCount || 1);
    let remainingDamage = 0;
    for (let hit = 0; hit < hitCount; hit += 1) {
      const blocked = Math.min(next.enemy.block || 0, totalDamage);
      const hitDamage = totalDamage - blocked;
      next.enemy.block = (next.enemy.block || 0) - blocked;
      next.enemy.health -= hitDamage;
      remainingDamage += hitDamage;
      if (card.applyPoisonPerHit) {
        next.enemy.poison = clampStacks((next.enemy.poison || 0) + card.applyPoisonPerHit, MAX_POISON_STACKS);
      }
    }
    if (flickerBonus > 0) { next.flicker_used = true; next.triggeredRelics.push("flicker_charm"); }
    if (duelistBonus > 0) { next.duelist_used_this_turn = true; next.triggeredRelics.push("duelists_thread"); }
    if (hasRelic(run, "hex_lantern") && !next.hex_lantern_used && remainingDamage > 0) {
      next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + 1);
      next.hex_lantern_used = true;
      next.triggeredRelics.push("hex_lantern");
    }
    const vampiricAura = (next.powers || []).find((p) => p.healOnAttack);
    if (remainingDamage > 0 && vampiricAura) {
      const maxHealth = run.player.maxHealth || run.player.health;
      next.player.health = Math.min(next.player.health + (vampiricAura.healOnAttack || 2), maxHealth);
    }
    const noxiousPresence = (next.powers || []).find((p) => p.poisonOnAttack);
    if (card.type === "attack" && noxiousPresence) {
      next.enemy.poison = clampStacks((next.enemy.poison || 0) + (noxiousPresence.poisonOnAttack || 1), MAX_POISON_STACKS);
    }
    // repeatIfHexed: deal damage a second time if enemy had hex (no_mercy)
    if (card.repeatIfHexed && hexStacks > 0) {
      const blocked2 = Math.min(next.enemy.block || 0, totalDamage);
      next.enemy.block = (next.enemy.block || 0) - blocked2;
      next.enemy.health -= (totalDamage - blocked2);
    }
  }
  if (card.block || card.bonusBlockIfHexed || card.bonusBlockIfCharged || card.blockPerBurn) {
    // Dexterity adds to all block-generating card plays
    const dexBonus = (card.block || card.bonusBlockIfCharged || card.blockPerBurn) ? (next.player.dexterity || 0) : 0;
    next.player.block += (card.block || 0) + dexBonus + (((next.player.energy ?? 0) >= 2 && card.bonusBlockIfHighEnergy) ? card.bonusBlockIfHighEnergy : 0);
    if (card.bonusBlockIfHexed && (next.enemy.hex || 0) > 0) {
      next.player.block += card.bonusBlockIfHexed;
    }
    if (card.bonusBlockIfCharged && next.player.charged) {
      next.player.block += card.bonusBlockIfCharged;
    }
    if (card.blockPerBurn) {
      next.player.block += (next.enemy.burn || 0) * card.blockPerBurn;
    }
  }
  if (card.energyGain) next.player.energy += card.energyGain;
  if (card.energyPerExhausted) next.player.energy += Math.min(next.exhaustedThisTurn || 0, MAX_EXHAUST_ENERGY_PER_TURN);
  if (card.selfDamage) next.player.health = Math.max(0, next.player.health - card.selfDamage);
  if (card.hex) {
    const hexAmount = card.hex + (hasRelic(run, "worn_grimoire") && !next.grimoire_used ? 1 : 0);
    if (hasRelic(run, "worn_grimoire") && !next.grimoire_used && card.hex > 0) {
      next.grimoire_used = true;
    }
    next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + hexAmount);
    if (hasRelic(run, "sigil_engine") && !next.sigil_fired && (next.enemy.hex || 0) >= 3) {
      const sigBlocked = Math.min(next.enemy.block || 0, 8);
      next.enemy.block = (next.enemy.block || 0) - sigBlocked;
      next.enemy.health -= (8 - sigBlocked);
      next.sigil_fired = true;
    }
  }
  if (card.applyPoison) next.enemy.poison = clampStacks((next.enemy.poison || 0) + card.applyPoison, MAX_POISON_STACKS);
  if (card.applyPoisonIfCharged && next.player.charged) next.enemy.poison = clampStacks((next.enemy.poison || 0) + card.applyPoisonIfCharged, MAX_POISON_STACKS);
  if (card.poisonPerHex) {
    // Apply poison equal to current hex stacks, minimum 1
    const hexForPoison = Math.max(1, next.enemy.hex || 0);
    next.enemy.poison = clampStacks((next.enemy.poison || 0) + hexForPoison, MAX_POISON_STACKS);
  }
  if (card.doublePoison) next.enemy.poison = clampStacks((next.enemy.poison || 0) * 2, MAX_POISON_STACKS);
  if (card.applyBurn) next.enemy.burn = clampStacks((next.enemy.burn || 0) + card.applyBurn, MAX_BURN_STACKS);
  if (card.applyStrength) {
    const bonus = hasRelic(run, "warlords_brand") ? card.applyStrength + 1 : card.applyStrength;
    next.player.strength = (next.player.strength || 0) + bonus;
  }
  if (card.applyDexterity) next.player.dexterity = (next.player.dexterity || 0) + card.applyDexterity;
  if (card.applyVulnerable) next.enemy.vulnerable = (next.enemy.vulnerable || 0) + card.applyVulnerable;
  if (card.applyWeak) next.enemy.weak = (next.enemy.weak || 0) + card.applyWeak;
  if (card.setCharged) {
    next.player.charged = true;
    if (hasRelic(run, "volt_shard")) {
      next.player.block += 1;
      next = drawCards(next, 1);
    }
    if (hasRelic(run, "storm_vessel") && !next.firstTurn) {
      next.player.energy += 1;
    }
  }
  if (card.draw) next = drawCards(next, card.draw);
  if (card.drawIfCharged && next.player.charged) next = drawCards(next, card.drawIfCharged);
  if (card.setChargedIfNotCharged && !next.player.charged) {
    next.player.charged = true;
    if (hasRelic(run, "volt_shard")) {
      next.player.block += 1;
      next = drawCards(next, 1);
    }
    if (hasRelic(run, "storm_vessel") && !next.firstTurn) next.player.energy += 1;
  }
  if (card.energyIfCharged && next.player.charged) next.player.energy += card.energyIfCharged;
  if (card.loseCharged) next.player.charged = false;
  if (card.energyIfExhaustedThisTurn && (next.exhaustedThisTurn || 0) > 0) {
    next.player.energy += card.energyIfExhaustedThisTurn;
  }
  if (card.activateDoomEngine) next.doom_engine_active = true;

  if (card.discardFromHand && next.hand.length > 0) {
    const rIdx = Math.floor(Math.random() * next.hand.length);
    const discarded = next.hand.splice(rIdx, 1)[0];
    next.discardPile = [...(next.discardPile || []), discarded];
  }

  if (card.exhaustFromHand && next.hand.length > 0) {
    const randomIndex = Math.floor(Math.random() * next.hand.length);
    const exhausted = next.hand.splice(randomIndex, 1)[0];
    next.exhaustPile = [...(next.exhaustPile || []), exhausted];
    next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
    next.exhaustTotal = (next.exhaustTotal || 0) + 1;
    if (next.doom_engine_active) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + 1);
    if (hasRelic(run, "coal_pendant") && !next.coal_pendant_used) {
      next = drawCards(next, 1);
      next.coal_pendant_used = true;
    }
    if (hasRelic(run, "cinder_box")) {
      next.player.block += 2;
    }
    if (hasRelic(run, "crematorium_bell") && next.exhaustTotal <= 2) {
      next.player.energy += 1;
    }
    if (hasRelic(run, "black_prism") && !next.black_prism_fired && next.exhaustTotal >= 3) {
      next.player.energy += 1;
      next.black_prism_fired = true;
    }
  }

  if (card.exhaustHand && next.hand.length > 0) {
    const handCards = [...next.hand];
    next.hand = [];
    for (const c of handCards) {
      next.exhaustPile = [...(next.exhaustPile || []), c];
      next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
      next.exhaustTotal = (next.exhaustTotal || 0) + 1;
      next.player.energy += 1; // 1 energy per card (empty_the_chamber)
      if (next.doom_engine_active) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + 1);
      if (hasRelic(run, "cinder_box")) next.player.block += 2;
      if (hasRelic(run, "crematorium_bell") && next.exhaustTotal <= 2) next.player.energy += 1;
      if (hasRelic(run, "black_prism") && !next.black_prism_fired && next.exhaustTotal >= 3) {
        next.player.energy += 1;
        next.black_prism_fired = true;
      }
    }
  }

  if (card.exhaustFromHandCount && next.hand.length > 0) {
    const count = Math.min(card.exhaustFromHandCount, next.hand.length);
    let hexFromExhaust = 0;
    for (let i = 0; i < count; i += 1) {
      const rIdx = Math.floor(Math.random() * next.hand.length);
      const exhausted = next.hand.splice(rIdx, 1)[0];
      next.exhaustPile = [...(next.exhaustPile || []), exhausted];
      next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
      next.exhaustTotal = (next.exhaustTotal || 0) + 1;
      hexFromExhaust += 1;
      if (next.doom_engine_active) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + 1);
      if (hasRelic(run, "coal_pendant") && !next.coal_pendant_used) {
        next = drawCards(next, 1);
        next.coal_pendant_used = true;
      }
      if (hasRelic(run, "cinder_box")) next.player.block += 2;
      if (hasRelic(run, "crematorium_bell") && next.exhaustTotal <= 2) next.player.energy += 1;
      if (hasRelic(run, "black_prism") && !next.black_prism_fired && next.exhaustTotal >= 3) {
        next.player.energy += 1;
        next.black_prism_fired = true;
      }
    }
    if (card.hexPerExhausted) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + hexFromExhaust);
  }

  if (card.exhaustSkillsFromHand) {
    const skills = next.hand.filter((c) => c.type === "skill");
    next.hand = next.hand.filter((c) => c.type !== "skill");
    for (const s of skills) {
      next.exhaustPile = [...(next.exhaustPile || []), s];
      next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
      next.exhaustTotal = (next.exhaustTotal || 0) + 1;
      if (next.doom_engine_active) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + 1);
      if (hasRelic(run, "cinder_box")) next.player.block += 2;
      if (hasRelic(run, "crematorium_bell") && next.exhaustTotal <= 2) next.player.energy += 1;
      if (hasRelic(run, "black_prism") && !next.black_prism_fired && next.exhaustTotal >= 3) {
        next.player.energy += 1;
        next.black_prism_fired = true;
      }
    }
  }

  if (card.ifHexedExhaustFromHand && (next.enemy.hex || 0) > 0 && next.hand.length > 0) {
    const rIdx = Math.floor(Math.random() * next.hand.length);
    const exhausted = next.hand.splice(rIdx, 1)[0];
    next.exhaustPile = [...(next.exhaustPile || []), exhausted];
    next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
    next.exhaustTotal = (next.exhaustTotal || 0) + 1;
    if (next.doom_engine_active) next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + 1);
  }
  if (card.ifHexedEnergyGain && (next.enemy.hex || 0) > 0) {
    next.player.energy += card.ifHexedEnergyGain;
  }

  // Sync targeted enemy back to enemies array before phase/victory checks
  const tIdxPlay = next.targetIndex || 0;
  if (next.enemies) {
    next.enemies = next.enemies.map((e, i) => (i === tIdxPlay ? { ...next.enemy } : e));
  }

  next = checkPhaseShift(next);
  // Sync phase-shifted enemy back to enemies array
  if (next.enemies) {
    next.enemies = next.enemies.map((e, i) => (i === tIdxPlay ? { ...next.enemy } : e));
  }

  if (next.player.health <= 0) {
    if (hasRelic(run, "phoenix_ash") && !nextPhoenixUsed) {
      next.player.health = 1;
      nextPhoenixUsed = true;
      next.triggeredRelics.push("phoenix_ash");
    } else {
      next.player.health = 0;
      next.state = "defeat";
      next.turn = null;
      next.enemyIntent = null;
    }
  }

  // Track individual enemy kill and clamp health to 0
  if (next.enemy.health <= 0 && (combat.enemies ? combat.enemies[tIdxPlay]?.health : combat.enemy?.health) > 0) {
    next.enemy = { ...next.enemy, health: 0 };
    next.enemiesKilledThisCombat = (next.enemiesKilledThisCombat || 0) + 1;
    if (next.enemies) next.enemies = next.enemies.map((e, i) => (i === tIdxPlay ? { ...next.enemy } : e));
  }
  // Victory when ALL enemies dead
  const allEnemiesDead = (next.enemies || [next.enemy]).every((e) => e.health <= 0);
  if (allEnemiesDead && next.state !== "defeat") {
    next.enemy = { ...next.enemy, health: 0 };
    if (next.enemies) next.enemies = next.enemies.map((e) => ({ ...e, health: 0 }));
    next.state = "victory";
    next.turn = null;
  }

  const enemyHealthDelta = Math.max(0, enemyHpBefore - next.enemy.health);
  const playerBlockGain = Math.max(0, (next.player.block || 0) - (combat.player.block || 0));
  const enemyHexGain = Math.max(0, (next.enemy.hex || 0) - (combat.enemy.hex || 0));
  const enemyPoisonGain = Math.max(0, (next.enemy.poison || 0) - (combat.enemy.poison || 0));
  const enemyBurnGain = Math.max(0, (next.enemy.burn || 0) - (combat.enemy.burn || 0));
  const energySpent = Math.max(0, (combat.player.energy || 0) - (next.player.energy || 0));
  const logParts = [];
  if (enemyHealthDelta > 0) logParts.push(`deal ${enemyHealthDelta}`);
  if (playerBlockGain > 0) logParts.push(`gain ${playerBlockGain} block`);
  if (enemyHexGain > 0) logParts.push(`apply ${enemyHexGain} Hex`);
  if (enemyPoisonGain > 0) logParts.push(`apply ${enemyPoisonGain} Poison`);
  if (enemyBurnGain > 0) logParts.push(`apply ${enemyBurnGain} Burn`);
  if (energySpent > 0) logParts.push(`spend ${energySpent} energy`);
  if (next.triggeredRelics?.length) logParts.push(`trigger ${next.triggeredRelics.length} relic`);
  next = appendCombatLog(next, logParts.length > 0
    ? `${card.name}: ${logParts.join(", ")}.`
    : `${card.name} resolved.`, next.triggeredRelics?.length ? "relic" : "player");
  if (next.state === "victory") {
    next = appendCombatLog(next, `${next.enemy.name} was defeated.`, "system");
  }
  if (next.state === "defeat") {
    next = appendCombatLog(next, "You were defeated.", "system");
  }

  // Stat tracking
  const hpDamageDealt = Math.max(0, enemyHpBefore - next.enemy.health);
  const prevStats = run.stats || {};
  const cardCounts = { ...(prevStats.cardPlayCounts || {}) };
  cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
  const mostPlayed = Object.entries(cardCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const newStats = {
    ...prevStats,
    cardsPlayed: (prevStats.cardsPlayed || 0) + 1,
    cardPlayCounts: cardCounts,
    damageDealt: (prevStats.damageDealt || 0) + hpDamageDealt,
    highestSingleHit: Math.max(prevStats.highestSingleHit || 0, hpDamageDealt),
    mostPlayedCardId: mostPlayed
  };

  const carryoverPoison = (next.state === "victory" && (next.enemy.poison || 0) > 0 && hasRelic(run, "plague_sigil"))
    ? 2
    : (run.carryoverPoison || 0);

  return {
    ...run,
    stats: newStats,
    combat: normalizeStatusStacks(next),
    player: { ...run.player, health: next.player.health },
    phoenix_used: nextPhoenixUsed,
    carryoverPoison,
    state: next.state === "defeat" ? "lost" : run.state
  };
};

const applyEnemyIntent = (combat, intent) => {
  if (!intent) return combat;
  let next = clone(combat);
  if (intent.type === "attack") {
    let attackDamage = intent.value + (next.enemy.strength || 0);
    if ((next.enemy.weak || 0) > 0) attackDamage = Math.floor(attackDamage * 0.75);
    const blocked = Math.min(next.player.block, attackDamage);
    const remainingDamage = attackDamage - blocked;
    next.player.block -= blocked;
    next.player.health = Math.max(0, next.player.health - remainingDamage);
    return next;
  }
  if (intent.type === "multi_attack") {
    for (let i = 0; i < (intent.hits || 1); i += 1) {
      let hitDamage = intent.value + (next.enemy.strength || 0);
      if ((next.enemy.weak || 0) > 0) hitDamage = Math.floor(hitDamage * 0.75);
      const blocked = Math.min(next.player.block, hitDamage);
      const remainingDamage = hitDamage - blocked;
      next.player.block -= blocked;
      next.player.health = Math.max(0, next.player.health - remainingDamage);
      if (next.player.health <= 0) break;
    }
    return next;
  }
  if (intent.type === "block") {
    next.enemy.block = (next.enemy.block || 0) + intent.value;
    return next;
  }
  if (intent.type === "buff") {
    next.enemy.damage = (next.enemy.damage || 0) + intent.value;
    return next;
  }
  if (intent.type === "debuff_weak") {
    next.player.weak = (next.player.weak || 0) + (intent.value || 1);
    return next;
  }
  if (intent.type === "debuff_poison") {
    next.player.poison = clampStacks((next.player.poison || 0) + (intent.value || 1), MAX_POISON_STACKS);
    return next;
  }
  if (intent.type === "debuff_burn") {
    next.player.burn = clampStacks((next.player.burn || 0) + (intent.value || 1), MAX_BURN_STACKS);
    return next;
  }
  if (intent.type === "attack_poison") {
    let hitDamage = (intent.value || 0) + (next.enemy.strength || 0);
    if ((next.enemy.weak || 0) > 0) hitDamage = Math.floor(hitDamage * 0.75);
    const blocked = Math.min(next.player.block, hitDamage);
    const remainingDamage = hitDamage - blocked;
    next.player.block -= blocked;
    next.player.health = Math.max(0, next.player.health - remainingDamage);
    next.player.poison = clampStacks((next.player.poison || 0) + (intent.poison || 1), MAX_POISON_STACKS);
    return next;
  }
  if (intent.type === "debuff_hex") {
    next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + (intent.value || 1));
    return next;
  }
  if (intent.type === "debuff_curse") {
    // Adds curse cards to the run's deck — handled post-combat via pendingCurses
    next.pendingCurses = [...(next.pendingCurses || []), intent.curseId || "wound"];
    return next;
  }
  return next;
};

const endCombatTurn = (run) => {
  const combat = normalizeStatusStacks(run.combat);
  if (combat.state !== "active") return run;
  const isMultiEnemy = (combat.enemies || []).length > 1;

  // --- Status ticks: apply to each living enemy ---
  let next = clone(combat);
  if (isMultiEnemy) {
    for (let i = 0; i < next.enemies.length; i++) {
      if (next.enemies[i].health <= 0) continue;
      next.enemy = next.enemies[i];
      next = applyStatusTicks(next, "enemy", "end");
      next = applyStatusTicks(next, "enemy", "start");
      next.enemies[i] = { ...next.enemy };
    }
    next.enemy = next.enemies[next.targetIndex || 0];
  } else {
    next = applyStatusTicks(combat, "enemy", "end");
    next = applyStatusTicks(next, "enemy", "start");
    if (next.enemies) next.enemies = [{ ...next.enemy }];
  }
  const allDeadFromStatus = (next.enemies || [next.enemy]).every((e) => e.health <= 0);
  if (allDeadFromStatus) {
    next.enemy = { ...next.enemy, health: 0 };
    if (next.enemies) next.enemies = next.enemies.map((e) => ({ ...e, health: 0 }));
    next.state = "victory";
    next.turn = null;
    next.enemyIntent = null;
    next = appendCombatLog(next, `${next.enemy.name} collapsed from status damage.`, "status");
    return { ...run, combat: normalizeStatusStacks(next), player: { ...run.player, health: next.player.health } };
  }

  // --- Enemy intents: each living enemy acts ---
  const healthBeforeIntent = next.player.health;
  next.triggeredRelics = [];
  if (isMultiEnemy) {
    for (let i = 0; i < next.enemies.length; i++) {
      const e = next.enemies[i];
      if (!e || e.health <= 0) continue;
      const eTurnIdx = typeof e.turnIndex === "number" ? e.turnIndex : (combat.enemyTurnNumber || 0);
      const intent = resolveEnemyIntent(e, eTurnIdx);
      next.enemy = { ...e };
      next = applyEnemyIntent(next, intent);
      next.enemies[i] = { ...next.enemy, turnIndex: eTurnIdx + 1 };
      if (intent?.label) {
        next = appendCombatLog(next, `${e.name}: ${intent.label}`, "enemy");
      }
      if (next.player.health <= 0) break;
    }
    next.enemy = next.enemies[next.targetIndex || 0];
  } else {
    next = applyEnemyIntent(next, next.enemyIntent);
    if (next.enemies) next.enemies = [{ ...next.enemy }];
  }

  if (hasRelic(run, "thorn_crest") && next.player.health < healthBeforeIntent) {
    const thornBlocked = Math.min(next.enemy.block || 0, 3);
    next.enemy.block = (next.enemy.block || 0) - thornBlocked;
    next.enemy.health = Math.max(0, next.enemy.health - (3 - thornBlocked));
    if (next.enemies) next.enemies[next.targetIndex || 0] = { ...next.enemy };
    next.triggeredRelics.push("thorn_crest");
  }
  next.player.block = 0;
  next.player.energy = DEFAULT_PLAYER_ENERGY + getCombatEnergyBonus(run, combat.nodeType);
  next.player.charged = false;
  next.exhaustedThisTurn = 0;
  next.firstTurn = false;
  next.seal_used_this_turn = false;
  next.silencing_stone_used = false;
  next.duelist_used_this_turn = false;
  next.doom_engine_active = false;
  const nextRun = { ...run };
  if (next.player.health <= 0) {
    if (hasRelic(run, "phoenix_ash") && !run.phoenix_used) {
      next.player.health = 1;
      nextRun.phoenix_used = true;
    } else {
      next.state = "defeat";
      next.turn = null;
      next.enemyIntent = null;
      return { ...nextRun, combat: next, player: { ...run.player, health: 0 }, state: "lost" };
    }
  }
  // Decay curse: lose 1 block per Decay card still in hand
  const decayCount = (next.hand || []).filter((c) => c.id === "decay").length;
  if (decayCount > 0) {
    next.player.block = Math.max(0, next.player.block - decayCount);
  }
  // Decay status effects at turn boundary — for all living enemies
  next.player.weak = Math.max(0, (next.player.weak || 0) - 1);
  if (isMultiEnemy) {
    next.enemies = next.enemies.map((e) => e.health > 0 ? {
      ...e,
      vulnerable: Math.max(0, (e.vulnerable || 0) - 1),
      weak: Math.max(0, (e.weak || 0) - 1)
    } : e);
    next.enemy = next.enemies[next.targetIndex || 0];
  } else {
    next.enemy.vulnerable = Math.max(0, (next.enemy.vulnerable || 0) - 1);
    next.enemy.weak = Math.max(0, (next.enemy.weak || 0) - 1);
    if (next.enemies) next.enemies = [{ ...next.enemy }];
  }
  next.discardPile = [...(next.discardPile || []), ...(next.hand || [])];
  next.hand = [];
  const pendingReturn = [...(next.returnPile || [])];
  next.returnPile = [];
  next.turn = "player";
  // Advance per-enemy turn indices; keep backward-compat enemyTurnNumber for single-enemy
  if (isMultiEnemy) {
    next.enemyTurnNumber = (next.enemies[0]?.turnIndex || 0);
    next.enemyIntent = resolveEnemyIntent(next.enemy, next.enemy.turnIndex || 0);
  } else {
    next.enemyTurnNumber = (combat.enemyTurnNumber || 0) + 1;
    if (next.enemies) next.enemies = [{ ...next.enemy, turnIndex: next.enemyTurnNumber }];
    next.enemyIntent = resolveEnemyIntent(next.enemy, next.enemyTurnNumber);
  }
  next = applyStatusTicks(next, "player", "end");
  next = applyStatusTicks(next, "player", "start");
  // empty_throne: draw 1 fewer on turn 2
  const drawCount = (hasRelic(run, "empty_throne") && next.enemyTurnNumber === 1) ? 4 : 5;
  next = drawCards(next, drawCount);
  next.hand = [...next.hand, ...pendingReturn];
  // Apply power turn_start effects (always target the current targeted enemy)
  for (const power of (next.powers || [])) {
    if (power.dexPerTurn) {
      next.player.dexterity = (next.player.dexterity || 0) + power.dexPerTurn;
    }
    if (power.poisonPerTurn) {
      next.enemy.poison = clampStacks((next.enemy.poison || 0) + power.poisonPerTurn, MAX_POISON_STACKS);
    }
    if (power.burnPerTurn) {
      next.enemy.burn = clampStacks((next.enemy.burn || 0) + power.burnPerTurn, MAX_BURN_STACKS);
    }
    if (power.auraDamage) {
      const auraDamage = power.auraDamage;
      const thornBlocked = Math.min(next.enemy.block || 0, auraDamage);
      next.enemy.block = (next.enemy.block || 0) - thornBlocked;
      next.enemy.health = Math.max(0, next.enemy.health - (auraDamage - thornBlocked));
    }
    if (power.hexPerTurn) {
      next.enemy.hex = Math.min(MAX_HEX_STACKS, (next.enemy.hex || 0) + power.hexPerTurn);
    }
    if (power.damagePerHex) {
      const hexCount = next.enemy.hex || 0;
      if (hexCount > 0) {
        const stormDmg = hexCount * power.damagePerHex;
        const stormBlocked = Math.min(next.enemy.block || 0, stormDmg);
        next.enemy.block = (next.enemy.block || 0) - stormBlocked;
        next.enemy.health = Math.max(0, next.enemy.health - (stormDmg - stormBlocked));
      }
    }
    if (power.maxExhaustEnergy) {
      const energyGain = Math.min((next.exhaustPile || []).length, power.maxExhaustEnergy);
      next.player.energy += energyGain;
    }
    if (power.weakPerTurn) {
      next.enemy.weak = (next.enemy.weak || 0) + power.weakPerTurn;
    }
    if (power.id === "charged_field") {
      next.player.charged = true;
      next = drawCards(next, power.drawPerTurn || 1);
    }
    if (power.energyPerTurn) {
      next.player.health = Math.max(1, next.player.health - (power.hpLossPerTurn || 0));
      next.player.energy += power.energyPerTurn;
    }
  }
  // Sync power effects on targeted enemy back to enemies array
  if (next.enemies) {
    next.enemies = next.enemies.map((e, i) => (i === (next.targetIndex || 0) ? { ...next.enemy } : e));
  }
  if (next.player.health <= 0) {
    if (hasRelic(run, "phoenix_ash") && !nextRun.phoenix_used) {
      next.player.health = 1;
      nextRun.phoenix_used = true;
    } else {
      next.state = "defeat";
      next.turn = null;
      next.enemyIntent = null;
      return { ...nextRun, combat: normalizeStatusStacks(next), player: { ...run.player, health: 0 }, state: "lost" };
    }
  }
  next = checkPhaseShift(next);
  // Sync phase-shifted targeted enemy back to enemies array
  if (next.enemies) {
    next.enemies = next.enemies.map((e, i) => (i === (next.targetIndex || 0) ? { ...next.enemy } : e));
  }
  // Victory when all enemies dead
  const allDeadAfterPowers = (next.enemies || [next.enemy]).every((e) => e.health <= 0);
  if (allDeadAfterPowers) {
    next.enemy = { ...next.enemy, health: 0 };
    if (next.enemies) next.enemies = next.enemies.map((e) => ({ ...e, health: 0 }));
    next.state = "victory";
    next.turn = null;
  }

  // Stat tracking for turn end
  const hpLostThisTurn = Math.max(0, healthBeforeIntent - next.player.health);
  if (!isMultiEnemy && combat.enemyIntent) {
    const enemyIntentLabel = combat.enemyIntent?.label || "Enemy acted";
    const logText = hpLostThisTurn > 0
      ? `${enemyIntentLabel}, dealing ${hpLostThisTurn} damage.`
      : `${enemyIntentLabel}.`;
    next = appendCombatLog(next, logText, "enemy");
  } else if (isMultiEnemy && hpLostThisTurn > 0) {
    next = appendCombatLog(next, `Enemies dealt ${hpLostThisTurn} damage total.`, "enemy");
  }
  if (next.state === "defeat") {
    next = appendCombatLog(next, "You were defeated.", "system");
  }
  if (next.state === "victory") {
    next = appendCombatLog(next, `${next.enemy.name} was defeated.`, "system");
  }
  const prevStats = run.stats || {};
  const turnStats = {
    ...prevStats,
    damageTaken: (prevStats.damageTaken || 0) + hpLostThisTurn,
    turnsPlayed: (prevStats.turnsPlayed || 0) + 1
  };

  return { ...nextRun, stats: turnStats, combat: normalizeStatusStacks(next), player: { ...run.player, health: next.player.health } };
};

const usePotionInCombat = (run, potionId) => {
  if (!run.combat || run.combat.state !== "active") throw new Error("No active combat");
  if (!(run.potions || []).some((p) => p.id === potionId)) throw new Error("Potion not found");

  // Inject maxHealth so healing potions cap correctly
  const combatWithMax = {
    ...run.combat,
    player: { ...run.combat.player, maxHealth: run.player.maxHealth || run.player.health }
  };
  const nextCombat = applyPotion(clone(combatWithMax), potionId);
  const firstIdx = run.potions.findIndex((p) => p.id === potionId);
  const potionsAfter = [...run.potions.slice(0, firstIdx), ...run.potions.slice(firstIdx + 1)];

  return {
    ...run,
    potions: potionsAfter,
    combat: nextCombat,
    player: { ...run.player, health: nextCombat.player.health }
  };
};

const discardPotion = (run, potionId) => {
  if (!(run.potions || []).some((p) => p.id === potionId)) throw new Error("Potion not found");
  const firstIdx = run.potions.findIndex((p) => p.id === potionId);
  return {
    ...run,
    potions: [...run.potions.slice(0, firstIdx), ...run.potions.slice(firstIdx + 1)]
  };
};

module.exports = {
  startCombatForNode,
  playCombatCard,
  endCombatTurn,
  usePotionInCombat,
  discardPotion
};
