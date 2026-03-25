const getStartingNodes = (map) => map.nodes.filter((node) => node.row === 0);

const selectStartingNode = (map, nodeId) => {
  const node = map.nodes.find((candidate) => candidate.id === nodeId);
  if (!node || node.row !== 0) {
    return {
      map,
      selectedNodeId: null,
      rejected: true
    };
  }

  return {
    map,
    selectedNodeId: nodeId,
    rejected: false
  };
};

const moveToNode = (map, currentNodeId, nextNodeId) => {
  const currentNode = map.nodes.find((node) => node.id === currentNodeId);
  if (!currentNode || !currentNode.next.includes(nextNodeId)) {
    return {
      map,
      currentNodeId,
      rejected: true
    };
  }

  return {
    map,
    currentNodeId: nextNodeId,
    rejected: false
  };
};

module.exports = {
  getStartingNodes,
  selectStartingNode,
  moveToNode
};
