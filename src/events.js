// @ts-check

/** @typedef {import("./domain").EventState} EventState */
/** @typedef {import("./domain").MapNode} MapNode */

const { createRelicReward } = require("./relics");
const { createRewardOptions } = require("./rewards");
const { toRenderableCard } = require("./cardCatalog");
const { canUpgrade } = require("./cardUpgrade");

const cat = (id) => toRenderableCard(id);

const EVENTS = [
  // index 0 — r0c0
  {
    id: "forgotten_shrine",
    factory: (node) => ({
      kind: "shrine",
      title: "Forgotten Shrine",
      description: "A weathered shrine hums with fading divine energy. Old incense hangs in the still air.",
      options: [
        { id: "pray", effect: "heal", amount: 12, label: "Pray: restore 12 HP" },
        { id: "offer", effect: "relic", relic: createRelicReward(node.row), label: "Offer gold: receive a relic" },
        { id: "cleanse", effect: "remove", label: "Cleanse: remove a card from your deck" }
      ]
    })
  },
  // index 1 — r4c1
  {
    id: "wandering_merchant",
    factory: () => ({
      kind: "merchant",
      title: "Wandering Merchant",
      description: "A cloaked figure spreads wares on a dusty cloth. 'Traveling light, are we?'",
      options: [
        { id: "browse", effect: "reward_cards", cards: createRewardOptions(2), label: "Browse wares: choose a card" },
        { id: "gold", effect: "gold", amount: 18, label: "Trade trinkets: gain 18 gold" },
        { id: "leave", effect: "leave", label: "Move on" }
      ]
    })
  },
  // index 2
  {
    id: "strange_altar",
    factory: () => ({
      kind: "altar",
      title: "Strange Altar",
      description: "Dark runes pulse on a stone slab. Touching it could strengthen or corrupt you.",
      options: [
        { id: "empower", effect: "max_health_up", amount: 8, label: "Empower: +8 max HP" },
        { id: "gold", effect: "gold", amount: 20, label: "Pilfer offerings: gain 20 gold" },
        { id: "corrupt", effect: "gold_for_curse", amount: 45, curseId: "decay", label: "Corrupt yourself: +45 gold, receive Decay" }
      ]
    })
  },
  // index 3 — r3c1
  {
    id: "old_forge",
    factory: () => ({
      kind: "forge",
      title: "Old Forge",
      description: "A still-hot forge stands ready. You could hone your deck or seek new arms.",
      options: [
        { id: "reward_cards", effect: "reward_cards", cards: createRewardOptions(3), label: "Seek new arms: choose a card" },
        { id: "remove", effect: "remove", label: "Smelt away: remove a card" },
        { id: "leave", effect: "leave", label: "Leave it be" }
      ]
    })
  },
  // index 4 — r2c1
  {
    id: "midnight_camp",
    factory: () => ({
      kind: "camp",
      title: "Midnight Camp",
      description: "Embers glow from a long-dead fire. You settle in and tend to your wounds.",
      options: [
        { id: "heal", effect: "heal", amount: 15, label: "Rest: recover 15 HP" },
        { id: "train", effect: "add_card", card: cat("insight"), label: "Study: add Insight to your deck" },
        { id: "leave", effect: "leave", label: "Break camp" }
      ]
    })
  },
  // index 5
  {
    id: "haunted_crossroads",
    factory: (node) => ({
      kind: "haunted",
      title: "Haunted Crossroads",
      description: "A spectral figure points down three roads. Each path promises something — at a cost.",
      options: [
        { id: "relic", effect: "relic", relic: createRelicReward(node.row + 1), label: "Follow the spirit: receive a relic" },
        { id: "deal", effect: "gold_for_curse", amount: 55, curseId: "parasite", setsFlag: "haunted_bargained", label: "Seal the deal: +55 gold, receive Parasite" },
        { id: "leave", effect: "leave", label: "Turn away" }
      ]
    })
  },
  // index 6 — r1c1
  {
    id: "glowing_crystal",
    factory: () => ({
      kind: "discovery",
      title: "Glowing Crystal",
      description: "A pulsing crystal juts from the rock face, crackling with static energy.",
      options: [
        { id: "cards", effect: "reward_cards", cards: createRewardOptions(2), label: "Channel the power: choose a card" },
        { id: "absorb", effect: "add_card", card: cat("charge_up"), label: "Absorb it: add Charge Up to your deck" },
        { id: "leave", effect: "leave", label: "Leave it alone" }
      ]
    })
  },
  // index 7 — r0c1
  {
    id: "ruined_library",
    factory: () => ({
      kind: "library",
      title: "Ruined Library",
      description: "Scorched tomes line the shelves. Most are ash — but a few hold dark secrets.",
      options: [
        { id: "hex_rite", effect: "add_card", card: cat("lingering_curse"), label: "Learn dark rites: add Lingering Curse" },
        { id: "remove", effect: "remove", label: "Burn a page: remove a card from your deck" },
        { id: "leave", effect: "leave", label: "Walk away" }
      ]
    })
  },
  // index 8 — r4c2
  {
    id: "healing_spring",
    factory: () => ({
      kind: "well",
      title: "Healing Spring",
      description: "Clear water bubbles up through the rocks, carrying a faint golden shimmer.",
      options: [
        { id: "drink", effect: "heal", amount: 20, label: "Drink deep: restore 20 HP" },
        { id: "bathe", effect: "max_health_up", amount: 5, label: "Bathe fully: +5 max HP" },
        { id: "leave", effect: "leave", label: "Leave it undisturbed" }
      ]
    })
  },
  // index 9
  {
    id: "skeleton_gambler",
    factory: () => ({
      kind: "gamble",
      title: "Skeleton Gambler",
      description: "A rattling skeleton sits at a table, bony fingers tapping a deck of cards.",
      options: [
        { id: "wager", effect: "gold_for_curse", amount: 40, curseId: "wound", label: "Wager your luck: +40 gold, receive Wound" },
        { id: "cards", effect: "reward_cards", cards: createRewardOptions(2), label: "Play a hand: choose a card" },
        { id: "leave", effect: "leave", label: "Decline" }
      ]
    })
  },
  // index 10 — r3c2
  {
    id: "corrupted_forge",
    factory: () => ({
      kind: "forge",
      title: "Corrupted Forge",
      description: "Black flames lick the anvil. Whatever is made here bears a tainted edge.",
      options: [
        { id: "remove", effect: "remove", label: "Burn the impure: remove a card" },
        { id: "cards", effect: "reward_cards", cards: createRewardOptions(3), label: "Forge in shadow: choose a card" },
        { id: "weapon", effect: "add_card", card: cat("heavy_swing"), label: "Claim the cursed blade: add Heavy Swing" }
      ]
    })
  },
  // index 11 — r2c2
  {
    id: "fire_pit",
    factory: (node) => ({
      kind: "offering",
      title: "Fire Pit",
      description: "An ancient flame burns without fuel. Something watches from within.",
      options: [
        { id: "offer", effect: "relic", relic: createRelicReward(node.row), label: "Throw in a coin: receive a relic" },
        { id: "fire", effect: "add_card", card: cat("burnout"), label: "Embrace the flame: add Burnout to your deck" },
        { id: "leave", effect: "leave", label: "Step back" }
      ]
    })
  },
  // index 12
  {
    id: "sword_shrine",
    factory: () => ({
      kind: "shrine",
      title: "Sword Shrine",
      description: "A massive blade stands embedded in stone. 'Strength comes through sacrifice.'",
      options: [
        { id: "claim", effect: "add_card", card: cat("titan_strike"), label: "Claim the blade: add Titan Strike" },
        { id: "empower", effect: "max_health_up", amount: 5, label: "Sacrifice blood: +5 max HP" },
        { id: "leave", effect: "leave", label: "Walk past" }
      ]
    })
  },
  // index 13 — r1c2
  {
    id: "dark_peddler",
    factory: () => ({
      kind: "merchant",
      title: "Dark Peddler",
      description: "A hunched figure whispers from the shadows. 'I have things... rare things.'",
      options: [
        { id: "rite", effect: "add_card", card: cat("hex"), label: "Buy forbidden rite: add Hex to your deck" },
        { id: "cards", effect: "reward_cards", cards: createRewardOptions(2), label: "Browse the black market: choose a card" },
        { id: "leave", effect: "leave", label: "Ignore them" }
      ]
    })
  },
  // index 14 — r0c2
  {
    id: "abandoned_campsite",
    factory: () => ({
      kind: "camp",
      title: "Abandoned Campsite",
      description: "Someone left in a hurry. Scattered gear and a cold fire pit remain.",
      options: [
        { id: "heal", effect: "heal", amount: 10, label: "Scavenge supplies: restore 10 HP" },
        { id: "notes", effect: "add_card", card: cat("recover"), label: "Study their notes: add Recover to your deck" },
        { id: "loot", effect: "gold", amount: 15, label: "Loot the campsite: gain 15 gold" }
      ]
    })
  },
  // index 15
  {
    id: "spirit_well",
    factory: (node) => ({
      kind: "well",
      title: "Spirit Well",
      description: "Pale light rises from the depths. Whispered voices offer vague promises.",
      options: [
        { id: "empower", effect: "max_health_up", amount: 10, label: "Accept the gift: +10 max HP" },
        { id: "relic", effect: "relic", relic: createRelicReward(node.col + 1), label: "Commune: receive a relic" },
        { id: "leave", effect: "leave", label: "Stop your ears and walk away" }
      ]
    })
  },
  // index 16
  {
    id: "crumbling_vault",
    factory: (node) => ({
      kind: "vault",
      title: "Crumbling Vault",
      description: "A cracked iron door opens to reveal scattered riches and a lone relic.",
      options: [
        { id: "gold", effect: "gold", amount: 35, label: "Grab the gold: gain 35 gold" },
        { id: "remove", effect: "remove", label: "Clear out the deadweight: remove a card" },
        { id: "relic", effect: "relic", relic: createRelicReward(node.row), label: "Take the relic: receive a relic" }
      ]
    })
  },
  // index 17
  {
    id: "hex_circle",
    factory: () => ({
      kind: "hex",
      title: "Hex Circle",
      description: "Carved runes glow faintly in a ring. Raw power radiates from the center.",
      options: [
        { id: "step_in", effect: "add_card", card: cat("deep_hex"), label: "Step inside: add Deep Hex to your deck" },
        { id: "cards", effect: "reward_cards", cards: createRewardOptions(2), label: "Observe: choose a card" },
        { id: "leave", effect: "leave", label: "Avoid it" }
      ]
    })
  },
  // index 18
  {
    id: "dueling_ghost",
    factory: () => ({
      kind: "duel",
      title: "Dueling Ghost",
      description: "A translucent warrior challenges you — not to the death, but to a test of skill.",
      options: [
        { id: "trial", effect: "reward_cards", cards: createRewardOptions(3), label: "Accept the trial: choose a card" },
        { id: "show_deck", effect: "remove", label: "Show your deck: remove a weakness" },
        { id: "leave", effect: "leave", label: "Decline the challenge" }
      ]
    })
  },
  // index 19 — r4c0
  {
    id: "blessed_fountain",
    factory: () => ({
      kind: "shrine",
      title: "Blessed Fountain",
      description: "Crystal-clear water flows from a stone basin carved with ancient blessings.",
      options: [
        { id: "drink", effect: "heal", amount: 25, label: "Drink freely: restore 25 HP" },
        { id: "bless", effect: "max_health_up", amount: 3, label: "Receive a blessing: +3 max HP" },
        { id: "leave", effect: "leave", label: "Leave it for others" }
      ]
    })
  },
  // index 20
  {
    id: "training_grounds",
    factory: () => ({
      kind: "training",
      title: "Training Grounds",
      description: "An abandoned practice yard. Dummies still stand. Your muscles remember the drills.",
      options: [
        { id: "strength", effect: "add_card", card: cat("war_cry"), label: "Train offense: add War Cry to your deck" },
        { id: "defense", effect: "add_card", card: cat("fortify"), label: "Train defense: add Fortify to your deck" },
        { id: "leave", effect: "leave", label: "You are already sharp enough" }
      ]
    })
  },
  // index 21 — r3c0
  {
    id: "devil_bargain",
    factory: () => ({
      kind: "devil",
      title: "The Devil's Bargain",
      description: "A red-eyed figure grins from the roadside. 'I can make you stronger. For a price.'",
      options: [
        { id: "deal", effect: "gold_for_curse", amount: 50, curseId: "parasite", setsFlag: "devil_bargained", label: "Deal: +50 gold, receive Parasite" },
        { id: "cards", effect: "reward_cards", cards: createRewardOptions(2), label: "Ask for power instead: choose a card" },
        { id: "leave", effect: "leave", label: "Refuse" }
      ]
    })
  },
  // index 22 — r2c0
  {
    id: "torn_spellbook",
    factory: () => ({
      kind: "discovery",
      title: "Torn Spellbook",
      description: "Pages flutter in a windless room. Two spells remain legible — take one.",
      options: [
        { id: "insight", effect: "add_card", card: cat("insight"), label: "Learn Insight" },
        { id: "plan_ahead", effect: "add_card", card: cat("plan_ahead"), label: "Learn Plan Ahead" },
        { id: "gold", effect: "gold", amount: 25, label: "Sell the pages: gain 25 gold" }
      ]
    })
  },
  // index 23
  {
    id: "offering_bowl",
    factory: (node) => ({
      kind: "offering",
      title: "Offering Bowl",
      description: "A jade bowl filled with old offerings sits on a pedestal. It hums expectantly.",
      options: [
        { id: "remove", effect: "remove", label: "Offer a burden: remove a card from your deck" },
        { id: "relic", effect: "relic", relic: createRelicReward(node.row + node.col), label: "Offer gold: receive a relic" },
        { id: "leave", effect: "leave", label: "Move on" }
      ]
    })
  },
  // index 24 — r1c0
  {
    id: "arcane_gateway",
    factory: () => ({
      kind: "mystery",
      title: "Arcane Gateway",
      description: "A shimmering portal offers passage through forbidden realms. The price of knowledge is steep.",
      options: [
        { id: "explore", effect: "reward_cards", cards: createRewardOptions(4), label: "Step through: choose from 4 cards" },
        { id: "bargain", effect: "gold_for_curse", amount: 60, curseId: "decay", label: "Bargain for passage: +60 gold, receive Decay" },
        { id: "leave", effect: "leave", label: "The risk is too great" }
      ]
    })
  },
  // index 25
  {
    id: "hollowed_knight",
    factory: () => ({
      kind: "discovery",
      title: "The Hollowed Knight",
      description: "An armored corpse blocks the path, sword still clutched in gauntleted fingers. The armor is fine work.",
      options: [
        { id: "search", effect: "gold", amount: 30, label: "Search the body: gain 30 gold" },
        { id: "absorb", effect: "max_health_up", amount: 8, label: "Wear the armor: +8 max HP" },
        { id: "leave", effect: "leave", label: "Step around it" }
      ]
    })
  },
  // index 26
  {
    id: "leech_pool",
    factory: (node) => ({
      kind: "well",
      title: "The Leech Pool",
      description: "Black water pools in a crater, faintly luminescent. Something stirs in the depths.",
      options: [
        { id: "bathe", effect: "reward_cards", cards: createRewardOptions(2), setsFlag: "leech_pool_bathed", label: "Bathe in it: choose a card (the water burns)" },
        { id: "flask", effect: "relic", relic: createRelicReward(node.row + 1), label: "Fill your flask: receive a relic" },
        { id: "leave", effect: "leave", label: "Step away from the pool" }
      ]
    })
  },
  // index 27
  {
    id: "abandoned_cache",
    factory: () => ({
      kind: "vault",
      title: "Abandoned Cache",
      description: "A hidden alcove behind a loose stone. Someone stashed supplies here and never returned.",
      options: [
        { id: "loot", effect: "gold", amount: 28, label: "Grab the gold: gain 28 gold" },
        { id: "study", effect: "remove", label: "Study their notes: remove a card from your deck" },
        { id: "leave", effect: "leave", label: "Leave it untouched" }
      ]
    })
  },
  // index 28
  {
    id: "the_tombstone",
    factory: () => ({
      kind: "shrine",
      title: "The Tombstone",
      description: "A stone marker etched with a name you almost recognize. Something about it feels like a warning.",
      options: [
        { id: "read", effect: "add_card", card: cat("brace"), label: "Read the inscription: add Brace to your deck" },
        { id: "shatter", effect: "max_health_up", amount: 8, label: "Shatter the stone: +8 max HP" },
        { id: "leave", effect: "leave", label: "Walk past in silence" }
      ]
    })
  },
  // index 29
  {
    id: "the_ferryman",
    factory: (node) => ({
      kind: "merchant",
      title: "The Ferryman",
      description: "A cloaked figure waits at a narrow bridge, hand outstretched. The river below moves wrong.",
      options: [
        { id: "pay", effect: "relic", relic: createRelicReward(node.row + 1), setsFlag: "ferryman_paid", label: "Pay the toll: receive a relic" },
        { id: "bargain", effect: "gold_for_curse", amount: 40, curseId: "wound", label: "Bargain for passage: +40 gold, receive Wound" },
        { id: "refuse", effect: "leave", label: "Find another crossing" }
      ]
    })
  },
  // index 30
  {
    id: "ritual_circle",
    factory: () => ({
      kind: "hex",
      title: "Ritual Circle",
      description: "Runes burned into the stone floor form a perfect circle, still faintly warm to the touch.",
      options: [
        { id: "complete", effect: "add_card", card: cat("ritual_collapse"), label: "Complete the ritual: add Ritual Collapse to your deck" },
        { id: "disrupt", effect: "heal", amount: 18, label: "Disrupt the circle: restore 18 HP" },
        { id: "ignore", effect: "leave", label: "Step around it" }
      ]
    })
  },
  // index 31
  {
    id: "wandering_healer",
    factory: () => ({
      kind: "camp",
      title: "Wandering Healer",
      description: "A weary figure in patched robes offers aid. Their hands glow faintly. They ask for nothing.",
      options: [
        { id: "healing", effect: "heal", amount: 22, label: "Accept their healing: restore 22 HP" },
        { id: "blessing", effect: "max_health_up", amount: 6, label: "Accept their blessing: +6 max HP" },
        { id: "cards", effect: "reward_cards", cards: createRewardOptions(2), label: "Ask for knowledge: choose a card" }
      ]
    })
  },
  // index 32
  {
    id: "echoing_chamber",
    factory: () => ({
      kind: "discovery",
      title: "Echoing Chamber",
      description: "You speak and your words return to you changed — sharper, stranger. The walls remember every strike.",
      options: [
        { id: "train", effect: "add_card", card: cat("echo_strike"), label: "Train your form: add Echo Strike to your deck" },
        { id: "meditate", effect: "max_health_up", amount: 5, label: "Meditate here: +5 max HP" },
        { id: "leave", effect: "leave", label: "The chamber unsettles you" }
      ]
    })
  }
];

