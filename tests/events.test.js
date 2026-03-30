const { createEventForNode, createCampfireEvent } = require("../src/events");

const VALID_EFFECTS = ["heal", "relic", "gold", "reward_cards", "add_card", "remove", "gold_for_curse", "leave", "max_health_up", "smith"];

describe("event structure", () => {
  it("returns an event with title, description, kind, and options", () => {
    const event = createEventForNode({ id: "r0c0", row: 0, col: 0 });

    expect(typeof event.title).toBe("string");
    expect(event.title.length).toBeGreaterThan(0);
    expect(typeof event.description).toBe("string");
    expect(event.description.length).toBeGreaterThan(0);
    expect(typeof event.kind).toBe("string");
    expect(Array.isArray(event.options)).toBe(true);
    expect(event.options.length).toBeGreaterThan(0);
  });

  it("all options have valid effect types", () => {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const event = createEventForNode({ id: `r${row}c${col}`, row, col });
        for (const option of event.options) {
          expect(VALID_EFFECTS).toContain(option.effect);
        }
      }
    }
  });

  it("add_card options include a card object with an id", () => {
    const allNodes = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        allNodes.push({ id: `r${row}c${col}`, row, col });
      }
    }
    for (const node of allNodes) {
      const event = createEventForNode(node);
      for (const option of event.options) {
        if (option.effect === "add_card") {
          expect(option.card).toBeDefined();
          expect(typeof option.card.id).toBe("string");
        }
      }
    }
  });

  it("relic options include a relic object", () => {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const event = createEventForNode({ id: `r${row}c${col}`, row, col });
        for (const option of event.options) {
          if (option.effect === "relic") {
            expect(option.relic).toBeDefined();
            expect(typeof option.relic.id).toBe("string");
          }
        }
      }
    }
  });

  it("gold_for_curse options include amount and curseId", () => {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const event = createEventForNode({ id: `r${row}c${col}`, row, col });
        for (const option of event.options) {
          if (option.effect === "gold_for_curse") {
            expect(typeof option.amount).toBe("number");
            expect(typeof option.curseId).toBe("string");
          }
        }
      }
    }
  });

  it("is deterministic — same node always returns same event kind and title", () => {
    const a = createEventForNode({ id: "r2c1", row: 2, col: 1 });
    const b = createEventForNode({ id: "r2c1", row: 2, col: 1 });

    expect(a.kind).toBe(b.kind);
    expect(a.title).toBe(b.title);
    expect(a.options.length).toBe(b.options.length);
  });

  it("different nodes produce different events across the 3x5 map", () => {
    const titles = new Set();
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const event = createEventForNode({ id: `r${row}c${col}`, row, col });
        titles.add(event.title);
      }
    }
    expect(titles.size).toBe(15);
  });
});

describe("campfire event", () => {
  it("returns campfire kind with smith, heal, remove, leave options", () => {
    const event = createCampfireEvent();

    expect(event.kind).toBe("campfire");
    expect(typeof event.title).toBe("string");
    const effects = event.options.map((o) => o.effect);
    expect(effects).toContain("heal");
    expect(effects).toContain("smith");
    expect(effects).toContain("remove");
    expect(effects).toContain("leave");
  });
});
