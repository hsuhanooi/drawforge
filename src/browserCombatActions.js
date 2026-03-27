const { createCardFromId } = require("./browserCombat");
const { createEnemyForNode, resolveEnemyIntent } = require("./enemies");

const DEFAULT_PLAYER_ENERGY = 3;

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
const getEnergyBonus = (run) => (hasRelic(run, "ember_ring") ? 1 : 0);

const startCombatForNode = (run, node) => {
  const enemy = createEnemyForNode(node);
  const drawCount = hasRelic(run, "quickened_loop") ? 6 : 5;
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
    player: { health: run.player.health, block: startingBlock, energy: DEFAULT_PLAYER_ENERGY + getEnergyBonus(run), charged: false },
    hand: [],
    drawPile: shuffleCards(run.player.deck.map(createCardFromId)),
    discardPile: [],
    exhaustPile: [],
    exhaustedThisTurn: 0,
    enemy
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
  if (hasRelic(run, "time_locked_seal") && !combat.seal_used_this_turn && effectiveCost <= 1) {
    effectiveCost = 0;
  }
  if (combat.player.energy < effectiveCost) throw new Error("Not enough energy");

  let next = clone(combat);
  if (hasRelic(run, "time_locked_seal") && !next.seal_used_this_turn && card.cost <= 1) {
    next.seal_used_this_turn = true;
  }

  next.player.energy -= effectiveCost;
  next.hand.splice(handIndex, 1);

  if (card.damage || card.bonusVsHex || card.bonusVsExhaust || card.bonusVsHexedOrExhausted) {
    const hexBonus = (next.enemy.hex || 0) > 0 && card.bonusVsHex ? card.bonusVsHex : 0;
    const exhaustBonus = (next.exhaustPile || []).length > 0 && card.bonusVsExhaust ? card.bonusVsExhaust : 0;
    const harvesterHexBonus = (next.enemy.hex || 0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
    const harvesterExhaustBonus = (next.exhaustedThisTurn || 0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
    const hexNailBonus = hasRelic(run, "hex_nail") && card.type === "attack" && (next.enemy.hex || 0) > 0 ? 2 : 0;
    const totalDamage = (card.damage || 0) + hexBonus + exhaustBonus + harvesterHexBonus + harvesterExhaustBonus + hexNailBonus;
    const blocked = Math.min(next.enemy.block || 0, totalDamage);
    const remainingDamage = totalDamage - blocked;
    next.enemy.block = (next.enemy.block || 0) - blocked;
    next.enemy.health -= remainingDamage;
  }
  if (card.block) {
    next.player.block += card.block + (((next.player.energy ?? 0) >= 2 && card.bonusBlockIfHighEnergy) ? card.bonusBlockIfHighEnergy : 0);
    if (card.bonusBlockIfHexed && (next.enemy.hex || 0) > 0) {
      next.player.block += card.bonusBlockIfHexed;
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
  if (card.setCharged) {
    next.player.charged = true;
    if (hasRelic(run, "volt_shard")) {
      next.player.block += 1;
      next = drawCards(next, 1);
    }
  }
  if (card.draw) next = drawCards(next, card.draw);
  if (card.drawIfCharged && next.player.charged) next = drawCards(next, card.drawIfCharged);
  if (card.energyIfCharged && next.player.charged) next.player.energy += card.energyIfCharged;

  if (card.exhaustFromHand && next.hand.length > 0) {
    const randomIndex = Math.floor(Math.random() * next.hand.length);
    const exhausted = next.hand.splice(randomIndex, 1)[0];
    next.exhaustPile = [...(next.exhaustPile || []), exhausted];
    next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
    if (hasRelic(run, "coal_pendant") && !next.coal_pendant_used) {
      next = drawCards(next, 1);
      next.coal_pendant_used = true;
    }
    if (hasRelic(run, "cinder_box")) {
      next.player.block += 2;
    }
  }

  if (card.exhaust) {
    next.exhaustPile = [...(next.exhaustPile || []), card];
    next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
    if (hasRelic(run, "coal_pendant") && !next.coal_pendant_used) {
      next = drawCards(next, 1);
      next.coal_pendant_used = true;
    }
    if (hasRelic(run, "cinder_box")) {
      next.player.block += 2;
    }
  } else {
    next.discardPile = [...(next.discardPile || []), card];
  }

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
    const blocked = Math.min(next.player.block, intent.value);
    const remainingDamage = intent.value - blocked;
    next.player.block -= blocked;
    next.player.health = Math.max(0, next.player.health - remainingDamage);
    return next;
  }
  if (intent.type === "multi_attack") {
    for (let i = 0; i < (intent.hits || 1); i += 1) {
      const blocked = Math.min(next.player.block, intent.value);
      const remainingDamage = intent.value - blocked;
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
  return next;
};

const endCombatTurn = (run) => {
  const combat = run.combat;
  if (combat.state !== "active") return run;
  let next = applyEnemyIntent(combat, combat.enemyIntent);
  next.player.block = 0;
  next.player.energy = DEFAULT_PLAYER_ENERGY + getEnergyBonus(run);
  next.player.charged = false;
  next.exhaustedThisTurn = 0;
  next.firstTurn = false;
  next.seal_used_this_turn = false;
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
  next.discardPile = [...(next.discardPile || []), ...(next.hand || [])];
  next.hand = [];
  next.turn = "player";
  next.enemyTurnNumber = (combat.enemyTurnNumber || 0) + 1;
  next.enemyIntent = resolveEnemyIntent(next.enemy, next.enemyTurnNumber);
  next = drawCards(next, 5);
  return { ...nextRun, combat: next, player: { ...run.player, health: next.player.health } };
};

module.exports = {
  startCombatForNode,
  playCombatCard,
  endCombatTurn
};
