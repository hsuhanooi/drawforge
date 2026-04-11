const { createRewardOptions } = require("./rewards");
const { RELICS } = require("./relics");
const { toRenderableCards } = require("./cardCatalog");
const { createCampfireEvent } = require("./events");
const { scaleShopPrice } = require("./ascension");
const { POTIONS, MAX_POTIONS } = require("./potions");

const RARITY_SCORE = {
  common: 1,
  uncommon: 2,
  rare: 3
};

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

const scoreCardForShop = (card) => (RARITY_SCORE[card.rarity] || 0) * 100 + ((card.cost === 0 ? 8 : 0) + (card.keywords?.length || 0));

const createPlayShopCards = (run, count = 4) => {
  const act = run?.act || 1;
  const candidateCount = Math.max(8, count * 2);
  const candidates = toRenderableCards(createRewardOptions(candidateCount));
  const rarityFloor = act >= 3 ? 2 : act >= 2 ? 1.5 : 1;
  const filtered = candidates.filter((card) => (RARITY_SCORE[card.rarity] || 0) >= rarityFloor || card.rarity === "rare");
  const pool = (filtered.length >= count ? filtered : candidates)
    .sort((left, right) => scoreCardForShop(right) - scoreCardForShop(left));
  return pool.slice(0, count);
};

const createPlayShopRelics = (run, count = 3) => {
  const act = run?.act || 1;
  const ownedIds = new Set((run.relics || []).map((relic) => relic.id));
  const rarityWhitelist = act >= 3 ? new Set(["common", "uncommon", "rare"]) : act >= 2 ? new Set(["common", "uncommon", "rare"]) : new Set(["common", "uncommon"]);
  const relicPool = RELICS.filter((relic) => rarityWhitelist.has(relic.rarity) && !ownedIds.has(relic.id));
  const picked = pickUniqueItems(relicPool, Math.max(count + 1, 4));
  return picked.sort((left, right) => (RARITY_SCORE[right.rarity] || 0) - (RARITY_SCORE[left.rarity] || 0)).slice(0, count);
};

const createPlayEventState = async (node, run = null) => {
  const kind = node.type === "rest" ? "campfire" : node.type;
  if (kind === "campfire") {
    return createCampfireEvent(run?.player || null, run?.act || 1);
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

const createPlayShopPotions = (run, count = 2) => {
  const currentPotions = run?.potions || [];
  const canBuy = currentPotions.length < MAX_POTIONS;
  if (!canBuy) return [];
  const pool = [...POTIONS];
  const chosen = [];
  while (pool.length > 0 && chosen.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
};

const createPlayShopState = async (run) => {
  const ascensionLevel = run?.ascensionLevel || 0;
  const act = run?.act || 1;
  const cards = createPlayShopCards(run, 4).map((card) => ({
    ...card,
    price: scaleShopPrice(card.rarity === "rare" ? 74 : card.rarity === "uncommon" ? 56 : 42, ascensionLevel)
  }));
  const relics = createPlayShopRelics(run, 3).map((relic) => ({
    ...relic,
    price: scaleShopPrice(relic.rarity === "rare" ? 112 : relic.rarity === "uncommon" ? 92 : 72, ascensionLevel)
  }));
  const potions = createPlayShopPotions(run, 2).map((potion) => ({
    ...potion,
    price: scaleShopPrice(potion.rarity === "uncommon" ? 48 : 32, ascensionLevel)
  }));
  return {
    cards,
    relics,
    potions,
    services: [
      { id: "heal", label: act >= 2 ? "Restore 20 HP" : "Restore 15 HP", amount: act >= 2 ? 20 : 15, price: scaleShopPrice(act >= 2 ? 30 : 24, ascensionLevel) },
      { id: "remove", label: "Remove a card", price: scaleShopPrice(55, ascensionLevel) }
    ]
  };
};

module.exports = {
  createPlayRewardCardOptions,
  createPlayEventState,
  createPlayShopState
};
