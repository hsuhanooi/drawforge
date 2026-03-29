const { createEnemyForNode, resolveEnemyIntent } = require("./enemies");
const { createCardCatalog } = require("./cardCatalog");
const { getCombatEnergyBonus } = require("./relics");

const DEFAULT_PLAYER_ENERGY = 3;
const CARD_CATALOG = createCardCatalog();

const clone = (value) => JSON.parse(JSON.stringify(value));

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
    next.hand.push(next.drawPile.shift());
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
  if (!e.phaseThreshold || e.phase !== 1 || e.health > e.phaseThreshold) return combat;
  const next = clone(combat);
  next.enemy.phase = 2;
  next.enemy.intents = next.enemy.phase2Intents || next.enemy.intents;
  next.enemy.strength = (next.enemy.strength || 0) + (next.enemy.phase2Strength || 0);
  next.enemyTurnNumber = 0;
  next.enemyIntent = resolveEnemyIntent(next.enemy, 0);
  return next;
};

const startCombatForNode = (run, node) => {
  const enemy = { ...createEnemyForNode(node, run.act || 1) };
  enemy.maxHp = enemy.health;
  const energyBonus = getCombatEnergyBonus(run, node.type);
  const ashenBonus = hasRelic(run, "ashen_idol") ? 1 : 0;
  let drawCount = hasRelic(run, "quickened_loop") ? 6 : 5;
  if (hasRelic(run, "empty_throne")) drawCount += 2;
  if (hasRelic(run, "infernal_battery")) drawCount -= 1;
  const startingBlock = hasRelic(run, "rusted_buckler") ? 4 : 0;
  return drawCards({
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
      weak: 0
    },
    hand: [],
    drawPile: shuffleCards(run.player.deck.map(createRenderableCardFromId)),
    discardPile: [],
    exhaustPile: [],
    powers: [],
    exhaustedThisTurn: 0,
    enemy: {
      ...enemy,
      vulnerable: hasRelic(run, "cracked_lens") ? 1 : 0,
      hex: hasRelic(run, "hex_crown") ? 1 : 0
    }
  }, drawCount);
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

  let next = clone(combat);
  if (hasRelic(run, "time_locked_seal") && !next.seal_used_this_turn && card.cost <= 1) {
    next.seal_used_this_turn = true;
  }
  if (hasRelic(run, "silencing_stone") && !next.silencing_stone_used && (next.enemy.weak || 0) > 0) {
    next.silencing_stone_used = true;
  }
  if (hasRelic(run, "grave_wick") && !next.grave_wick_used && card.exhaust) {
    next.grave_wick_used = true;
  }

  next.player.energy -= effectiveCost;
  next.hand.splice(handIndex, 1);

  // Route card to destination first so draw effects can reshuffle from discard
  if (card.exhaust) {
    next.exhaustPile = [...(next.exhaustPile || []), card];
    next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
    next.exhaustTotal = (next.exhaustTotal || 0) + 1;
    if (next.doom_engine_active) next.enemy.hex = (next.enemy.hex || 0) + 1;
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
  } else if (card.returnToHand) {
    next.returnPile = [...(next.returnPile || []), card];
  } else if (card.type === "power") {
    next.powers = [...(next.powers || []), { id: card.id, label: card.name }];
  } else {
    next.discardPile = [...(next.discardPile || []), card];
  }

  if (card.damage || card.bonusVsHex || card.bonusVsExhaust || card.bonusVsHexedOrExhausted || card.bonusVsVulnerable || card.bonusPerStrength || card.bonusDmgPerHex || card.bonusDmgPerExhausted || card.bonusIfLastCard || card.consumeHexBonus || card.repeatIfHexed || (card.type === "attack" && (next.player.strength || 0) > 0)) {
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
    const exhaustedStackBonus = card.bonusDmgPerExhausted ? (next.exhaustedThisTurn || 0) * card.bonusDmgPerExhausted : 0;
    const lastCardBonus = card.bonusIfLastCard && next.hand.length === 0 ? card.bonusIfLastCard : 0;
    // consumeHexBonus: consume all hex stacks, deal bonus per stack consumed
    const hexStacks = next.enemy.hex || 0;
    const hexConsumedBonus = card.consumeHexBonus ? hexStacks * card.consumeHexBonus : 0;
    if (card.consumeHexBonus) next.enemy.hex = 0;
    let totalDamage = (card.damage || 0) + hexBonus + exhaustBonus + harvesterHexBonus + harvesterExhaustBonus + hexNailBonus + vulnerableBonus + flickerBonus + duelistBonus + furnaceBonus + strengthFlat + strengthScaling + hexPerStackBonus + exhaustedStackBonus + lastCardBonus + hexConsumedBonus;
    // Weak on player reduces outgoing attack damage by 25%
    if (card.type === "attack" && (next.player.weak || 0) > 0) totalDamage = Math.floor(totalDamage * 0.75);
    // Vulnerable on enemy amplifies incoming damage by 50%
    if ((next.enemy.vulnerable || 0) > 0) totalDamage = Math.floor(totalDamage * 1.5);
    const blocked = Math.min(next.enemy.block || 0, totalDamage);
    const remainingDamage = totalDamage - blocked;
    next.enemy.block = (next.enemy.block || 0) - blocked;
    next.enemy.health -= remainingDamage;
    if (flickerBonus > 0) next.flicker_used = true;
    if (duelistBonus > 0) next.duelist_used_this_turn = true;
    if (hasRelic(run, "hex_lantern") && !next.hex_lantern_used && remainingDamage > 0) {
      next.enemy.hex = (next.enemy.hex || 0) + 1;
      next.hex_lantern_used = true;
    }
    // repeatIfHexed: deal damage a second time if enemy had hex (no_mercy)
    if (card.repeatIfHexed && hexStacks > 0) {
      const blocked2 = Math.min(next.enemy.block || 0, totalDamage);
      next.enemy.block = (next.enemy.block || 0) - blocked2;
      next.enemy.health -= (totalDamage - blocked2);
    }
  }
  if (card.block || card.bonusBlockIfHexed || card.bonusBlockIfCharged) {
    // Dexterity adds to all block-generating card plays
    const dexBonus = (card.block || card.bonusBlockIfCharged) ? (next.player.dexterity || 0) : 0;
    next.player.block += (card.block || 0) + dexBonus + (((next.player.energy ?? 0) >= 2 && card.bonusBlockIfHighEnergy) ? card.bonusBlockIfHighEnergy : 0);
    if (card.bonusBlockIfHexed && (next.enemy.hex || 0) > 0) {
      next.player.block += card.bonusBlockIfHexed;
    }
    if (card.bonusBlockIfCharged && next.player.charged) {
      next.player.block += card.bonusBlockIfCharged;
    }
  }
  if (card.energyGain) next.player.energy += card.energyGain;
  if (card.energyPerExhausted) next.player.energy += (next.exhaustedThisTurn || 0);
  if (card.selfDamage) next.player.health = Math.max(0, next.player.health - card.selfDamage);
  if (card.hex) {
    const hexAmount = card.hex + (hasRelic(run, "worn_grimoire") && !next.grimoire_used ? 1 : 0);
    if (hasRelic(run, "worn_grimoire") && !next.grimoire_used && card.hex > 0) {
      next.grimoire_used = true;
    }
    next.enemy.hex = (next.enemy.hex || 0) + hexAmount;
    if (hasRelic(run, "sigil_engine") && !next.sigil_fired && (next.enemy.hex || 0) >= 3) {
      const sigBlocked = Math.min(next.enemy.block || 0, 8);
      next.enemy.block = (next.enemy.block || 0) - sigBlocked;
      next.enemy.health -= (8 - sigBlocked);
      next.sigil_fired = true;
    }
  }
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
    if (next.doom_engine_active) next.enemy.hex = (next.enemy.hex || 0) + 1;
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
      if (next.doom_engine_active) next.enemy.hex = (next.enemy.hex || 0) + 1;
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
      if (next.doom_engine_active) next.enemy.hex = (next.enemy.hex || 0) + 1;
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
    if (card.hexPerExhausted) next.enemy.hex = (next.enemy.hex || 0) + hexFromExhaust;
  }

  if (card.exhaustSkillsFromHand) {
    const skills = next.hand.filter((c) => c.type === "skill");
    next.hand = next.hand.filter((c) => c.type !== "skill");
    for (const s of skills) {
      next.exhaustPile = [...(next.exhaustPile || []), s];
      next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
      next.exhaustTotal = (next.exhaustTotal || 0) + 1;
      if (next.doom_engine_active) next.enemy.hex = (next.enemy.hex || 0) + 1;
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
    if (next.doom_engine_active) next.enemy.hex = (next.enemy.hex || 0) + 1;
  }
  if (card.ifHexedEnergyGain && (next.enemy.hex || 0) > 0) {
    next.player.energy += card.ifHexedEnergyGain;
  }

  next = checkPhaseShift(next);

  if (next.enemy.health <= 0) {
    next.enemy.health = 0;
    next.state = "victory";
    next.turn = null;
  }

  return {
    ...run,
    combat: next,
    player: { ...run.player, health: next.player.health },
    phoenix_used: run.phoenix_used || false
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
  if (intent.type === "debuff_hex") {
    next.enemy.hex = (next.enemy.hex || 0) + (intent.value || 1);
    return next;
  }
  return next;
};

const endCombatTurn = (run) => {
  const combat = run.combat;
  if (combat.state !== "active") return run;
  const healthBeforeIntent = combat.player.health;
  let next = applyEnemyIntent(combat, combat.enemyIntent);
  if (hasRelic(run, "thorn_crest") && next.player.health < healthBeforeIntent) {
    const thornBlocked = Math.min(next.enemy.block || 0, 3);
    next.enemy.block = (next.enemy.block || 0) - thornBlocked;
    next.enemy.health = Math.max(0, next.enemy.health - (3 - thornBlocked));
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
  // Decay status effects at turn boundary
  next.player.weak = Math.max(0, (next.player.weak || 0) - 1);
  next.enemy.vulnerable = Math.max(0, (next.enemy.vulnerable || 0) - 1);
  next.enemy.weak = Math.max(0, (next.enemy.weak || 0) - 1);
  next.discardPile = [...(next.discardPile || []), ...(next.hand || [])];
  next.hand = [];
  const pendingReturn = [...(next.returnPile || [])];
  next.returnPile = [];
  next.turn = "player";
  next.enemyTurnNumber = (combat.enemyTurnNumber || 0) + 1;
  next.enemyIntent = resolveEnemyIntent(next.enemy, next.enemyTurnNumber);
  // empty_throne: draw 1 fewer on turn 2 (enemyTurnNumber was just incremented to 1 after first enemy turn)
  const drawCount = (hasRelic(run, "empty_throne") && next.enemyTurnNumber === 1) ? 4 : 5;
  next = drawCards(next, drawCount);
  next.hand = [...next.hand, ...pendingReturn];
  // Apply power turn_start effects
  for (const power of (next.powers || [])) {
    if (power.id === "iron_will") {
      next.player.dexterity = (next.player.dexterity || 0) + 1;
    } else if (power.id === "burning_aura") {
      const thornBlocked = Math.min(next.enemy.block || 0, 3);
      next.enemy.block = (next.enemy.block || 0) - thornBlocked;
      next.enemy.health = Math.max(0, next.enemy.health - (3 - thornBlocked));
    } else if (power.id === "hex_resonance") {
      next.enemy.hex = (next.enemy.hex || 0) + 1;
    }
  }
  next = checkPhaseShift(next);
  if (next.enemy.health <= 0) {
    next.enemy.health = 0;
    next.state = "victory";
    next.turn = null;
  }
  return { ...nextRun, combat: next, player: { ...run.player, health: next.player.health } };
};

module.exports = {
  startCombatForNode,
  playCombatCard,
  endCombatTurn
};