// Chain event definitions — each entry has: flag (triggers it), minAct (earliest act to appear), factory
const CHAIN_EVENTS = [
  {
    flag: "ferryman_paid",
    minAct: 2,
    factory: (node) => ({
      kind: "merchant",
      title: "The Return Crossing",
      description: "The same cloaked figure waits by the bridge. 'You paid honestly. I remember.' They press something into your hand.",
      options: [
        { id: "accept", effect: "relic", relic: createRelicReward(node.row + 2), label: "Accept the gift: receive a relic" },
        { id: "gold", effect: "gold", amount: 35, label: "Take gold instead: gain 35 gold" }
      ]
    })
  },
  {
    flag: "devil_bargained",
    minAct: 2,
    factory: () => ({
      kind: "devil",
      title: "The Collector's Visit",
      description: "A red-eyed courier bows at your path. 'The master wants his due.' Their smile shows too many teeth.",
      options: [
        { id: "pay", effect: "gold", amount: -30, label: "Pay the debt: lose 30 gold" },
        { id: "refuse", effect: "add_card", card: cat("wound"), label: "Refuse: receive a Wound" }
      ]
    })
  },
  {
    flag: "haunted_bargained",
    minAct: 2,
    factory: () => ({
      kind: "haunted",
      title: "The Spirit's Return",
      description: "The spirit from the crossroads stands before you again, patient and cold. 'Our arrangement has not been forgotten.'",
      options: [
        { id: "upgrade_all", effect: "upgrade_all", label: "Accept its gift: all Wounds in your deck become Decays" },
        { id: "remove_curse", effect: "remove_curse", label: "Demand release: remove one curse from your deck" }
      ]
    })
  },
  {
    flag: "leech_pool_bathed",
    minAct: 2,
    factory: () => ({
      kind: "well",
      title: "The Residue",
      description: "Your skin still shows the marks from the pool. Others step away from you in the dark.",
      options: [
        { id: "embrace", effect: "reward_cards_rare", label: "Embrace the taint: choose a rare card" },
        { id: "cleanse", effect: "max_health_up", amount: 5, label: "Cleanse yourself: +5 max HP" }
      ]
    })
  }
];

