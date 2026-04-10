const { createBrowserRun, chooseArchetype, enterBrowserNode } = require("../src/browserRunActions");

describe("browser run actions", () => {
  it("creates a browser run with pendingDeckChoice and empty deck", () => {
    const run = createBrowserRun();

    expect(run.state).toBe("in_progress");
    expect(run.ascensionLevel).toBe(0);
    expect(run.pendingDeckChoice).toBe(true);
    expect(run.player.deck.length).toBe(0);
    expect(run.map.currentNodeId).toBeNull();
    expect(Array.isArray(run.map.nodes)).toBe(true);
  });

  it("chooseArchetype populates the deck and clears pendingDeckChoice", () => {
    const run = createBrowserRun();
    const chosen = chooseArchetype(run, "hex_witch");
    expect(chosen.pendingDeckChoice).toBe(false);
    expect(chosen.archetype).toBe("hex_witch");
    expect(chosen.archetypeName).toBe("Hex Witch");
    expect(chosen.player.deck.length).toBeGreaterThan(8);
    expect(chosen.player.deck).toContain("mark_of_ruin");
  });

  it("adds the ascension curse card to the starter deck at ascension 3", () => {
    const run = createBrowserRun({}, { ascensionLevel: 3 });
    const chosen = chooseArchetype(run, "ashen_knight");

    expect(chosen.player.deck).toContain("wound");
  });

  it("chooseArchetype throws on unknown archetype", () => {
    const run = createBrowserRun();
    expect(() => chooseArchetype(run, "unknown")).toThrow("Unknown archetype");
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
