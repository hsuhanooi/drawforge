const { startNewRun } = require("../src/run");
const { attachMapToRun, listAvailableNodes, enterNode } = require("../src/browserTraversal");

describe("browser traversal helpers", () => {
  it("attaches a generated map to a run", () => {
    const run = attachMapToRun(startNewRun(), {
      map: { rows: 2, columns: 3 }
    });

    expect(run.map.nodes).toHaveLength(6);
    expect(run.map.currentNodeId).toBeNull();
  });

  it("lists starting nodes before a position is selected", () => {
    const run = attachMapToRun(startNewRun(), {
      map: { rows: 3, columns: 3 }
    });

    const options = listAvailableNodes(run);

    expect(options).toHaveLength(3);
    options.forEach((node) => {
      expect(node.row).toBe(0);
    });
  });

  it("enters a valid starting node and resolves its content", () => {
    const run = attachMapToRun(startNewRun(), {
      map: { rows: 3, columns: 3 }
    });

    const result = enterNode(run, "r0c1");

    expect(result.rejected).toBe(false);
    expect(result.run.map.currentNodeId).toBe("r0c1");
    expect(result.run.combat).not.toBeNull();
    expect(result.resolutionState).toBe("combat");
  });

  it("lists only connected nodes after entering the map", () => {
    const run = attachMapToRun(startNewRun(), {
      map: { rows: 3, columns: 3 }
    });
    const entered = enterNode(run, "r0c1").run;

    const options = listAvailableNodes(entered);
    const ids = options.map((node) => node.id);

    expect(ids).toEqual(expect.arrayContaining(["r1c0", "r1c1", "r1c2"]));
    expect(ids).toHaveLength(3);
  });

  it("rejects invalid movement", () => {
    const run = attachMapToRun(startNewRun(), {
      map: { rows: 3, columns: 3 }
    });
    const entered = enterNode(run, "r0c0").run;

    const result = enterNode(entered, "r2c2");

    expect(result.rejected).toBe(true);
    expect(result.reason).toBe("Invalid move");
  });
});