/**
 * Check if a chain event should fire for this node given the current run flags.
 * Returns the chain event entry or null.
 * @param {number} act
 * @param {Record<string, boolean>} runFlags
 * @param {string[]} usedChainFlags
 * @returns {{ flag: string, minAct: number, factory: Function } | null}
 */
const findChainEvent = (act, runFlags, usedChainFlags = []) => {
  for (const chain of CHAIN_EVENTS) {
    if (runFlags[chain.flag] && act >= chain.minAct && !usedChainFlags.includes(chain.flag)) {
      return chain;
    }
  }
  return null;
};

/**
 * @param {Pick<MapNode, "id" | "row" | "col">} node
 * @param {Record<string, boolean>} [runFlags]
 * @param {string[]} [usedChainFlags]
 * @returns {EventState}
 */
const createEventForNode = (node, runFlags = {}, usedChainFlags = []) => {
  const act = node.act || 1;
  const chain = findChainEvent(act, runFlags, usedChainFlags);
  if (chain) {
    return { id: `chain-${chain.flag}-${node.id}`, chainFlag: chain.flag, ...chain.factory(node) };
  }
  const hash = (node.row * 11 + node.col * 7 + (node.row % 2) * 13) % EVENTS.length;
  const template = EVENTS[hash];
  return { id: `event-${node.id}`, ...template.factory(node) };
};

