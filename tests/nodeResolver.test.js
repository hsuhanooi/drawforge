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

  it("returns a campfire event for rest nodes", () => {
    const node = { id: "r2c1", type: "rest", row: 2, col: 1 };
    const player = { health: 80 };

    const result = resolveNode({ node, player });

    expect(result.state).toBe("rest");
    expect(result.combat).toBeNull();
    expect(result.event.kind).toBe("campfire");
    expect(result.event.options.some((o) => o.effect === "heal")).toBe(true);
    expect(result.event.options.some((o) => o.effect === "smith")).toBe(true);
    expect(result.event.options.some((o) => o.effect === "remove")).toBe(true);
  });

  it("returns a shop state for shop nodes", () => {
    const node = { id: "r3c0", type: "shop", row: 3, col: 0 };
    const player = { health: 80 };

    const result = resolveNode({ node, player });

    expect(result.state).toBe("shop");
    expect(result.combat).toBeNull();
  });
});
