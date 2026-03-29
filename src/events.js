// @ts-check

/** @typedef {import("./domain").EventState} EventState */
/** @typedef {import("./domain").MapNode} MapNode */

const { createRelicReward } = require("./relics");
const { createRewardOptions } = require("./rewards");
const {
  focusCardDefinition,
  volleyCardDefinition
} = require("./cards");

/**
 * @param {Pick<MapNode, "id" | "row" | "col">} node
 * @returns {EventState}
 */
const createEventForNode = (node) => {
  const index = (node.row + node.col) % 3;

  if (index === 0) {
    return {
      id: `event-${node.id}`,
      kind: "shrine",
      text: "A quiet shrine offers healing, a relic, or a chance to refine your deck.",
      options: [
        { id: "heal", effect: "heal", amount: 10 },
        { id: "relic", effect: "relic", relic: createRelicReward(node.row + node.col) },
        { id: "remove", effect: "remove" }
      ]
    };
  }

  if (index === 2 && (node.row + node.col) % 5 === 0) {
    return {
      id: `event-${node.id}`,
      kind: "devil",
      text: "A hooded figure offers power at a price. 'Gold for suffering — a fair trade.'",
      options: [
        { id: "deal", effect: "gold_for_curse", amount: 50, curseId: "parasite", label: "Accept: gain 50 gold, receive Parasite" },
        { id: "refuse", effect: "leave", label: "Refuse" }
      ]
    };
  }

  if (index === 1) {
    return {
      id: `event-${node.id}`,
      kind: "forge",
      text: "An old forge lets you sharpen your deck with a free reward card or extra gold.",
      options: [
        { id: "gold", effect: "gold", amount: 20 },
        { id: "reward_cards", effect: "reward_cards", cards: createRewardOptions(3) },
        { id: "remove", effect: "remove" }
      ]
    };
  }

  return {
    id: `event-${node.id}`,
    kind: "camp",
    text: "A roadside camp gives you time to recover or prepare for the next fight.",
    options: [
      { id: "heal", effect: "heal", amount: 12 },
      { id: "focus", effect: "add_card", card: focusCardDefinition() },
      { id: "volley", effect: "add_card", card: volleyCardDefinition() }
    ]
  };
};

const createCampfireEvent = () => ({
  id: "campfire",
  kind: "campfire",
  text: "Rest or prepare for the road ahead.",
  options: [
    { id: "heal", effect: "heal", amount: 20 },
    { id: "smith", effect: "smith" },
    { id: "remove", effect: "remove" },
    { id: "leave", effect: "leave" }
  ]
});

module.exports = {
  createEventForNode,
  createCampfireEvent
};
