const { createRewardOptions } = require("./rewards");
const { createRelicReward, RELICS } = require("./relics");
const { toRenderableCards } = require("./cardCatalog");

const pickUniqueItems = (items, count) => {
  const pool = [...items];
  const chosen = [];
  while (pool.length > 0 && chosen.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
};

const createPlayRewardCardOptions = (count = 3) => toRenderableCards(createRewardOptions(count));

const createPlayEventState = async (node) => {
  const kind = node.type === "rest" ? "campfire" : node.type;
  if (kind === "campfire") {
    return {
      kind: "campfire",
      title: "Campfire",
      description: "Rest or prepare for the road ahead.",
      options: [
        { id: "heal", label: "Rest: Heal 20 HP", effect: "heal", amount: 20 },
        { id: "remove", label: "Meditate: Remove a card", effect: "remove" },
        { id: "leave", label: "Leave", effect: "leave" }
      ]
    };
  }
  if (kind === "event") {
    return {
      kind: "event",
      title: "Strange Encounter",
      description: "A roadside shrine hums with unstable energy.",
      options: [
        { id: "gold", label: "Take 30 gold", effect: "gold", amount: 30 },
        { id: "cards", label: "Take a card reward", effect: "reward_cards", cards: createPlayRewardCardOptions(3) },
        { id: "leave", label: "Leave", effect: "leave" }
      ]
    };
  }
  return null;
};

const createPlayShopState = async (run) => {
  const cards = createPlayRewardCardOptions(3).map((card) => ({ ...card, price: card.rarity === "rare" ? 90 : card.rarity === "uncommon" ? 65 : 50 }));
  const ownedIds = new Set((run.relics || []).map((relic) => relic.id));
  const relicPool = RELICS.filter((relic) => (relic.rarity === "common" || relic.rarity === "uncommon") && !ownedIds.has(relic.id));
  const relics = pickUniqueItems(relicPool, 3).map((relic) => ({ ...relic, price: relic.rarity === "uncommon" ? 110 : 80 }));
  return {
    cards,
    relics,
    services: [
      { id: "heal", label: "Restore 15 HP", price: 40 },
      { id: "remove", label: "Remove a card", price: 75 }
    ]
  };
};

module.exports = {
  createPlayRewardCardOptions,
  createPlayEventState,
  createPlayShopState
};
