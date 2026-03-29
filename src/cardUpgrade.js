// @ts-check

/**
 * Map from base card ID → upgraded card ID.
 * Only cards listed here can be upgraded at a campfire Smith.
 */
const UPGRADE_ID_MAP = {
  strike: "strike_plus",
  defend: "defend_plus",
  bash: "bash_plus",
  barrier: "barrier_plus",
  quick_strike: "quick_strike_plus",
  hex: "hex_plus",
  surge: "surge_plus",
  war_cry: "war_cry_plus",
  fortify: "fortify_plus",
  expose: "expose_plus",
  enfeeble: "enfeeble_plus"
};

/**
 * Catalog entries for all upgraded card variants.
 * These are merged into cardCatalog but do not appear in the reward pool.
 */
const UPGRADED_CARD_ENTRIES = [
  { id: "strike_plus", name: "Strike+", cost: 1, type: "attack", rarity: "common", archetype: "Starter", effectText: "Dmg 9.", status: "implemented", upgrade: true, damage: 9 },
  { id: "defend_plus", name: "Defend+", cost: 1, type: "skill", rarity: "common", archetype: "Starter", effectText: "Block 8.", status: "implemented", upgrade: true, block: 8 },
  { id: "bash_plus", name: "Bash+", cost: 1, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 10.", status: "implemented", upgrade: true, damage: 10 },
  { id: "barrier_plus", name: "Barrier+", cost: 2, type: "skill", rarity: "common", archetype: "Legacy", effectText: "Block 12.", status: "implemented", upgrade: true, block: 12 },
  { id: "quick_strike_plus", name: "Quick Strike+", cost: 0, type: "attack", rarity: "common", archetype: "Legacy", effectText: "Dmg 6.", status: "implemented", upgrade: true, damage: 6 },
  { id: "hex_plus", name: "Hex+", cost: 0, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Apply Hex 1. Exhaust.", status: "implemented", upgrade: true, hex: 1, exhaust: true },
  { id: "surge_plus", name: "Surge+", cost: 0, type: "skill", rarity: "uncommon", archetype: "Legacy", effectText: "Gain 2 Energy. Exhaust.", status: "implemented", upgrade: true, energyGain: 2, exhaust: true },
  { id: "war_cry_plus", name: "War Cry+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Strength", effectText: "Gain 3 Strength.", status: "implemented", upgrade: true, applyStrength: 3 },
  { id: "fortify_plus", name: "Fortify+", cost: 1, type: "skill", rarity: "uncommon", archetype: "Dexterity", effectText: "Gain 3 Dexterity.", status: "implemented", upgrade: true, applyDexterity: 3 },
  { id: "expose_plus", name: "Expose+", cost: 0, type: "skill", rarity: "common", archetype: "Debuff", effectText: "Apply 2 Vulnerable.", status: "implemented", upgrade: true, applyVulnerable: 2 },
  { id: "enfeeble_plus", name: "Enfeeble+", cost: 2, type: "skill", rarity: "uncommon", archetype: "Debuff", effectText: "Apply 4 Weak + 2 Vulnerable.", status: "implemented", upgrade: true, applyWeak: 4, applyVulnerable: 2 }
];

/**
 * Returns the upgraded card ID for a given base card ID, or null if not upgradeable.
 * @param {string} cardId
 * @returns {string | null}
 */
const getUpgradedId = (cardId) => UPGRADE_ID_MAP[cardId] || null;

/**
 * Returns true if the given card ID has a known upgrade.
 * @param {string} cardId
 * @returns {boolean}
 */
const canUpgrade = (cardId) => cardId in UPGRADE_ID_MAP;

/**
 * Returns a new deck array with the card at deckIndex replaced by its upgraded version.
 * Throws if the card cannot be upgraded.
 * @param {string[]} deck
 * @param {number} deckIndex
 * @returns {string[]}
 */
const upgradeCardInDeck = (deck, deckIndex) => {
  const cardId = deck[deckIndex];
  if (cardId === undefined) throw new Error("Card not found in deck");
  const upgradedId = getUpgradedId(cardId);
  if (!upgradedId) throw new Error(`Card "${cardId}" cannot be upgraded`);
  return [...deck.slice(0, deckIndex), upgradedId, ...deck.slice(deckIndex + 1)];
};

module.exports = {
  UPGRADE_ID_MAP,
  UPGRADED_CARD_ENTRIES,
  getUpgradedId,
  canUpgrade,
  upgradeCardInDeck
};
