const { generateMap } = require("./map");
const { resolveNode } = require("./nodeResolver");
const { getStartingNodes, selectStartingNode, moveToNode } = require("./traversal");

const attachMapToRun = (run, balanceOverrides = {}) => ({
  ...run,
  map: {
    ...generateMap({}, balanceOverrides),
    currentNodeId: null
  }
});

const listAvailableNodes = (run) => {
  if (!run.map || !Array.isArray(run.map.nodes)) {
    return [];
  }

  if (run.map.currentNodeId === null) {
    return getStartingNodes(run.map);
  }

  const currentNode = run.map.nodes.find((node) => node.id === run.map.currentNodeId);
  if (!currentNode) {
    return [];
  }

  return run.map.nodes.filter((node) => currentNode.next.includes(node.id));
};

const enterNode = (run, nodeId, balanceOverrides = {}) => {
  const currentNodeId = run.map.currentNodeId;
  const selection = currentNodeId === null
    ? selectStartingNode(run.map, nodeId)
    : moveToNode(run.map, currentNodeId, nodeId);

  if (selection.rejected) {
    return {
      run,
      rejected: true,
      reason: currentNodeId === null ? "Invalid starting node" : "Invalid move"
    };
  }

  const node = run.map.nodes.find((candidate) => candidate.id === selection.currentNodeId || candidate.id === selection.selectedNodeId);
  const resolved = resolveNode({
    node,
    player: run.player,
    balanceOverrides
  });

  return {
    rejected: false,
    run: {
      ...run,
      map: {
        ...run.map,
        currentNodeId: node.id
      },
      combat: resolved.combat
    },
    resolutionState: resolved.state
  };
};

module.exports = {
  attachMapToRun,
  listAvailableNodes,
  enterNode
};
