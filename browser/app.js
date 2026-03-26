/* eslint-env browser */
(() => {
  const STORAGE_KEY = "drawforge.run";

  async function loadBundleMeta() {
    try {
      const response = await fetch('/meta.json', { cache: 'no-store' });
      if (!response.ok) return;
      const meta = await response.json();
      const versionEl = document.getElementById('app-version');
      if (versionEl) {
        versionEl.textContent = `${meta.version} • ${meta.shortSha}`;
        versionEl.title = `app.js sha256 ${meta.appJsSha256}`;
      }
    } catch (error) {
      // Ignore meta fetch errors; the app can still run.
    }
  }
  const DEFAULT_PLAYER_HEALTH = 80;
  const DEFAULT_PLAYER_GOLD = 99;
  const DEFAULT_PLAYER_ENERGY = 3;
  const DEFAULT_STARTER_DECK = [
    "strike", "strike", "strike", "strike", "strike",
    "defend", "defend", "defend", "defend", "defend"
  ];

  const CARD_LIBRARY = {
    strike: { id: "strike", name: "Strike", cost: 1, type: "attack", rarity: "common", damage: 6 },
    defend: { id: "defend", name: "Defend", cost: 1, type: "skill", rarity: "common", block: 5 },
    bash: { id: "bash", name: "Bash", cost: 2, type: "attack", rarity: "common", damage: 8 },
    barrier: { id: "barrier", name: "Barrier", cost: 2, type: "skill", rarity: "common", block: 8 },
    quick_strike: { id: "quick_strike", name: "Quick Strike", cost: 0, type: "attack", rarity: "common", damage: 4 },
    focus: { id: "focus", name: "Focus", cost: 1, type: "skill", rarity: "common", energyGain: 1 },
    volley: { id: "volley", name: "Volley", cost: 1, type: "attack", rarity: "common", damage: 5, draw: 1 },
    surge: { id: "surge", name: "Surge", cost: 0, type: "skill", rarity: "uncommon", energyGain: 2, exhaust: true },
    hex: { id: "hex", name: "Hex", cost: 1, type: "skill", rarity: "uncommon", hex: 1, exhaust: true },
    punish: { id: "punish", name: "Punish", cost: 1, type: "attack", rarity: "uncommon", damage: 6, bonusVsHex: 4 },
    burnout: { id: "burnout", name: "Burnout", cost: 1, type: "attack", rarity: "uncommon", damage: 6, bonusVsExhaust: 6 },
    crackdown: { id: "crackdown", name: "Crackdown", cost: 2, type: "attack", rarity: "uncommon", damage: 8, bonusVsHex: 6 },
    momentum: { id: "momentum", name: "Momentum", cost: 1, type: "skill", rarity: "uncommon", block: 5, draw: 1, bonusBlockIfHighEnergy: 2 },
    wither: { id: "wither", name: "Wither", cost: 1, type: "skill", rarity: "uncommon", damage: 3, hex: 1 },
    siphon_ward: { id: "siphon_ward", name: "Siphon Ward", cost: 1, type: "skill", rarity: "uncommon", block: 4, bonusBlockIfHexed: 4 },
    detonate_sigil: { id: "detonate_sigil", name: "Detonate Sigil", cost: 2, type: "attack", rarity: "uncommon", damage: 7, bonusVsHex: 10 },
    lingering_curse: { id: "lingering_curse", name: "Lingering Curse", cost: 1, type: "skill", rarity: "uncommon", hex: 2, exhaust: true },
    mark_of_ruin: { id: "mark_of_ruin", name: "Mark of Ruin", cost: 1, type: "skill", rarity: "common", hex: 1, draw: 1 },
    hexblade: { id: "hexblade", name: "Hexblade", cost: 1, type: "attack", rarity: "common", damage: 7, hex: 1 },
    reapers_clause: { id: "reapers_clause", name: "Reaper's Clause", cost: 2, type: "attack", rarity: "uncommon", damage: 10, costReduceIfHexed: 1 },
    fire_sale: { id: "fire_sale", name: "Fire Sale", cost: 0, type: "skill", rarity: "common", exhaustFromHand: true, draw: 2 },
    cremate: { id: "cremate", name: "Cremate", cost: 1, type: "skill", rarity: "common", exhaustFromHand: true, block: 6 },
    grave_fuel: { id: "grave_fuel", name: "Grave Fuel", cost: 1, type: "skill", rarity: "rare", energyPerExhausted: true },
    brand_the_soul: { id: "brand_the_soul", name: "Brand the Soul", cost: 1, type: "skill", rarity: "uncommon", hex: 1, exhaustFromHand: true },
    harvester: { id: "harvester", name: "Harvester", cost: 1, type: "attack", rarity: "rare", damage: 4, bonusVsHexedOrExhausted: 4 },
    charge_up: { id: "charge_up", name: "Charge Up", cost: 1, type: "skill", rarity: "common", setCharged: true, draw: 1 },
    arc_lash: { id: "arc_lash", name: "Arc Lash", cost: 1, type: "attack", rarity: "common", damage: 7, drawIfCharged: 1 },
    blood_pact: { id: "blood_pact", name: "Blood Pact", cost: 0, type: "skill", rarity: "rare", selfDamage: 3, energyGain: 2, draw: 1 },
    spite_shield: { id: "spite_shield", name: "Spite Shield", cost: 1, type: "skill", rarity: "uncommon", block: 6, hex: 1 }
  };

  const RELICS = [
    { id: "iron_core", name: "Iron Core", description: "+5 max health and heal 5 immediately", rarity: "common" },
    { id: "feather_charm", name: "Feather Charm", description: "+15 gold immediately", rarity: "common" },
    { id: "ember_ring", name: "Ember Ring", description: "Start each combat with +1 energy", rarity: "common" },
    { id: "bone_token", name: "Bone Token", description: "Heal 3 after each combat victory", rarity: "common" },
    { id: "rusted_buckler", name: "Rusted Buckler", description: "Start each combat with 4 Block", rarity: "common" },
    { id: "quickened_loop", name: "Quickened Loop", description: "Draw 1 additional card on the first turn of each combat", rarity: "common" },
    { id: "worn_grimoire", name: "Worn Grimoire", description: "The first time you apply Hex each combat, apply +1 additional Hex", rarity: "uncommon" },
    { id: "coal_pendant", name: "Coal Pendant", description: "The first card you Exhaust each combat draws 1 card", rarity: "uncommon" },
    { id: "hex_nail", name: "Hex Nail", description: "Attack cards deal +2 damage to Hexed enemies", rarity: "uncommon" },
    { id: "cinder_box", name: "Cinder Box", description: "Whenever you Exhaust a card, gain 2 Block", rarity: "uncommon" },
    { id: "volt_shard", name: "Volt Shard", description: "When you become Charged, gain 1 Block and draw 1", rarity: "uncommon" },
    { id: "merchant_ledger", name: "Merchant's Ledger", description: "Card rewards after combat offer 1 extra choice", rarity: "uncommon" },
    { id: "sigil_engine", name: "Sigil Engine", description: "When an enemy first reaches 3+ Hex in a combat, deal 8 damage to it", rarity: "rare" },
    { id: "time_locked_seal", name: "Time-Locked Seal", description: "The first card you play each turn that costs 1 or less costs 0", rarity: "rare" },
    { id: "phoenix_ash", name: "Phoenix Ash", description: "Once per run, if you would die, survive at 1 HP instead", rarity: "rare" }
  ];

  const EVENT_TEMPLATES = [
    {
      id: "shrine",
      text: "A quiet shrine offers healing, a relic, or a chance to refine your deck.",
      createOptions: (node) => [
        { id: "heal", label: "Recover 10 health", effect: "heal" },
        { id: "relic", label: `Take ${RELICS[(node.row + node.col) % RELICS.length].name}`, effect: "relic", relic: RELICS[(node.row + node.col) % RELICS.length] },
        { id: "remove", label: "Enter card removal", effect: "remove" }
      ]
    },
    {
      id: "forge",
      text: "An old forge lets you sharpen your deck with a free reward card or extra gold.",
      createOptions: () => [
        { id: "gold", label: "Take 20 gold", effect: "gold", amount: 20 },
        { id: "card", label: "Take a forged card reward", effect: "reward_cards", cards: createRewardCardOptions(3) },
        { id: "remove", label: "Burn away a weak card", effect: "remove" }
      ]
    },
    {
      id: "camp",
      text: "A roadside camp gives you time to recover or prepare for the next fight.",
      createOptions: () => [
        { id: "heal", label: "Recover 12 health", effect: "heal", amount: 12 },
        { id: "surge", label: "Add Surge to your deck", effect: "add_card", card: createCardFromId("surge") },
        { id: "hex", label: "Add Hex to your deck", effect: "add_card", card: createCardFromId("hex") },
        { id: "momentum", label: "Add Momentum to your deck", effect: "add_card", card: createCardFromId("momentum") }
      ]
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createCardFromId(cardId) {
    const card = CARD_LIBRARY[cardId];
    if (!card) {
      throw new Error(`Unknown card id: ${cardId}`);
    }
    return { ...card };
  }

  function pickUniqueItems(items, count) {
    const pool = [...items];
    const chosen = [];
    while (pool.length > 0 && chosen.length < count) {
      const index = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(index, 1)[0]);
    }
    return chosen;
  }

  function createRewardCardOptions(count = 3) {
    const ids = [
      "bash", "barrier", "quick_strike", "focus", "volley",
      "surge", "hex", "punish", "burnout", "crackdown", "momentum", "wither",
      "siphon_ward", "detonate_sigil", "lingering_curse",
      "mark_of_ruin", "hexblade", "reapers_clause", "fire_sale", "cremate",
      "grave_fuel", "brand_the_soul", "harvester", "charge_up", "arc_lash",
      "blood_pact", "spite_shield"
    ];
    return pickUniqueItems(ids, count).map((cardId) => createCardFromId(cardId));
  }

  function shuffleCards(cards) {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function buildRowTypeSelections(rows, columns) {
    const selections = new Map();
    for (let row = 0; row < rows; row += 1) {
      if (row === rows - 1 || row === rows - 2) {
        continue;
      }
      const cols = Array.from({ length: columns }, (_, index) => index);
      const events = row > 0 ? new Set(pickUniqueItems(cols, 1)) : new Set();
      const nonEventCols = cols.filter((col) => !events.has(col));
      const elites = row > 0 && row % 2 === 0 && row < rows - 2 ? new Set(pickUniqueItems(nonEventCols, 1)) : new Set();
      selections.set(row, { events, elites });
    }
    return selections;
  }

  function getNodeType(row, col, rows, rowTypeSelections = {}) {
    if (row === rows - 1) return "boss";
    if (row === rows - 2) return "elite";
    if (rowTypeSelections.events && rowTypeSelections.events.has(col)) return "event";
    if (rowTypeSelections.elites && rowTypeSelections.elites.has(col)) return "elite";
    return "combat";
  }

  function createEnemyForNode(node) {
    if (node.type === "elite") {
      return {
        id: "cultist_captain",
        name: "Cultist Captain",
        health: 45,
        damage: 9,
        rewardGold: 25,
        intents: [
          { type: "attack", value: 9, label: "Heavy attack for 9" },
          { type: "buff", value: 2, label: "Rally: gain +2 future damage" },
          { type: "attack", value: 11, label: "Heavy attack for 11" }
        ]
      };
    }
    if (node.type === "boss") {
      return {
        id: "spire_guardian",
        name: "Spire Guardian",
        health: 70,
        damage: 12,
        rewardGold: 50,
        intents: [
          { type: "attack", value: 12, label: "Crush for 12" },
          { type: "block", value: 10, label: "Fortify: gain 10 block" },
          { type: "multi_attack", value: 4, hits: 3, label: "Barrage: 3x4" }
        ]
      };
    }
    const enemies = [
      {
        id: "slime",
        name: "Slime",
        health: 30,
        damage: 6,
        rewardGold: 12,
        intents: [
          { type: "attack", value: 6, label: "Slam for 6" },
          { type: "block", value: 6, label: "Harden: gain 6 block" }
        ]
      },
      {
        id: "fangling",
        name: "Fangling",
        health: 26,
        damage: 7,
        rewardGold: 12,
        intents: [
          { type: "multi_attack", value: 3, hits: 2, label: "Flurry: 2x3" },
          { type: "attack", value: 8, label: "Pounce for 8" }
        ]
      },
      {
        id: "mossling",
        name: "Mossling",
        health: 34,
        damage: 5,
        rewardGold: 12,
        intents: [
          { type: "buff", value: 2, label: "Grow: gain +2 future damage" },
          { type: "attack", value: 7, label: "Vine lash for 7" }
        ]
      }
    ];
    return enemies[(node.row + node.col) % enemies.length];
  }

  function resolveEnemyIntent(enemy, turnNumber = 0) {
    const intents = enemy.intents && enemy.intents.length > 0
      ? enemy.intents
      : [{ type: "attack", value: enemy.damage, label: `Attack for ${enemy.damage}` }];
    return intents[turnNumber % intents.length];
  }

  function generateMap({ rows = 5, columns = 3 } = {}) {
    const rowTypeSelections = buildRowTypeSelections(rows, columns);
    const nodes = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        nodes.push({ id: `r${row}c${col}`, row, col, type: getNodeType(row, col, rows, rowTypeSelections.get(row) || {}), next: [] });
      }
    }
    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (let row = 0; row < rows - 1; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const nextCols = [col];
        if (col > 0) nextCols.push(col - 1);
        if (col < columns - 1) nextCols.push(col + 1);
        byId.get(`r${row}c${col}`).next = nextCols.map((nextCol) => `r${row + 1}c${nextCol}`);
      }
    }
    return { rows, columns, nodes, currentNodeId: null };
  }

  function startNewRun() {
    const [bonusCard] = createRewardCardOptions(1);
    return {
      state: "in_progress",
      player: { health: DEFAULT_PLAYER_HEALTH, gold: DEFAULT_PLAYER_GOLD, deck: [...DEFAULT_STARTER_DECK, bonusCard.id] },
      relics: [],
      phoenix_used: false,
      combat: null,
      pendingRewards: null,
      event: null,
      map: generateMap()
    };
  }

  function validateRun(run) {
    if (!run || typeof run !== "object") throw new Error("Saved run must be an object");
    if (!run.player || !Array.isArray(run.player.deck)) throw new Error("Saved run player deck is invalid");
    if (!run.map || !Array.isArray(run.map.nodes)) throw new Error("Saved run map data is invalid");
    return run;
  }

  function saveRun(run) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  }

  function loadRun() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No saved run found");
    return validateRun(JSON.parse(raw));
  }

  function getStartingNodes(map) {
    return map.nodes.filter((node) => node.row === 0);
  }

  function listAvailableNodes(run) {
    if (run.pendingRewards || run.event || (run.combat && run.combat.state === "active")) return [];
    if (run.map.currentNodeId === null) return getStartingNodes(run.map);
    const currentNode = run.map.nodes.find((node) => node.id === run.map.currentNodeId);
    if (!currentNode) return [];
    return run.map.nodes.filter((node) => currentNode.next.includes(node.id));
  }

  function drawCards(combat, count) {
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
  }

  function getEnergyBonus(run) {
    return (run.relics || []).some((relic) => relic.id === "ember_ring") ? 1 : 0;
  }

  function hasRelic(run, id) {
    return (run.relics || []).some((r) => r.id === id);
  }

  function startCombat(run, node) {
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
  }

  function createVictoryRewards(nodeType, nodeId = "r0c0", run = null) {
    const merchantBonus = run && hasRelic(run, "merchant_ledger") ? 1 : 0;
    const cardCount = 3 + merchantBonus;

    if (nodeType === "elite") {
      const relicPool = RELICS.filter((r) => r.rarity === "common" || r.rarity === "uncommon");
      return {
        cards: createRewardCardOptions(cardCount),
        gold: 25,
        relic: null,
        relics: pickUniqueItems(relicPool, 3),
        removeCard: true
      };
    }

    const bossRelicPool = RELICS.filter((r) => r.rarity === "uncommon" || r.rarity === "rare");
    const relicIndex = nodeId.length % bossRelicPool.length;
    return {
      cards: createRewardCardOptions(cardCount),
      gold: nodeType === "boss" ? 50 : 12,
      relic: nodeType === "boss" ? bossRelicPool[relicIndex] : null,
      relics: [],
      removeCard: false
    };
  }

  function createEventState(node) {
    const template = EVENT_TEMPLATES[(node.row + node.col) % EVENT_TEMPLATES.length];
    return {
      id: `event-${node.id}`,
      kind: template.id,
      text: template.text,
      options: template.createOptions(node)
    };
  }

  function enterNode(run, nodeId) {
    const node = run.map.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("Node not found");
    if (run.map.currentNodeId === null && node.row !== 0) throw new Error("Invalid starting node");
    if (run.map.currentNodeId !== null) {
      const currentNode = run.map.nodes.find((candidate) => candidate.id === run.map.currentNodeId);
      if (!currentNode || !currentNode.next.includes(nodeId)) throw new Error("Invalid move");
    }

    const nextRun = { ...run, map: { ...run.map, currentNodeId: nodeId }, pendingRewards: null, event: null };
    if (["combat", "elite", "boss"].includes(node.type)) {
      nextRun.combat = startCombat(run, node);
      return nextRun;
    }
    if (node.type === "event") {
      nextRun.combat = null;
      nextRun.event = createEventState(node);
      return nextRun;
    }
    return nextRun;
  }

  function applyVictory(run, combat) {
    const rewards = createVictoryRewards(combat.nodeType, run.map.currentNodeId || "r0c0", run);
    const boneTokenHeal = hasRelic(run, "bone_token") ? 3 : 0;
    return {
      ...run,
      player: { ...run.player, health: combat.player.health + boneTokenHeal, gold: run.player.gold + rewards.gold },
      combat,
      pendingRewards: rewards
    };
  }

  function playCardAtIndex(combat, handIndex, run = null) {
    const card = combat.hand[handIndex];
    if (!card) throw new Error("Card not found in hand");
    if (combat.turn !== "player") throw new Error("It is not the player's turn");

    // Effective cost (costReduceIfHexed reduces cost by 1 if enemy is hexed)
    let effectiveCost = card.costReduceIfHexed && (combat.enemy.hex || 0) > 0
      ? Math.max(0, card.cost - card.costReduceIfHexed)
      : card.cost;

    // Time-Locked Seal: first card costing 1 or less each turn costs 0
    if (run && hasRelic(run, "time_locked_seal") && !combat.seal_used_this_turn && effectiveCost <= 1) {
      effectiveCost = 0;
    }

    if (combat.player.energy < effectiveCost) throw new Error("Not enough energy");

    let next = clone(combat);

    // Mark seal as used this turn (for any card with cost ≤ 1, whether or not it was discounted)
    if (run && hasRelic(run, "time_locked_seal") && !next.seal_used_this_turn && card.cost <= 1) {
      next.seal_used_this_turn = true;
    }

    next.player.energy -= effectiveCost;
    next.hand.splice(handIndex, 1);

    if (card.damage || card.bonusVsHex || card.bonusVsExhaust || card.bonusVsHexedOrExhausted) {
      const hexBonus = (next.enemy.hex || 0) > 0 && card.bonusVsHex ? card.bonusVsHex : 0;
      const exhaustBonus = (next.exhaustPile || []).length > 0 && card.bonusVsExhaust ? card.bonusVsExhaust : 0;
      const harvesterHexBonus = (next.enemy.hex || 0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
      const harvesterExhaustBonus = (next.exhaustedThisTurn || 0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
      // Hex Nail: attack cards deal +2 damage to hexed enemies
      const hexNailBonus = run && hasRelic(run, "hex_nail") && card.type === "attack" && (next.enemy.hex || 0) > 0 ? 2 : 0;
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
      const hexAmount = card.hex + (run && hasRelic(run, "worn_grimoire") && !next.grimoire_used ? 1 : 0);
      if (run && hasRelic(run, "worn_grimoire") && !next.grimoire_used && card.hex > 0) {
        next.grimoire_used = true;
      }
      next.enemy.hex = (next.enemy.hex || 0) + hexAmount;
      // Sigil Engine: first time enemy reaches 3+ hex, deal 8 damage
      if (run && hasRelic(run, "sigil_engine") && !next.sigil_fired && (next.enemy.hex || 0) >= 3) {
        const sigBlocked = Math.min(next.enemy.block || 0, 8);
        next.enemy.block = (next.enemy.block || 0) - sigBlocked;
        next.enemy.health -= (8 - sigBlocked);
        next.sigil_fired = true;
      }
    }
    if (card.setCharged) {
      next.player.charged = true;
      // Volt Shard: when becoming Charged, gain 1 block and draw 1
      if (run && hasRelic(run, "volt_shard")) {
        next.player.block += 1;
        next = drawCards(next, 1);
      }
    }
    if (card.draw) next = drawCards(next, card.draw);
    if (card.drawIfCharged && next.player.charged) next = drawCards(next, card.drawIfCharged);
    if (card.energyIfCharged && next.player.charged) next.player.energy += card.energyIfCharged;

    // exhaustFromHand: exhaust a random card from the current hand (after removal of played card)
    if (card.exhaustFromHand && next.hand.length > 0) {
      const randomIndex = Math.floor(Math.random() * next.hand.length);
      const exhausted = next.hand.splice(randomIndex, 1)[0];
      next.exhaustPile = [...(next.exhaustPile || []), exhausted];
      next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
      // Coal Pendant: first exhaust each combat draws 1 card
      if (run && hasRelic(run, "coal_pendant") && !next.coal_pendant_used) {
        next = drawCards(next, 1);
        next.coal_pendant_used = true;
      }
      // Cinder Box: gain 2 block per exhaust
      if (run && hasRelic(run, "cinder_box")) {
        next.player.block += 2;
      }
    }

    if (card.exhaust) {
      next.exhaustPile = [...(next.exhaustPile || []), card];
      next.exhaustedThisTurn = (next.exhaustedThisTurn || 0) + 1;
      // Coal Pendant: first exhaust each combat draws 1 card
      if (run && hasRelic(run, "coal_pendant") && !next.coal_pendant_used) {
        next = drawCards(next, 1);
        next.coal_pendant_used = true;
      }
      // Cinder Box: gain 2 block per exhaust
      if (run && hasRelic(run, "cinder_box")) {
        next.player.block += 2;
      }
    }
    else {
      next.discardPile = [...(next.discardPile || []), card];
    }

    if (next.enemy.health <= 0) {
      next.enemy.health = 0;
      next.state = "victory";
      next.turn = null;
    }

    return next;
  }

  function applyEnemyIntent(combat, intent) {
    if (!intent) {
      return combat;
    }

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
        if (next.player.health <= 0) {
          break;
        }
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
  }

  function resolveEndTurn(combat, run) {
    if (combat.state !== "active") return combat;

    let next = applyEnemyIntent(combat, combat.enemyIntent);
    next.player.block = 0;
    next.player.energy = DEFAULT_PLAYER_ENERGY + getEnergyBonus(run);
    next.player.charged = false;
    next.exhaustedThisTurn = 0;
    next.firstTurn = false;
    next.seal_used_this_turn = false;

    if (next.player.health <= 0) {
      // Phoenix Ash: survive death once per run at 1 HP
      if (run && hasRelic(run, "phoenix_ash") && !run.phoenix_used) {
        next.player.health = 1;
        run.phoenix_used = true;
      }
      else {
        next.state = "defeat";
        next.turn = null;
        next.enemyIntent = null;
        return next;
      }
    }

    next.discardPile = [...(next.discardPile || []), ...(next.hand || [])];
    next.hand = [];

    next.turn = "player";
    next.enemyTurnNumber = (combat.enemyTurnNumber || 0) + 1;
    next.enemyIntent = resolveEnemyIntent(next.enemy, next.enemyTurnNumber);
    next = drawCards(next, 5);
    return next;
  }

  function applyRelic(run, relic) {
    const nextRun = { ...run, relics: [...(run.relics || []), relic], player: { ...run.player } };
    if (relic.id === "iron_core") nextRun.player.health += 5;
    if (relic.id === "feather_charm") nextRun.player.gold += 15;
    // All other relics have no immediate acquisition effect; they trigger during combat or post-combat
    return nextRun;
  }

  function describeCard(card) {
    const parts = [];
    if (card.rarity) parts.push(`[${card.rarity}]`);
    if (card.cost !== undefined) parts.push(`Cost ${card.cost}`);
    if (card.costReduceIfHexed) parts.push(`(costs ${card.costReduceIfHexed} less if Hexed)`);
    if (card.damage) parts.push(`Dmg ${card.damage}`);
    if (card.block) parts.push(`Block ${card.block}`);
    if (card.draw) parts.push(`Draw ${card.draw}`);
    if (card.energyGain) parts.push(`+${card.energyGain} energy`);
    if (card.energyPerExhausted) parts.push("+1 energy per exhausted this turn");
    if (card.hex) parts.push(`Hex ${card.hex}`);
    if (card.bonusVsHex) parts.push(`+${card.bonusVsHex} vs Hex`);
    if (card.bonusVsExhaust) parts.push(`+${card.bonusVsExhaust} vs Exhaust`);
    if (card.bonusVsHexedOrExhausted) parts.push(`+${card.bonusVsHexedOrExhausted} if Hexed, +${card.bonusVsHexedOrExhausted} if Exhausted this turn`);
    if (card.bonusBlockIfHighEnergy) parts.push(`+${card.bonusBlockIfHighEnergy} block if 2+ energy`);
    if (card.bonusBlockIfHexed) parts.push(`+${card.bonusBlockIfHexed} block vs Hexed`);
    if (card.setCharged) parts.push("Become Charged");
    if (card.drawIfCharged) parts.push(`Draw ${card.drawIfCharged} if Charged`);
    if (card.selfDamage) parts.push(`Lose ${card.selfDamage} HP`);
    if (card.exhaustFromHand) parts.push("Exhaust a random card from hand");
    if (card.exhaust) parts.push("Exhaust");
    return parts.join(" • ");
  }

  function finishNode(run) {
    const currentNode = run.map.nodes.find((n) => n.id === run.map.currentNodeId);
    const isBossNode = currentNode && currentNode.type === "boss";
    return {
      ...run,
      combat: null,
      pendingRewards: null,
      event: null,
      state: isBossNode ? "won" : "in_progress"
    };
  }

  function afterCardSelection(run) {
    if (run.pendingRewards && run.pendingRewards.removeCard) {
      return { ...run, pendingRewards: { cards: [], gold: 0, relic: null, relics: [], removeCard: true } };
    }
    return finishNode(run);
  }

  function claimCardReward(run, card) {
    return afterCardSelection({
      ...run,
      player: { ...run.player, deck: [...run.player.deck, card.id] }
    });
  }

  function claimRelicFromChoices(run, relic) {
    // Elite flow: pick one of 3 relics, then move to card selection phase
    const updated = applyRelic(run, relic);
    return { ...updated, pendingRewards: { ...updated.pendingRewards, relics: [] } };
  }

  function claimRelicReward(run, relic) {
    return afterCardSelection(applyRelic(run, relic));
  }

  function skipRewards(run) {
    return afterCardSelection(run);
  }

  function claimEventOption(run, option) {
    let nextRun = { ...run, event: null };
    if (option.effect === "heal") {
      nextRun = { ...nextRun, player: { ...nextRun.player, health: nextRun.player.health + (option.amount || 10) } };
    }
    if (option.effect === "relic") {
      nextRun = applyRelic(nextRun, option.relic);
    }
    if (option.effect === "gold") {
      nextRun = { ...nextRun, player: { ...nextRun.player, gold: nextRun.player.gold + option.amount } };
    }
    if (option.effect === "reward_cards") {
      nextRun = { ...nextRun, pendingRewards: { cards: option.cards, gold: 0, relic: null, removeCard: false } };
    }
    if (option.effect === "add_card") {
      nextRun = { ...nextRun, player: { ...nextRun.player, deck: [...nextRun.player.deck, option.card.id] } };
    }
    if (option.effect === "remove") {
      nextRun = { ...nextRun, pendingRewards: { cards: [], gold: 0, relic: null, removeCard: true } };
    }
    return nextRun;
  }

  function removeCardFromDeck(run, cardId) {
    const index = run.player.deck.indexOf(cardId);
    if (index === -1) return run;

    return finishNode({
      ...run,
      player: {
        ...run.player,
        deck: [...run.player.deck.slice(0, index), ...run.player.deck.slice(index + 1)]
      }
    });
  }

  const elements = {
    status: document.getElementById("status"),
    runState: document.getElementById("run-state"),
    playerHealth: document.getElementById("player-health"),
    playerGold: document.getElementById("player-gold"),
    deckCount: document.getElementById("deck-count"),
    currentNode: document.getElementById("current-node"),
    combatState: document.getElementById("combat-state"),
    relicCount: document.getElementById("relic-count"),
    relicList: document.getElementById("relic-list"),
    deckList: document.getElementById("deck-list"),
    rawState: document.getElementById("raw-state"),
    mapActions: document.getElementById("map-actions"),
    handActions: document.getElementById("hand-actions"),
    rewardActions: document.getElementById("reward-actions"),
    rewardSummary: document.getElementById("reward-summary"),
    removalActions: document.getElementById("removal-actions"),
    combatPlayerHealth: document.getElementById("combat-player-health"),
    combatPlayerBlock: document.getElementById("combat-player-block"),
    combatPlayerEnergy: document.getElementById("combat-player-energy"),
    combatEnemyHealth: document.getElementById("combat-enemy-health"),
    combatEnemyBlock: document.getElementById("combat-enemy-block"),
    combatEnemyHex: document.getElementById("combat-enemy-hex"),
    combatEnemyIntent: document.getElementById("combat-enemy-intent"),
    drawPileCount: document.getElementById("draw-pile-count"),
    discardPileCount: document.getElementById("discard-pile-count"),
    exhaustPileCount: document.getElementById("exhaust-pile-count"),
    combatTurn: document.getElementById("combat-turn"),
    endStateCard: document.getElementById("end-state-card"),
    endStateText: document.getElementById("end-state-text"),
    combatSection: document.querySelector("section.combat"),
    rewardsSection: document.querySelector("section.rewards")
  };

  let currentRun = startNewRun();
  let removalModeOpen = false;

  function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.style.color = isError ? "#fca5a5" : "#93c5fd";
  }

  function renderMap() {
    elements.mapActions.innerHTML = "";
    const availableNodes = listAvailableNodes(currentRun);
    if (availableNodes.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = currentRun.pendingRewards || currentRun.event ? "Resolve the current reward/event to continue." : "No available map moves.";
      elements.mapActions.appendChild(empty);
      return;
    }

    availableNodes.forEach((node) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `Node ${node.id}<br />${node.type.toUpperCase()}<br />Row ${node.row}, Col ${node.col}`;
      button.addEventListener("click", () => {
        try {
          currentRun = enterNode(currentRun, node.id);
          render();
          setStatus(`Entered ${node.id} (${node.type}).`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      elements.mapActions.appendChild(button);
    });
  }

  function renderCombat() {
    const combat = currentRun.combat;
    elements.handActions.innerHTML = "";
    if (!combat) {
      elements.combatPlayerHealth.textContent = "-";
      elements.combatPlayerBlock.textContent = "-";
      elements.combatPlayerEnergy.textContent = "-";
      elements.combatEnemyHealth.textContent = "-";
      elements.combatEnemyBlock.textContent = "-";
      elements.combatEnemyHex.textContent = "-";
      elements.combatEnemyIntent.textContent = "-";
      elements.drawPileCount.textContent = "-";
      elements.discardPileCount.textContent = "-";
      elements.exhaustPileCount.textContent = "-";
      elements.combatTurn.textContent = "-";
      return;
    }

    elements.combatPlayerHealth.textContent = String(combat.player.health);
    elements.combatPlayerBlock.textContent = String(combat.player.block);
    elements.combatPlayerEnergy.textContent = String(combat.player.energy);
    elements.combatEnemyHealth.textContent = `${combat.enemy.name} (${combat.enemy.health})`;
    elements.combatEnemyBlock.textContent = String(combat.enemy.block || 0);
    elements.combatEnemyHex.textContent = String(combat.enemy.hex || 0);
    elements.combatEnemyIntent.textContent = combat.state === "active"
      ? (combat.enemyIntent ? combat.enemyIntent.label : `Attack for ${combat.enemy.damage}`)
      : combat.state;
    elements.drawPileCount.textContent = String(combat.drawPile.length);
    elements.discardPileCount.textContent = String(combat.discardPile.length);
    elements.exhaustPileCount.textContent = String((combat.exhaustPile || []).length);
    elements.combatTurn.textContent = combat.turn || combat.state;

    combat.hand.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `${card.name}<br />${describeCard(card)}`;
      button.disabled = combat.turn !== "player" || combat.state !== "active";
      button.addEventListener("click", () => {
        try {
          const updatedCombat = playCardAtIndex(currentRun.combat, index, currentRun);
          currentRun = updatedCombat.state === "victory"
            ? applyVictory(currentRun, updatedCombat)
            : { ...currentRun, combat: updatedCombat, player: { ...currentRun.player, health: updatedCombat.player.health } };
          render();
          setStatus(updatedCombat.state === "victory"
            ? `Won the ${updatedCombat.enemy.name} fight.`
            : `${card.name} played. Draw: ${updatedCombat.drawPile.length}, discard: ${updatedCombat.discardPile.length}.`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      elements.handActions.appendChild(button);
    });

    if (combat.state === "active") {
      const debugButton = document.createElement("button");
      debugButton.className = "node-button";
      debugButton.textContent = "[debug] Skip combat";
      debugButton.addEventListener("click", () => {
        const wonCombat = { ...currentRun.combat, state: "victory", enemy: { ...currentRun.combat.enemy, health: 0 } };
        currentRun = applyVictory(currentRun, wonCombat);
        render();
        setStatus(`[debug] Skipped combat against ${wonCombat.enemy.name}.`);
      });
      elements.handActions.appendChild(debugButton);
    }
  }

  function renderRewards() {
    elements.rewardActions.innerHTML = "";

    if (currentRun.event) {
      elements.rewardSummary.textContent = `[${currentRun.event.kind}] ${currentRun.event.text}`;
      currentRun.event.options.forEach((option) => {
        const button = document.createElement("button");
        button.className = "node-button";

        if (option.card) {
          button.innerHTML = `${option.label}<br />${describeCard(option.card)}`;
        }
        else if (option.cards) {
          button.innerHTML = `${option.label}<br />${option.cards
            .map((card) => `${card.name} (${describeCard(card)})`)
            .join('<br />')}`;
        }
        else if (option.relic) {
          button.innerHTML = `${option.label}<br />${option.relic.description}`;
        }
        else {
          button.textContent = option.label;
        }

        button.addEventListener("click", () => {
          currentRun = claimEventOption(currentRun, option);
          render();
          setStatus(`Resolved event: ${option.label}.`);
        });
        elements.rewardActions.appendChild(button);
      });
      return;
    }

    if (!currentRun.pendingRewards) {
      elements.rewardSummary.textContent = "No pending rewards.";
      return;
    }

    const { cards, gold, relic, relics = [], removeCard } = currentRun.pendingRewards;
    const inRemovalPhase = removeCard && cards.length === 0 && !relic && relics.length === 0;

    if (inRemovalPhase) {
      elements.rewardSummary.textContent = "Elite bonus: remove a card from your deck below, or skip removal.";
      return;
    }

    // Elite phase 1: pick one of 3 relics
    if (relics.length > 0) {
      elements.rewardSummary.textContent = `Elite rewards: +${gold} gold. Choose a relic, then pick a card reward.`;
      relics.forEach((r) => {
        const button = document.createElement("button");
        button.className = "node-button";
        button.innerHTML = `${r.name}<br />${r.description}<br />Claim relic`;
        button.addEventListener("click", () => {
          currentRun = claimRelicFromChoices(currentRun, r);
          render();
          setStatus(`Claimed relic ${r.name}.`);
        });
        elements.rewardActions.appendChild(button);
      });
      return;
    }

    elements.rewardSummary.textContent = removeCard
      ? `Elite rewards: pick a card reward or skip, then remove a card below.`
      : `Victory rewards: +${gold} gold${relic ? ` and optional relic ${relic.name}` : ""}. Pick exactly one reward or skip.`;

    cards.forEach((card) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `${card.name}<br />${describeCard(card)}<br />Add to deck`;
      button.addEventListener("click", () => {
        currentRun = claimCardReward(currentRun, card);
        render();
        setStatus(`Added ${card.name} to deck.`);
      });
      elements.rewardActions.appendChild(button);
    });

    if (relic) {
      const relicButton = document.createElement("button");
      relicButton.className = "node-button";
      relicButton.innerHTML = `${relic.name}<br />${relic.description}<br />Claim relic`;
      relicButton.addEventListener("click", () => {
        currentRun = claimRelicReward(currentRun, relic);
        render();
        setStatus(`Claimed relic ${relic.name}.`);
      });
      elements.rewardActions.appendChild(relicButton);
    }

    const skipButton = document.createElement("button");
    skipButton.className = "node-button";
    skipButton.textContent = "Skip rewards";
    skipButton.addEventListener("click", () => {
      currentRun = skipRewards(currentRun);
      render();
      setStatus("Skipped reward selection.");
    });
    elements.rewardActions.appendChild(skipButton);
  }

  function renderRemoval() {
    elements.removalActions.innerHTML = "";
    if (!(removalModeOpen || (currentRun.pendingRewards && currentRun.pendingRewards.removeCard))) return;

    [...new Set(currentRun.player.deck)].forEach((cardId) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.textContent = `Remove ${cardId}`;
      button.addEventListener("click", () => {
        currentRun = removeCardFromDeck(currentRun, cardId);
        removalModeOpen = false;
        render();
        setStatus(`Removed ${cardId} from the deck.`);
      });
      elements.removalActions.appendChild(button);
    });

    const skipRemovalButton = document.createElement("button");
    skipRemovalButton.className = "node-button";
    skipRemovalButton.textContent = "Skip removal";
    skipRemovalButton.addEventListener("click", () => {
      currentRun = finishNode(currentRun);
      removalModeOpen = false;
      render();
      setStatus("Skipped card removal.");
    });
    elements.removalActions.appendChild(skipRemovalButton);
  }

  function renderEndState() {
    elements.endStateCard.classList.remove("win", "loss");
    if (currentRun.state === "won") {
      elements.endStateCard.classList.add("win");
      elements.endStateText.textContent = "Victory. You cleared the boss and finished the run.";
      return;
    }
    if (currentRun.state === "lost") {
      elements.endStateCard.classList.add("loss");
      elements.endStateText.textContent = "Defeat. The run has ended, but you can start a new one immediately.";
      return;
    }
    elements.endStateText.textContent = "Your run is still in progress.";
  }

  function render() {
    elements.runState.textContent = currentRun.state;
    elements.playerHealth.textContent = String(currentRun.player.health);
    elements.playerGold.textContent = String(currentRun.player.gold);
    elements.deckCount.textContent = String(currentRun.player.deck.length);
    elements.currentNode.textContent = currentRun.map.currentNodeId || "none";
    elements.combatState.textContent = currentRun.combat ? currentRun.combat.state : "not in combat";
    elements.relicCount.textContent = String((currentRun.relics || []).length);
    elements.deckList.innerHTML = "";
    elements.relicList.innerHTML = "";

    currentRun.player.deck.forEach((cardId) => {
      const item = document.createElement("li");
      item.textContent = cardId;
      elements.deckList.appendChild(item);
    });

    (currentRun.relics || []).forEach((relic) => {
      const item = document.createElement("li");
      item.textContent = `${relic.name} — ${relic.description}`;
      elements.relicList.appendChild(item);
    });

    const hasCombat = !!(currentRun.combat && currentRun.combat.state === "active");
    const hasRewards = !!(currentRun.pendingRewards || currentRun.event);
    elements.combatSection.classList.toggle("hidden", !hasCombat);
    elements.rewardsSection.classList.toggle("hidden", !hasRewards);

    renderMap();
    renderCombat();
    renderRewards();
    renderRemoval();
    renderEndState();
    elements.rawState.textContent = JSON.stringify(currentRun, null, 2);
  }

  document.getElementById("new-run-button").addEventListener("click", () => {
    currentRun = startNewRun();
    removalModeOpen = false;
    render();
    setStatus("Started a fresh run with varied map content.");
  });

  document.getElementById("save-run-button").addEventListener("click", () => {
    saveRun(currentRun);
    setStatus("Run saved to localStorage.");
  });

  document.getElementById("toggle-removal-button").addEventListener("click", () => {
    removalModeOpen = !removalModeOpen;
    render();
    setStatus(removalModeOpen ? "Card removal view opened." : "Card removal view closed.");
  });

  document.getElementById("load-run-button").addEventListener("click", () => {
    try {
      currentRun = loadRun();
      render();
      setStatus("Run loaded from localStorage.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("clear-save-button").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    setStatus("Saved run cleared.");
  });

  document.getElementById("end-turn-button").addEventListener("click", () => {
    if (!currentRun.combat) {
      setStatus("No active combat.", true);
      return;
    }
    const resolvedIntentLabel = currentRun.combat.enemyIntent?.label || "Enemy acted.";
    const nextCombat = resolveEndTurn(currentRun.combat, currentRun);
    currentRun = nextCombat.state === "defeat"
      ? { ...currentRun, combat: nextCombat, player: { ...currentRun.player, health: 0 }, state: "lost" }
      : { ...currentRun, combat: nextCombat, player: { ...currentRun.player, health: nextCombat.player.health } };
    render();
    setStatus(nextCombat.state === "defeat"
      ? `${resolvedIntentLabel} You were defeated. Start a new run to try again.`
      : nextCombat.reshuffled
        ? `${resolvedIntentLabel} Then the discard pile was reshuffled into the draw pile.`
        : resolvedIntentLabel);
  });

  loadBundleMeta();
  render();
})();
