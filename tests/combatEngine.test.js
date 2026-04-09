const { createCard } = require("../src/card");
const { executeCardEffect } = require("../src/combatEngine");

describe("combatEngine", () => {
  it("resolves ordered multi-step effects deterministically", () => {
    const card = createCard({
      id: "ordered_test",
      name: "Ordered Test",
      cost: 1,
      type: "skill",
      effects: [
        { type: "damage", amount: 4 },
        { type: "draw", amount: 2 },
        { type: "energy", amount: 1 },
        { type: "hex", amount: 2 },
        { type: "block", amount: 5 },
        { type: "exhaust_hand" }
      ]
    });
    const state = {
      player: { health: 80, block: 1, energy: 2, charged: false },
      enemy: { health: 30, hex: 0 },
      drawCount: 0,
      exhaustedThisTurn: 0
    };

    const next = executeCardEffect(card, state);

    expect(next).toEqual({
      player: { health: 80, block: 6, energy: 3, charged: false },
      enemy: { health: 26, hex: 2 },
      drawCount: 2,
      exhaustedThisTurn: 0,
      exhaustFromHand: true
    });
    expect(state).toEqual({
      player: { health: 80, block: 1, energy: 2, charged: false },
      enemy: { health: 30, hex: 0 },
      drawCount: 0,
      exhaustedThisTurn: 0
    });
  });

  it("evaluates nested conditional branches from current combat state", () => {
    const card = createCard({
      id: "conditional_test",
      name: "Conditional Test",
      cost: 1,
      type: "attack",
      effects: [
        { type: "damage", amount: 5 },
        {
          type: "conditional",
          condition: { kind: "enemy_hexed" },
          then: [
            { type: "damage", amount: 4 },
            {
              type: "conditional",
              condition: { kind: "player_charged" },
              then: [{ type: "energy", amount: 2 }],
              else: [{ type: "block", amount: 3 }]
            }
          ],
          else: [{ type: "draw", amount: 1 }]
        }
      ]
    });

    const plain = executeCardEffect(card, {
      player: { health: 80, block: 0, energy: 1, charged: false },
      enemy: { health: 25, hex: 0 }
    });
    const chargedHexed = executeCardEffect(card, {
      player: { health: 80, block: 0, energy: 1, charged: true },
      enemy: { health: 25, hex: 2 }
    });

    expect(plain.enemy.health).toBe(20);
    expect(plain.drawCount).toBe(1);
    expect(plain.player.block || 0).toBe(0);
    expect(chargedHexed.enemy.health).toBe(16);
    expect(chargedHexed.player.energy).toBe(3);
    expect(chargedHexed.player.block || 0).toBe(0);
  });

  it("keeps keyword-rich target-sensitive card metadata intact for renderer-facing consumers", () => {
    const card = createCard({
      id: "targeted_test",
      name: "Targeted Test",
      cost: 2,
      type: "attack",
      effects: [{ type: "damage", amount: 8 }],
      keywords: [
        { key: "Hex", label: "Hex" },
        { key: "Draw", label: "Draw" }
      ],
      previewTarget: "enemy",
      emitVisual: ["targeting", "hit"]
    });

    expect(card.keywords).toEqual([
      { key: "Hex", label: "Hex" },
      { key: "Draw", label: "Draw" }
    ]);
    expect(card.previewTarget).toBe("enemy");
    expect(card.emitVisual).toEqual(["targeting", "hit"]);
  });

  it("fails safely for unsupported effect definitions", () => {
    const card = createCard({
      id: "unsupported_test",
      name: "Unsupported Test",
      cost: 0,
      type: "skill",
      effects: [
        { type: "draw", amount: 1 },
        { type: "unknown_effect", amount: 99 }
      ]
    });
    const state = {
      player: { health: 80, block: 0, energy: 3 },
      enemy: { health: 20, hex: 0 },
      drawCount: 0
    };

    const next = executeCardEffect(card, state);

    expect(next).toEqual({
      player: { health: 80, block: 0, energy: 3 },
      enemy: { health: 20, hex: 0 },
      drawCount: 1
    });
  });
});
