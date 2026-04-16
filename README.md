# Drawforge

A single-player roguelike deckbuilder for the browser, inspired by *Slay the Spire*.

Start a run, pick an archetype, build your deck across three acts, fight bosses, and try to reach True Victory.

## Quick start

```bash
npm install
npm test          # 65 suites / 627 tests
npm run lint      # ESLint
npm start         # http://localhost:3000
```

GitHub Actions runs the same test + lint gate on pushes to `main` and on pull requests.

## Current features

- **4 archetypes** — Hex Witch, Ashen Knight, Static Duelist, Poison Vanguard, each with biased reward pools and visual themes
- **91+ cards** across 5 rarities, with 76 upgrade paths and cross-archetype synergy cards
- **44 relics** in 3 tiers with combat/start/triggered/passive wiring
- **3 acts** with 7 bosses (pools of 3 per act, seed-based selection), multi-phase final boss
- **Ascension 1–10** with scaling difficulty
- **Status system** — Strength, Dexterity, Vulnerable, Weak, Poison, Burn, Hex, Charged
- **Powers** — persistent combat effects with turn-start hooks
- **Potions** — 12 types, shop purchases, combat drops
- **Curses and Wounds** from events and ascension
- **Cross-act event chains** (4 pairs) so early choices echo later
- **Deterministic map templates** — Dense, Sparse, Gauntlet layouts by seed
- **Shop economy** — act-aware card/relic/potion inventory with ascension scaling
- **Campfire** — heal, smith, fortify (+max HP), purge, or leave
- **Combat VFX** — floating damage/block/energy/draw numbers, confetti, screen shake
- **Web Audio SFX** — 15 procedurally synthesized sounds, no audio files
- **Mobile responsive** — compact layout under 480px
- **Burn-in testing** — parallelized Playwright harness, 50-run validation passes

## Tech stack

- **Node / CommonJS** — server and game logic
- **Jest** — unit tests (65 suites, 627 tests)
- **ESLint** — linting
- **Playwright** — browser burn-in and smoke tests
- **Web Audio API** — procedural sound synthesis
- **Canvas API** — procedural card art

## Repository layout

```text
.
├── server.js              # HTTP server + JSON API endpoints
├── api/index.js           # Vercel serverless entry
├── browser/
│   ├── play.html          # main game shell
│   ├── play.js            # game rendering + interaction (~4k lines)
│   ├── play.css           # themed visual styles (~3.7k lines)
│   ├── app.js             # lobby/new-run shell
│   ├── animEngine.js      # presentation-only VFX hooks
│   └── soundEngine.js     # procedural Web Audio SFX
├── src/                   # game logic modules
│   ├── run.js             # run initialization + state
│   ├── constants.js       # shared caps, defaults, run states
│   ├── balance.js         # tunable config with overrides
│   ├── card.js            # card model / construction
│   ├── cards.js           # card factories + reward pool
│   ├── cardCatalog.js     # shared catalog with overrides + keywords
│   ├── cardRegistry.js    # canonical card registry (94 implemented)
│   ├── cardUpgrade.js     # 76 campfire upgrade paths
│   ├── deck.js            # starter deck creation
│   ├── deckZones.js       # draw/hand/discard pile behavior
│   ├── deckView.js        # deck inspection helpers
│   ├── deckRemoval.js     # card removal flow
│   ├── combat.js          # combat encounter creation
│   ├── combatEngine.js    # ordered multi-step effect executor
│   ├── combatState.js     # victory/defeat transitions
│   ├── browserCombatActions.js  # live card play, turn, status, relic wiring
│   ├── browserPostNodeActions.js # reward/event/shop/finish actions
│   ├── browserRunActions.js     # run start, archetype, act transitions
│   ├── browserTraversal.js      # browser map traversal
│   ├── browserDemo.js     # lobby helper functions
│   ├── enemy.js           # deterministic enemy actions
│   ├── enemies.js         # enemy definitions (30+), boss pools, multi-phase
│   ├── energy.js          # energy system
│   ├── damage.js          # damage/block resolution
│   ├── turns.js           # turn lifecycle
│   ├── events.js          # 33 events + chain event injection
│   ├── map.js             # deterministic map generation (Dense/Sparse/Gauntlet)
│   ├── traversal.js       # starting node + legal movement
│   ├── nodeResolver.js    # node entry → gameplay state
│   ├── playContent.js     # campfire, shop, reward content generation
│   ├── rewards.js         # archetype-biased reward pools
│   ├── relics.js          # relic reward catalog (derived from registry)
│   ├── relicRegistry.js   # canonical relic definitions (44 relics)
│   ├── potions.js         # 12 potion types + combat integration
│   ├── actTransition.js    # act 2/3 transition flow
│   ├── ascension.js       # ascension 1–10 scaling
│   ├── assets.js          # presentation-asset helpers + placeholders
│   ├── save.js            # save/load with storage adapter boundary
│   └── stats.js           # run statistics tracking
├── tests/                 # Jest + Playwright coverage (65 suites)
├── plans/                 # design docs, wireframes, style guides
├── prd.json               # product requirements (65/65 passes)
├── progress.txt           # append-only progress log
└── TODO.md                # current milestone tasks
```

## Browser architecture

The browser is a **thin client**. All game data and logic live on the server — the browser renders state and sends actions to JSON API endpoints. The server is the single source of truth.

Key endpoints: `/run/new.json`, `/run/choose-archetype.json`, `/run/enter-node.json`, `/run/play-card.json`, `/run/end-turn.json`, `/run/apply-victory.json`, `/run/claim-card.json`, `/run/upgrade-card.json`, `/run/buy-shop-item.json`, `/run/use-potion.json`.

## Contributing notes

- Prefer small modules over large classes
- Keep state serializable
- Keep gameplay logic deterministic where possible
- Add tests for every meaningful feature
- Update `progress.txt` when work is completed
- Keep `npm test` and `npm run lint` passing locally before pushing — CI runs the same checks
- The browser is presentation-only; game rules belong in `src/`