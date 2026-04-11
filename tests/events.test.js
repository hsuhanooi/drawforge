const { createEventForNode, createCampfireEvent, findChainEvent } = require("../src/events");

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
  it("returns campfire kind with heal, smith, fortify, remove, and leave options", () => {
    const event = createCampfireEvent();

    expect(event.kind).toBe("campfire");
    expect(typeof event.title).toBe("string");
    const effects = event.options.map((o) => o.effect);
    expect(effects).toContain("heal");
    expect(effects).toContain("smith");
    expect(effects).toContain("max_health_up");
    expect(effects).toContain("remove");
    expect(effects).toContain("leave");
  });

  it("injects chain event when ferryman_paid flag is set in act 2", () => {
    const node = { id: "r2c0", row: 2, col: 0, act: 2 };
    const event = createEventForNode(node, { ferryman_paid: true }, []);

    expect(event.title).toBe("The Return Crossing");
    expect(Array.isArray(event.options)).toBe(true);
    expect(event.options.length).toBeGreaterThan(0);
    expect(event.chainFlag).toBe("ferryman_paid");
  });

  it("does not inject chain event if flag is not set", () => {
    const node = { id: "r2c0", row: 2, col: 0, act: 2 };
    const event = createEventForNode(node, {}, []);

    expect(event.title).not.toBe("The Return Crossing");
  });

  it("does not inject chain event if already used", () => {
    const node = { id: "r2c0", row: 2, col: 0, act: 2 };
    const event = createEventForNode(node, { ferryman_paid: true }, ["ferryman_paid"]);

    expect(event.title).not.toBe("The Return Crossing");
  });

  it("findChainEvent returns null when no flags are set", () => {
    expect(findChainEvent(2, {}, [])).toBeNull();
  });

  it("findChainEvent returns chain when flag set and act matches", () => {
    const chain = findChainEvent(2, { devil_bargained: true }, []);
    expect(chain).not.toBeNull();
    expect(chain.flag).toBe("devil_bargained");
  });

  it("scales the campfire heal option from player max health", () => {
    const event = createCampfireEvent({ health: 30, maxHealth: 90 });
    const healOption = event.options.find((option) => option.effect === "heal");

    expect(healOption.amount).toBe(24);
    expect(healOption.label).toContain("24 HP");
    expect(healOption.description).toContain("60 missing HP");
  });

  it("makes smith and fortify feel more informed for later acts", () => {
    const event = createCampfireEvent({ health: 80, maxHealth: 80, deck: ["strike", "parasite", "defend"] }, 3);
    const smithOption = event.options.find((option) => option.effect === "smith");
    const fortifyOption = event.options.find((option) => option.effect === "max_health_up");
    const removeOption = event.options.find((option) => option.effect === "remove");

    expect(smithOption.description).toContain("2 cards are ready to upgrade");
    expect(fortifyOption.amount).toBe(8);
    expect(fortifyOption.label).toContain("+8 max HP");
    expect(removeOption.description).toContain("3-card deck");
  });
});
