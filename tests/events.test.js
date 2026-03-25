const { createEventForNode } = require("../src/events");

describe("event variety", () => {
  it("creates multiple deterministic event templates", () => {
    const shrine = createEventForNode({ id: "r1c2", row: 1, col: 2 });
    const forge = createEventForNode({ id: "r1c0", row: 1, col: 0 });
    const camp = createEventForNode({ id: "r1c1", row: 1, col: 1 });

    expect(shrine.kind).toBe("shrine");
    expect(forge.kind).toBe("forge");
    expect(camp.kind).toBe("camp");
  });

  it("includes options with meaningful effects", () => {
    const event = createEventForNode({ id: "r1c0", row: 1, col: 0 });
    const effects = event.options.map((option) => option.effect);

    expect(effects.length).toBeGreaterThan(0);
    expect(effects.some((effect) => ["heal", "relic", "gold", "reward_cards", "remove", "add_card"].includes(effect))).toBe(true);
  });
});
