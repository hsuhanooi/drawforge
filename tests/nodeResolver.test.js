const { resolveNode } = require("../src/nodeResolver");

describe("node resolution", () => {
  it("starts a combat encounter when entering a combat node", () => {
    const node = { id: "r0c0", type: "combat", row: 0, col: 0 };
    const player = { health: 80 };

    const result = resolveNode({ node, player });

    expect(result.state).toBe("combat");
    expect(result.combat).not.toBeNull();
    expect(result.combat.state).toBe("active");
  });

  it("returns an event payload for event nodes", () => {
    const node = { id: "r1c1", type: "event", row: 1, col: 1 };
    const player = { health: 80 };

    const result = resolveNode({ node, player });

    expect(result.state).toBe("event");
    expect(result.event).toHaveProperty("kind");
    expect(Array.isArray(result.event.options)).toBe(true);
  });
});
