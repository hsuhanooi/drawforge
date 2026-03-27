const { createVictoryRewards } = require("./rewards");
const { addRelicToRun } = require("./relics");

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
  if (run.pendingRewards && run.pendingRewards.removeCard) {
    return {
      ...run,
      pendingRewards: { cards: [], gold: 0, relic: null, relics: [], removeCard: true }
    };
  }
  return finishNode(run);
};

const applyVictoryToRun = (run, combat) => {
  const rewards = createVictoryRewards(combat.nodeType);
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
    pendingRewards: { ...updated.pendingRewards, relics: [] }
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

const skipRewards = (run) => afterCardSelection(run);

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
  if (option.effect === "relic") {
    nextRun = addRelicToRun(nextRun, option.relic);
  }
  if (option.effect === "gold") {
    nextRun = {
      ...nextRun,
      player: { ...nextRun.player, gold: nextRun.player.gold + option.amount }
    };
  }
  if (option.effect === "reward_cards") {
    nextRun = {
      ...nextRun,
      pendingRewards: { cards: option.cards, gold: 0, relic: null, relics: [], removeCard: false }
    };
  }
  if (option.effect === "add_card") {
    nextRun = {
      ...nextRun,
      player: { ...nextRun.player, deck: [...nextRun.player.deck, option.card.id] }
    };
  }
  if (option.effect === "remove") {
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
