# Drawforge Combat Wireframes

Baseline low-fidelity wireframes for the current combat composition.

## Primary layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLOOR / TURN    Deck   Relics   [relic strip................................]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PLAYER PANEL                 TURN INDICATOR                ENEMY PANEL     │
│   - HP / max HP                - whose turn                  - intent        │
│   - energy pips                - short state text            - art / portrait│
│   - statuses                                                - HP / statuses  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ COMBAT LOG      PILES                     HAND AREA               END TURN    │
│ recent actions  draw / discard / exhaust  primary card surface   action CTA  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Region rules

- Hand area is the dominant interaction surface and owns the most horizontal space.
- Enemy panel stays visually opposite the player panel so targeting reads left-to-right.
- Turn indicator sits in the center lane, above the hand, so turn ownership is readable without covering cards.
- Relics live in the top HUD to stay persistent but secondary.
- Piles and combat log stay in the bottom rail, adjacent to the hand but visually quieter.
- End turn anchors the far right edge of the bottom rail to keep the action affordance stable.

## Density checks

### Hand size 3 to 10
- 3 to 5 cards: loose fan with minimal overlap.
- 6 to 8 cards: moderate overlap, hovered card rises above neighbors.
- 9 to 10 cards: compressed fan, readable through hover/focus expansion instead of wider layout.

### Relic count
- Primary strip supports at least 8 relic badges before wrapping becomes necessary.
- Tooltip and inspection overlay handle the long-tail readability problem instead of forcing oversized HUD badges.

### Enemy support
- Current baseline is one enemy centered in the enemy lane.
- Multi-enemy support can expand horizontally inside the same enemy panel lane without moving the bottom hand rail.

## Approved baseline

This wireframe matches the current playable combat screen architecture:
- top HUD for floor, turn, deck, relics
- center arena for player, turn state, enemy intent/presentation
- bottom rail for combat log, piles, hand, and end-turn control

It is the baseline composition for future presentation, art, and VFX work.
