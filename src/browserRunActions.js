const { startNewRun } = require("./run");
const { generateMap } = require("./map");
const { createEventForNode } = require("./events");
const { selectStartingNode, moveToNode } = require("./traversal");
const { RELICS } = require("./relics");
const { clampAscensionLevel, applyAscensionToDeck } = require("./ascension");

const ARCHETYPE_RELICS = {
  hex_witch: "hex_crown",
  ashen_knight: "ashen_idol",
  static_duelist: "storm_diadem"
};

const ARCHETYPES = {
  hex_witch: {
    id: "hex_witch",
    name: "Hex Witch",
    deck: ["strike", "strike", "strike", "defend", "defend",
      "mark_of_ruin", "hexblade", "feast_on_weakness", "deep_hex", "black_seal"]
  },
  ashen_knight: {
    id: "ashen_knight",
    name: "Ashen Knight",
    deck: ["strike", "strike", "strike", "defend", "defend",
      "overclock", "fire_sale", "scorch_nerves", "cinder_rush", "hollow_ward"]
  },
  static_duelist: {
    id: "static_duelist",
    name: "Static Duelist",
    deck: ["strike", "strike", "strike", "defend", "defend",
      "charge_up", "arc_lash", "static_guard", "capacitor", "guarded_pulse"]
  }
};

const createBrowserRun = (balanceOverrides = {}, options = {}) => {
  const base = startNewRun(balanceOverrides, options);
  const ascensionLevel = clampAscensionLevel(options.ascensionLevel || 0);
  return {
    ...base,
    ascensionLevel,
    relics: [],
    phoenix_used: false,
    pendingRewards: null,
    event: null,
    pendingDeckChoice: true,
    player: { ...base.player, deck: [] },
    map: {
      ...generateMap({ seed: base.seed, act: base.act }, balanceOverrides),
      currentNodeId: null
    }
  };
};

const chooseArchetype = (run, archetypeId) => {
  const arch = ARCHETYPES[archetypeId];
  if (!arch) throw new Error(`Unknown archetype: ${archetypeId}`);
  const relicId = ARCHETYPE_RELICS[archetypeId];
  const starterRelic = relicId ? RELICS.find((r) => r.id === relicId) : null;
  return {
    ...run,
    archetype: archetypeId,
    archetypeName: arch.name,
    pendingDeckChoice: false,
    player: { ...run.player, deck: applyAscensionToDeck(arch.deck, run.ascensionLevel) },
    relics: starterRelic ? [starterRelic] : (run.relics || [])
  };
};

const enterBrowserNode = (run, nodeId) => {
  const node = run.map.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  const traversalResult = run.map.currentNodeId === null
    ? selectStartingNode(run.map, nodeId)
    : moveToNode(run.map, run.map.currentNodeId, nodeId);

  if (traversalResult.rejected) {
    throw new Error(run.map.currentNodeId === null ? "Invalid starting node" : "Invalid move");
  }

  const prevStats = run.stats || {};
  const nextStats = {
    ...prevStats,
    shopVisits: prevStats.shopVisits || 0,
    restVisits: prevStats.restVisits || 0,
    eventVisits: prevStats.eventVisits || 0
  };

  if (node.type === "shop") {
    nextStats.shopVisits += 1;
  } else if (node.type === "rest") {
    nextStats.restVisits += 1;
  } else if (node.type === "event") {
    nextStats.eventVisits += 1;
  }

  const nextRun = {
    ...run,
    stats: nextStats,
    map: {
      ...run.map,
      currentNodeId: traversalResult.currentNodeId || traversalResult.selectedNodeId
    },
    pendingRewards: null,
    event: null,
    combat: null
  };

  if (node.type === "event") {
    nextRun.event = createEventForNode(node);
  }

  return {
    run: nextRun,
    node
  };
};

module.exports = {
  ARCHETYPES,
  createBrowserRun,
  chooseArchetype,
  enterBrowserNode
};
