const { resolveNode } = require("../src/nodeResolver");

describe("node resolution", () => {
  it("starts a combat encounter when entering a combat node", () => {
    const node = { id: "r0c0", type: "combat" };
    const player = { health: 80 };

    const result = resolveNode({ node, player });

    expect(result.state).toBe("combat");
    expect(result.combat).not.toBeNull();
    expect(result.combat.state).toBe("active");
  });
});
