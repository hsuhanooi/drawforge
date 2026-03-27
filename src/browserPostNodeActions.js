const { createVictoryRewards } = require("./rewards");
const { addRelicToRun } = require("./relics");
const { toRenderableCards } = require("./cardCatalog");

const hasRelic = (run, id) => (run.relics || []).some((relic) => relic.id === id);

const finishNode = (run) => {
  const currentNode = run.map.nodes.find((node) => node.id === run.map.currentNodeId);
  const isBossNode = currentNode && currentNode.type === "boss";
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
  const rewards = createVictoryRewards(combat.nodeType);
  rewards.cards = toRenderableCards(rewards.cards || []);
  const boneTokenHeal = hasRelic(run, "bone_token") ? 3 : 0;

  return {
    ...run,
    player: {
      ...run.player,
      health: combat.player.health + boneTokenHeal,
      gold: run.player.gold + rewards.gold
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
  return afterCardSelection(addRelicToRun(run, relic));
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

  return nextRun;
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

module.exports = {
  applyVictoryToRun,
  finishNode,
  claimCardReward,
  claimRelicFromChoices,
  claimRelicReward,
  skipRewards,
  claimEventOption,
  removeCardFromDeck
};
