const { startNewRun } = require("./run");
const { generateMap } = require("./map");
const { createEventForNode } = require("./events");
const { selectStartingNode, moveToNode } = require("./traversal");

const createBrowserRun = (balanceOverrides = {}) => ({
  ...startNewRun(balanceOverrides),
  relics: [],
  phoenix_used: false,
  pendingRewards: null,
  event: null,
  map: {
    ...generateMap({}, balanceOverrides),
    currentNodeId: null
  }
});

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
  createBrowserRun,
  enterBrowserNode
};
