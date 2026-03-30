const { createVictoryRewards } = require("./rewards");
const { addRelicToRun } = require("./relics");
const { toRenderableCards } = require("./cardCatalog");
const { upgradeCardInDeck } = require("./cardUpgrade");
const { startAct2 } = require("./actTransition");
const { MAX_POTIONS } = require("./potions");

const hasRelic = (run, id) => (run.relics || []).some((relic) => relic.id === id);

const finishNode = (run) => {
  const currentNode = run.map.nodes.find((node) => node.id === run.map.currentNodeId);
  const isBossNode = currentNode && currentNode.type === "boss";

  if (isBossNode && (run.act || 1) === 1) {
    return startAct2(run);
  }

  return {
    ...run,
    combat: null,
    pendingRewards: null,
    event: null,
    state: isBossNode ? "won" : "in_progress"
  };
};

const afterCardSelection = (run) => {
  if (run.pendingRewards?.relics?.length) {
    return {
      ...run,
      pendingRewards: {
        ...run.pendingRewards,
        cards: []
      }
    };
  }

  if (run.pendingRewards?.relic) {
    return {
      ...run,
      pendingRewards: {
        ...run.pendingRewards,
        cards: []
      }
    };
  }

  if (run.pendingRewards?.removeCard) {
    return {
      ...run,
      pendingRewards: {
        ...run.pendingRewards,
        cards: [],
        relic: null,
        relics: []
      }
    };
  }

  return finishNode(run);
};

const applyVictoryToRun = (run, combat) => {
  const rewards = createVictoryRewards(combat.nodeType, run);
  rewards.cards = toRenderableCards(rewards.cards || []);

  const maxHealth = run.player.maxHealth || run.player.health;
  let newHealth = combat.player.health;

  if (hasRelic(run, "bone_token")) {
    newHealth = Math.min(newHealth + 3, maxHealth);
  }
  if (hasRelic(run, "soot_vessel") && combat.player.health <= Math.floor(maxHealth / 2)) {
    newHealth = Math.min(newHealth + 6, maxHealth);
  }

  let goldBonus = 0;
  if (hasRelic(run, "lucky_coin")) goldBonus += 5;
  if (hasRelic(run, "pilgrims_map") && combat.nodeType !== "boss") goldBonus += 3;

  const newCombatsWon = (run.combatsWon || 0) + 1;
  let newMaxHealth = maxHealth;
  if (hasRelic(run, "leather_thread") && newCombatsWon % 3 === 0) {
    newMaxHealth += 1;
  }

  // Apply any curses inflicted during combat (from debuff_curse intents)
  const pendingCurses = combat.pendingCurses || [];
  const newDeck = [...run.player.deck, ...pendingCurses];

  // Collect potion reward if any (and there's room)
  const currentPotions = run.potions || [];
  const newPotions = rewards.potion && currentPotions.length < MAX_POTIONS
    ? [...currentPotions, rewards.potion]
    : currentPotions;

  // Stat tracking
  const goldGained = rewards.gold + goldBonus;
  const prevStats = run.stats || {};
  const newStats = {
    ...prevStats,
    enemiesKilled: (prevStats.enemiesKilled || 0) + 1,
    goldEarned: (prevStats.goldEarned || 0) + goldGained
  };

  return {
    ...run,
    combatsWon: newCombatsWon,
    potions: newPotions,
    stats: newStats,
    player: {
      ...run.player,
      health: newHealth,
      maxHealth: newMaxHealth,
      gold: run.player.gold + goldGained,
      deck: newDeck
    },
    combat,
    pendingRewards: rewards
  };
};

const claimCardReward = (run, cardId) => afterCardSelection({
  ...run,
  player: {
    ...run.player,
    deck: [...run.player.deck, cardId]
  }
});

const claimRelicFromChoices = (run, relicId) => {
  const relic = (run.pendingRewards?.relics || []).find((item) => item.id === relicId);
  if (!relic) {
    throw new Error("Relic choice not found");
  }
  const updated = addRelicToRun(run, relic);
  return {
    ...updated,
    pendingRewards: {
      ...updated.pendingRewards,
      cards: [],
      relics: [],
      relic: null,
      removeCard: true
    }
  };
};

