const { createBrowserRun, enterBrowserNode } = require("../src/browserRunActions");

describe("browser run actions", () => {
  it("creates a browser run from shared run + map sources", () => {
    const run = createBrowserRun();

    expect(run.state).toBe("in_progress");
    expect(run.map.currentNodeId).toBeNull();
    expect(Array.isArray(run.map.nodes)).toBe(true);
    expect(run.player.deck.length).toBeGreaterThan(10);
  });

  it("resolves event nodes from shared src/events.js", () => {
    const run = {
      ...createBrowserRun(),
      map: {
        rows: 2,
        columns: 1,
        currentNodeId: null,
        nodes: [
          { id: "r0c0", row: 0, col: 0, type: "event", next: [] }
        ]
      }
    };

    const result = enterBrowserNode(run, "r0c0");

    expect(result.run.map.currentNodeId).toBe("r0c0");
    expect(result.node.type).toBe("event");
    expect(result.run.event.kind).toBeDefined();
    expect(result.run.event.options.length).toBeGreaterThan(0);
  });

  it("rejects invalid traversal moves", () => {
    const run = {
      ...createBrowserRun(),
      map: {
        rows: 2,
        columns: 2,
        currentNodeId: "r0c0",
        nodes: [
          { id: "r0c0", row: 0, col: 0, type: "combat", next: ["r1c0"] },
          { id: "r1c0", row: 1, col: 0, type: "combat", next: [] },
          { id: "r1c1", row: 1, col: 1, type: "event", next: [] }
        ]
      }
    };

    expect(() => enterBrowserNode(run, "r1c1")).toThrow("Invalid move");
  });
});
