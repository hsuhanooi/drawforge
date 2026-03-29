const { startNewRun } = require("./run");
const { generateMap } = require("./map");
const { createEventForNode } = require("./events");
const { selectStartingNode, moveToNode } = require("./traversal");

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

const createBrowserRun = (balanceOverrides = {}) => {
  const base = startNewRun(balanceOverrides);
  return {
    ...base,
    relics: [],
    phoenix_used: false,
    pendingRewards: null,
    event: null,
    pendingDeckChoice: true,
    player: { ...base.player, deck: [] },
    map: {
      ...generateMap({}, balanceOverrides),
      currentNodeId: null
    }
  };
};

const chooseArchetype = (run, archetypeId) => {
  const arch = ARCHETYPES[archetypeId];
  if (!arch) throw new Error(`Unknown archetype: ${archetypeId}`);
  return {
    ...run,
    archetype: archetypeId,
    archetypeName: arch.name,
    pendingDeckChoice: false,
    player: { ...run.player, deck: [...arch.deck] }
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

  const nextRun = {
    ...run,
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