const claimRelicReward = (run, relicId) => {
  const relic = run.pendingRewards?.relic && run.pendingRewards.relic.id === relicId
    ? run.pendingRewards.relic
    : null;
  if (!relic) {
    throw new Error("Relic reward not found");
  }
  const runWithRelic = addRelicToRun(run, relic);
  return afterCardSelection({
    ...runWithRelic,
    pendingRewards: {
      ...runWithRelic.pendingRewards,
      relic: null,
      cards: []
    }
  });
};

const skipRewards = (run) => {
  if (run.pendingRewards?.relics?.length) {
    return {
      ...run,
      pendingRewards: {
        ...run.pendingRewards,
        cards: [],
        relics: [],
        relic: null,
        removeCard: true
      }
    };
  }
  return afterCardSelection(run);
};

const claimEventOption = (run, optionId) => {
  const option = run.event?.options.find((item) => item.id === optionId);
  if (!option) {
    throw new Error("Event option not found");
  }

  let nextRun = { ...run, event: null };

  if (option.effect === "heal") {
    nextRun = {
      ...nextRun,
      player: { ...nextRun.player, health: nextRun.player.health + (option.amount || 10) }
    };
  }
  else if (option.effect === "relic") {
    nextRun = addRelicToRun(nextRun, option.relic);
  }
  else if (option.effect === "gold") {
    nextRun = {
      ...nextRun,
      player: { ...nextRun.player, gold: nextRun.player.gold + option.amount }
    };
  }
  else if (option.effect === "reward_cards") {
    nextRun = {
      ...nextRun,
      pendingRewards: { cards: toRenderableCards(option.cards || []), gold: 0, relic: null, relics: [], removeCard: false }
    };
  }
  else if (option.effect === "add_card") {
    nextRun = {
      ...nextRun,
      player: { ...nextRun.player, deck: [...nextRun.player.deck, option.card.id] }
    };
  }
  else if (option.effect === "remove") {
    nextRun = {
      ...nextRun,
      pendingRewards: { cards: [], gold: 0, relic: null, relics: [], removeCard: true }
    };
  }
  else if (option.effect === "gold_for_curse") {
    nextRun = {
      ...nextRun,
      player: {
        ...nextRun.player,
        gold: nextRun.player.gold + option.amount,
        deck: [...nextRun.player.deck, option.curseId]
      }
    };
  }
  else if (option.effect === "max_health_up") {
    const maxHealth = (nextRun.player.maxHealth || nextRun.player.health) + (option.amount || 5);
    nextRun = {
      ...nextRun,
      player: { ...nextRun.player, maxHealth }
    };
  }

  return nextRun;
};

const buyShopItem = (run, type, itemId, price) => {
  if ((run.player.gold || 0) < price) {
    throw new Error("Not enough gold");
  }
  const nextPlayer = { ...run.player, gold: run.player.gold - price };

  if (type === "card") {
    return { ...run, player: { ...nextPlayer, deck: [...nextPlayer.deck, itemId] } };
  }

  if (type === "relic") {
    const relic = (run.shop?.relics || []).find((r) => r.id === itemId);
    if (!relic) {
      throw new Error("Relic not found in shop");
    }
    return addRelicToRun({ ...run, player: nextPlayer }, relic);
  }

  if (type === "service") {
    if (itemId === "heal") {
      const maxH = nextPlayer.maxHealth || nextPlayer.health;
      return { ...run, player: { ...nextPlayer, health: Math.min(nextPlayer.health + 15, maxH) } };
    }
    if (itemId === "remove") {
      return {
        ...run,
        player: nextPlayer,
        pendingRewards: { cards: [], gold: 0, relic: null, relics: [], removeCard: true }
      };
    }
  }

  throw new Error("Unknown shop item type");
};

const removeCardFromDeck = (run, cardId) => {
  const index = run.player.deck.indexOf(cardId);
  if (index === -1) {
    return run;
  }

  return finishNode({
    ...run,
    player: {
      ...run.player,
      deck: [...run.player.deck.slice(0, index), ...run.player.deck.slice(index + 1)]
    }
  });
};

const upgradeCard = (run, deckIndex) => {
  const deck = upgradeCardInDeck(run.player.deck, deckIndex);
  return finishNode({ ...run, player: { ...run.player, deck } });
};

module.exports = {
  applyVictoryToRun,
  finishNode,
  claimCardReward,
  claimRelicFromChoices,
  claimRelicReward,
  skipRewards,
  claimEventOption,
  removeCardFromDeck,
  buyShopItem,
  upgradeCard
};
