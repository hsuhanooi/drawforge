# Drawforge Combat Presentation Layer

## Goal
Coordinate selection, targeting, preview, animation, VFX, and combat feedback in the browser without letting presentation own combat rules.

## Current shape

- `browser/play.js` is the presentation coordinator.
- `currentRun.combat` from the server remains the source of truth for combat rules and outcomes.
- Local browser state only tracks transient UI concerns like selected hand index, tooltip visibility, pile modals, preview chips, and delayed presentation beats.
- `window.AnimEngine` receives presentation events after rule resolution, not before.

## Responsibilities

### Presentation-owned
- Selected card and pending target affordances
- Preview chips for damage, block, draw, energy, and status outcomes
- Hover, focus, keyboard, and drag interaction state
- Combat log rendering
- Floating feedback text and VFX hooks
- Optional presentation delays for phase and victory beats

### Rules-owned
- Card legality
- Energy spending
- Damage, block, draw, exhaust, discard, and reshuffle outcomes
- Enemy intent advancement
- Turn transitions
- Victory, defeat, and post-combat rewards

## Safety rules

- Browser actions resolve through server-backed endpoints before UI feedback is finalized.
- Animations can be skipped with `?fx=off` or reduced-motion preferences without changing combat outcomes.
- Presentation hooks read combat deltas after an update instead of mutating combat state directly.
- Targeting visuals are derived from the selected card and live combat state, so they rerender cleanly after server updates.

## Evidence already in place

- Shared card selection and targeting state drive preview chips and enemy highlight affordances.
- Combat delta feedback emits AnimEngine hooks for hit, block, heal, draw, discard, reshuffle, exhaust, relic trigger, and intent updates.
- Phase-transition and victory pauses now route through an optional presentation-delay helper instead of blocking rules progression.
- Thin-client regression coverage in `tests/playBundle.test.js` asserts the key presentation-only wiring.

## Follow-up boundary

If presentation complexity keeps growing, the next clean split would be to extract the browser-only selection, preview, and feedback coordinator into a dedicated module while keeping server actions and run state unchanged.