const createCampfireEvent = (player = null, act = 1) => {
  const health = player?.health || 70;
  const maxHealth = player?.maxHealth || health;
  const missingHealth = Math.max(0, maxHealth - health);
  const deck = Array.isArray(player?.deck) ? player.deck : [];
  const upgradeableCount = deck.filter((cardId) => canUpgrade(cardId)).length;
  const removableCount = deck.length;
  const healAmount = Math.max(12, Math.min(24, Math.round(maxHealth * 0.3)));
  const fortifyAmount = act >= 3 ? 8 : act >= 2 ? 7 : 6;

  return {
    id: "campfire",
    kind: "campfire",
    title: "Campfire",
    description: "A quiet fire gives you room to recover, refine your deck, or harden yourself for the climb.",
    options: [
      {
        id: "heal",
        effect: "heal",
        amount: healAmount,
        label: `Rest: recover ${healAmount} HP`,
        description: missingHealth > 0
          ? `Recover ${Math.min(healAmount, missingHealth)} of ${missingHealth} missing HP before the next stretch.`
          : "You are already at full health, so this is mostly safety padding for later."
      },
      {
        id: "smith",
        effect: "smith",
        label: "Smith: upgrade a card",
        description: upgradeableCount > 0
          ? `${upgradeableCount} card${upgradeableCount === 1 ? " is" : "s are"} ready to upgrade for immediate deck power.`
          : "No upgradeable cards right now, so this stop may be better spent elsewhere."
      },
      {
        id: "fortify",
        effect: "max_health_up",
        amount: fortifyAmount,
        label: `Fortify: gain +${fortifyAmount} max HP`,
        description: "Trade immediate tempo for a sturdier run and better future rests."
      },
      {
        id: "remove",
        effect: "remove",
        label: "Purge: remove a card",
        description: removableCount > 0
          ? `Remove 1 card from a ${removableCount}-card deck to tighten future draws.`
          : "No cards available to remove."
      },
      {
        id: "leave",
        effect: "leave",
        label: "Leave",
        description: "Keep moving if the fire offers nothing better."
      }
    ]
  };
};

module.exports = {
  createEventForNode,
  createCampfireEvent,
  findChainEvent
};
