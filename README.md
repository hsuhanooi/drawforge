# Drawforge

A small, test-first roguelike deckbuilder prototype for the browser, inspired by games like *Slay the Spire*.

This repo is currently focused on the **core game state and gameplay rules**, not UI polish. Most of the implemented work lives in small CommonJS modules under `src/` with Jest tests under `tests/`.

## Current status

Based on `prd.json` and `progress.txt`, the project already has:

- new run initialization
- starter deck creation
- card model + basic cards
- combat encounter setup
- energy, attack, defend, block, damage resolution
- player/enemy turn flow
- victory/defeat handling
- reward generation
- deterministic map generation + traversal
- combat node resolution
- deck inspection and card removal

The main unfinished items are:

- save current run
- load saved run
- later polish / persistence quality-of-life work

## Tech stack

- **Node / CommonJS**
- **Jest** for unit tests
- **ESLint** for linting

## Quick start

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Start the minimal browser demo:

```bash
npm start
```

Then open <http://localhost:3000>.

## Repository layout

```text
.
├── package.json        # scripts and dev dependencies
├── prd.json            # product requirements / task checklist
├── progress.txt        # append-only progress log
├── plans/              # ad hoc planning scripts/notes
├── src/                # game logic modules
└── tests/              # Jest coverage for src/
```

## High-level architecture

The repo is laid out as a set of small gameplay modules instead of one giant engine file.

### Core idea

The code mostly works by:

1. creating plain serializable state objects
2. passing them into small functions
3. returning updated state
4. verifying behavior with focused unit tests

That’s a good fit for a turn-based card game because it keeps the logic deterministic and makes save/load easier later.

## `src/` guide

### Run / top-level game state

- `src/run.js`
  - entry point for starting a new run
  - creates the initial player state and top-level run metadata

- `src/constants.js`
  - default health, gold, run states, and other shared constants

### Cards and deck

- `src/card.js`
  - card model / card construction helpers

- `src/cards.js`
  - built-in card definitions like Strike and Defend

- `src/deck.js`
  - starter deck creation and deck-related helpers

- `src/deckZones.js`
  - draw pile / hand / discard pile behavior
  - supports drawing, discarding, and reshuffling

- `src/deckView.js`
  - helpers for inspecting the current deck during a run

- `src/deckRemoval.js`
  - card removal flow helpers

### Combat

- `src/combat.js`
  - creates a combat encounter and initial combat state

- `src/combatEngine.js`
  - very small effect executor for cards

- `src/playCard.js`
  - card play flow: validate hand membership, pay energy, execute effect, move card to discard, check end state

- `src/energy.js`
  - energy initialization and card-cost enforcement

- `src/damage.js`
  - damage/block resolution logic

- `src/turns.js`
  - player turn lifecycle helpers such as refreshing energy / resetting temporary state

- `src/enemy.js`
  - deterministic enemy action behavior

- `src/combatState.js`
  - combat-end checks and victory/defeat transitions

### Map and progression

- `src/map.js`
  - deterministic map generation
  - currently creates connected rows of combat nodes

- `src/traversal.js`
  - starting node selection and legal movement between connected nodes

- `src/nodeResolver.js`
  - resolves node entry into gameplay state
  - currently starts combat when entering combat nodes

### Rewards

- `src/rewards.js`
  - post-combat reward generation and reward application

## `tests/` guide

The test layout mirrors the code layout pretty closely:

- `run.test.js` tests run initialization
- `deck*.test.js` tests deck behavior
- `combat*.test.js`, `attackCard.test.js`, `defenseCard.test.js`, `enemy.test.js`, etc. test combat rules
- `map.test.js`, `traversal.test.js`, `nodeResolver.test.js` test map progression
- `rewards.test.js` tests post-combat rewards

If you add a new gameplay module, add a matching focused test file rather than dumping everything into one huge integration test.

## How to navigate the codebase

If you’re new to the repo, read in this order:

1. `prd.json` — what the project is trying to build
2. `progress.txt` — what has already been completed
3. `src/run.js` — top-level starting state
4. `src/cards.js` + `src/deck.js` — card and starter deck basics
5. `src/combat.js` + `src/playCard.js` — core combat flow
6. `src/map.js` + `src/traversal.js` + `src/nodeResolver.js` — progression flow
7. `tests/` — the real executable spec for current behavior

## Recommended next implementation area

The clean next step is **save/load**.

Suggested order:

1. add a pure `saveRun(gameState)` serializer
2. define a storage adapter boundary so persistence stays testable
3. add `loadRun(savedState)` with validation and error handling
4. cover malformed/incomplete save data with tests

Because the repo already uses plain objects and pure-ish helpers, it is well-positioned for save/load without a major refactor.

## Contributing notes

A few conventions are already clear from the repo:

- prefer small modules over large classes
- keep state serializable
- keep gameplay logic deterministic where possible
- add tests for every meaningful feature
- update `progress.txt` when work is completed

## Browser/UI note

The PRD says the game should work in a browser for testing, and the repo now includes a **minimal browser shell** under `browser/` plus a tiny static Node server in `server.js`.

Current browser shell scope:

- start a new run
- inspect the top-level run state
- save the current run to `localStorage`
- load a saved run from `localStorage`
- clear the saved run

This is intentionally thin. It is a testing shell for the current game state, not a full combat UI yet.
