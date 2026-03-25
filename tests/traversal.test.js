const { generateMap } = require("../src/map");
const {
  getStartingNodes,
  selectStartingNode,
  moveToNode
} = require("../src/traversal");

describe("map traversal", () => {
  it("lists valid starting nodes and allows selection", () => {
    const map = generateMap({ rows: 3, columns: 3 });
    const starters = getStartingNodes(map);

    expect(starters).toHaveLength(3);
    starters.forEach((node) => {
      expect(node.row).toBe(0);
    });

    const chosen = selectStartingNode(map, starters[1].id);

    expect(chosen.rejected).toBe(false);
    expect(chosen.selectedNodeId).toBe(starters[1].id);
  });

  it("rejects selecting a non-starting node", () => {
    const map = generateMap({ rows: 3, columns: 3 });
    const nonStarter = map.nodes.find((node) => node.row === 1);

    const chosen = selectStartingNode(map, nonStarter.id);

    expect(chosen.rejected).toBe(true);
    expect(chosen.selectedNodeId).toBeNull();
  });

  it("allows movement only to connected nodes", () => {
    const map = generateMap({ rows: 3, columns: 3 });
    const currentNodeId = "r0c1";

    const validMove = moveToNode(map, currentNodeId, "r1c1");
    expect(validMove.rejected).toBe(false);
    expect(validMove.currentNodeId).toBe("r1c1");

    const invalidMove = moveToNode(map, currentNodeId, "r2c2");
    expect(invalidMove.rejected).toBe(true);
    expect(invalidMove.currentNodeId).toBe(currentNodeId);
  });
});
