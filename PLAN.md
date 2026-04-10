# Drawforge — Next Milestone Plan: "The Living Spire"

## Context

The burn-in now runs 50/50 at BURNIN_CONCURRENCY=6. The core loop works. The UI milestone is complete. The question is: what separates a functional prototype from a game that competes with Slay the Spire 2?

After a full audit of the codebase, here is the honest picture:

**What's good:**
- Solid particle/VFX engine (animEngine.js, 1,250 lines)
- Three archetypes with real internal synergies (Hex, Exhaust, Charged)
- 48 relics with meaningful trigger variety
- Clean server/test architecture, 404/404 unit tests

**What the burn-in data reveals:**
- Runs complete in 32–68 steps. StS2 runs take 3–5× longer. The game is thin.
- Shop is always skipped (nothing worth buying). Economy is broken.
- Rest always upgrades (only 11/76 cards are upgradeable — rest is dead).
- Deck size stays near 10 many runs. Card acquisition rate is too slow or rewards are too weak.

**My critiques, ranked by impact on feel:**

1. **The game is completely silent.** Not a card flip, not a hit sound. This is the single biggest gap versus any published roguelike. Silence makes every interaction feel unconfirmed.

2. **Cards lay flat in a straight line.** StS's fanned arc is iconic precisely because it feels like holding a real hand of cards. Drawforge's straight row feels like a spreadsheet.

3. **Enemy attacks are instant.** The enemy intent shows a sword icon. Then health drops. There is no wind-up, no lunge, no impact frame. Combat feels bloodless.

4. **Cataclysm Sigil breaks Act 2.** With enough hex stacks it hits 50–80 damage. The Void Sovereign has 95 HP and dies in 2–3 turns. The boss isn't a boss — it's a performance review of your hex stack.

5. **Only 2 acts.** The game ends just as it's getting interesting. There's no late-game payoff for your deck.

6. **Hex is the only stacking mechanic.** No poison, no burn. Combat is clean in a bad way — there's no sense of attrition, no building dread.

7. **Winning does nothing.** No meta-progression, no Ascension, no unlock. Run 2 is identical to run 1.

8. **Upgrades barely exist.** Only 11 of 76 cards can be upgraded. You can build an entire Exhaust deck and none of its cards are upgradeable. The campfire is a waste.

9. **Reward screens have no ceremony.** Cards appear instantly. No cascade, no glow, no anticipation.

10. **The map is a 5×3 grid every single run.** By run 3 you've memorized the structure. No route diversity.

---

## Milestone: "The Living Spire"

**Goal:** Close the gap to StS2 quality on the four axes that matter most to feel and replayability: sound, combat animation, card depth, and run longevity.

**Success criteria:**
- A run feels complete (3 acts, climactic boss)
- Combat feels physical (sound + animation on every hit)
- Card balance allows multiple viable strategies without any single dominant path
- Players have a reason to start run 2 (meta-progression hook)

---

## Tasks (in priority order for TODO.md)

---

### 1. SOUND SYSTEM — Web Audio SFX
**Category:** feel  
**Why first:** Silence is the single biggest gap. Sound makes every other animation feel more impactful.

**Implementation:**
- Add `browser/soundEngine.js` — Web Audio API oscillator-based synthesizer (no audio files needed)
- Procedurally generate 15 sounds: card_play (whoosh), card_exhaust (crumple), hit_light (thud), hit_heavy (bass thud), block (clank), death_enemy (pop), death_player (boom), heal (chime), relic_trigger (ding), energy_restore (hum), draw_card (swish), shuffle (shuffle), reward_reveal (shimmer), map_move (thud), UI_click (tick)
- Synthesize using OscillatorNode + GainNode + BiquadFilterNode — no .mp3 files, no CORS
- Volume master control (persisted in localStorage)
- Respects existing `fx=off` query param (already gate-checks visual FX)
- Hook into existing animEngine callbacks: `onEnemyHit`, `onPlayerCardPlay`, `onRelicTrigger`, etc.
- Add unit test asserting soundEngine is initialized with correct event hook surface

**Files:** `browser/soundEngine.js` (new), `browser/play.js` (hook calls), `tests/playBundle.test.js` (source assertions)

---

### 2. CARD HAND ARC LAYOUT
**Category:** feel  
**Why:** The single most iconic thing about holding cards in a physical game. Straight line feels like a debug view.

**Implementation:**
- Replace straight `#hand-area` flex row with canvas-positioned arc layout
- Arc parameters: center at bottom-center of hand area, radius ~900px, spread angle capped at 60° for ≤8 cards
- Each card gets `transform: rotate(Xdeg) translateY(Ypx)` based on position in arc
- Hovered card rises to vertical, neighboring cards fan away (CSS transition 120ms)
- Selected card rises fully vertical and highlights
- 0-card and 1-card cases degrade gracefully (no arc)
- Cards deal in with staggered `card-deal` animation (already in play.css)
- No regression to existing unplayable/selected state classes

**Files:** `browser/play.js` (hand render function), `browser/play.css` (arc transforms), `tests/playBundle.test.js` (regression assertions on hand class structure)

---

### 3. ENEMY ATTACK ANIMATION
**Category:** feel  
**Why:** The intent icon shows ⚔️ 14 and then HP just drops. There's no physical impact.

**Implementation:**
- **Enemy lunge:** When enemy attacks, animate enemy canvas `translateX(+60px)` over 120ms then snap back over 200ms (spring ease). Already have `enemy-lunge` in play.css — wire it to enemy turn resolution.
- **Hit freeze:** On player damage, pause all animation for 80ms (frozen frame = impact feel). Implemented by setting `animEngine.frozen = true` for 80ms.
- **Player recoil:** `player-recoil` CSS class already exists — apply on player HP loss, remove after 500ms.
- **Enemy hit flash:** `enemy-hit-flash` CSS class already exists — apply on enemy HP loss, remove after 200ms.
- **Sequence in animEngine:** `onEnemyAttack()` callback → lunge tween → freeze → damage float + particles → recoil.
- These are all existing CSS classes and animEngine infrastructure — this is wiring, not new systems.

**Files:** `browser/play.js` (enemy turn rendering sequence), `browser/animEngine.js` (freeze state, onEnemyAttack), `browser/play.css` (verify/refine existing animation classes)

---

### 4. REWARD SCREEN CASCADE ANIMATION
**Category:** feel  
**Why:** Cards appearing instantly breaks the anticipation that makes rewards exciting in StS.

**Implementation:**
- On reward screen reveal (`renderReward()`), stagger card appearance: each card animates in with `card-deal` at 80ms intervals
- Relic reveals: scale-in with `rare-shimmer` + `badge-pop` combined for 600ms
- Gold display: count-up animation from 0 to actual value over 800ms (existing `float-dmg` logic can inform this)
- Victory fanfare: `animEngine.onVictory()` already fires 80 rainbow particles — keep, but add 600ms delay before reward cards appear to let it play
- Skip/continue button fades in last (after all cards visible)

**Files:** `browser/play.js` (renderReward), `browser/play.css` (stagger timing), `tests/playBundle.test.js` (assertion on stagger class/data-index)

---

### 5. POISON & BURN STATUS EFFECTS
**Category:** gameplay depth  
**Why:** Hex is the only stacking mechanic. DoT opens entirely new archetypes and creates attrition.

**Implementation:**
- **Poison:** Applied in stacks. At end of player's turn (after all cards), enemy takes `poison` damage, then poison decrements by 1 (StS exact mechanic). Tracked in `enemy.status.poison`.
- **Burn:** Applied in stacks. At START of enemy's turn, deals `burn` damage. Stacks do NOT decrement. Tracked in `enemy.status.burn`.
- Both resolve via `resolveStatusEffects(enemy)` called in `src/turns.js` at correct phase.
- **5 new Poison cards** for Hex Witch archetype: Venom Strike (8dmg+2poison), Toxic Cloud (3poison AoE intent→single), Creeping Blight (power: 1poison/turn), Septic Touch (apply 3poison, 0-cost), Infectious Wound (if enemy dies poisoned, poison carries to next)
- **5 new Burn cards** for Ashen Knight archetype: Ember Throw (5dmg+2burn), Kindle (power: +1burn on attack), Scorch (3burn, draws a card), Funeral Pyre (exhaust: deal burn×4 damage), Smoldering Brand (attack applies 1burn permanently each hit)
- Status icons: 🐍 poison (green), 🔥 burn (orange) — add to `renderBadgesAnimated()`
- 3 new enemies with DoT intents: Plague Rat (applies 2poison/turn), Cinder Shade (applies 2burn/turn), Venomfang (attacks + 1poison)
- Balance: poison/burn must cap at 10 stacks to prevent degenerate scaling

**Files:** `src/combat.js`, `src/turns.js`, `src/cards.js`, `src/enemies.js`, `browser/play.js` (badge render), tests for new status mechanics

---

### 6. CARD BALANCE PASS
**Category:** balance  
**Why:** Burn-in shows Hex decks kill Act 2 boss in 2–3 turns. Multiple archetypes should be viable with similar TTK.

**Specific changes:**
- **Cataclysm Sigil:** Cap `bonusDmgPerHex` total bonus at 40 (currently unbounded). OR raise cost to 3 energy. Both approaches tested.
- **No Mercy:** Add `consumesHex: true` — clears hex on use, preventing infinite stack exploitation.
- **Grave Fuel + Ritual Collapse combo:** Raise Grave Fuel cost from 1→2, or add "you may only gain 1 energy per turn from exhaust effects" cap in `src/energy.js`.
- **Block undertuned:** Raise base Defend from 5→6. Raise Barrier from 8→10. Add dexterity scaling to Fortify (currently +4 block, should be +4+dex).
- **Hex stacking cap:** Add `MAX_HEX_STACKS = 10` in `src/constants.js`. Enemy `status.hex` clamps at this value.
- **Enemy damage scaling:** Act 2 common enemies deal 7→9, Act 2 elites deal 12→14 (player damage scales much faster than enemy; close the gap).
- **Upgraded cards:** After balance pass, re-validate all upgrade deltas are meaningful (+damage upgrades should be +3 min, not +1).
- Add unit tests in `tests/combat.test.js` asserting hex cap behavior and energy exhaust cap.

**Files:** `src/cards.js`, `src/enemies.js`, `src/constants.js`, `src/energy.js`, `tests/combat.test.js`

---

### 7. CARD UPGRADE EXPANSION
**Category:** gameplay depth  
**Why:** Only 11/76 cards upgradeable. Players build Exhaust/Charged/Poison decks and have nothing to upgrade at campfire.

**Implementation:**
- Expand `src/cardUpgrade.js` to cover ALL core archetype cards (target: 40+ upgradeable cards)
- **Hex Witch additions:** Deep Hex+, Hexburst+, Detonate Sigil+, Cataclysm Sigil+ (capped), No Mercy+, Feast on Weakness+
- **Ashen Knight additions:** Fire Sale+, Cremate+, Grave Fuel+, Cinder Rush+, Ritual Collapse+, Overclock+
- **Charged additions:** Charge Up+, Arc Lash+, Release+, Static Guard+, Capacitor+
- **New Poison/Burn additions:** Venom Strike+, Ember Throw+, Scorch+
- **Neutral additions:** Bash+, Heavy Swing+, Pommel+, Recover+, Insight+
- Upgrade effects should be **meaningful**: cost reduction, +30% damage, adds secondary effect (not just +1 dmg)
- Two upgrade styles: `cost_reduce` (0-energy) and `enhanced` (better effect)
- Update campfire UI to show "UPGRADEABLE" count from deck
- Add unit tests covering each new upgrade mapping

**Files:** `src/cardUpgrade.js`, `src/cards.js` (upgraded variants), `tests/` (upgrade coverage)

---

### 8. ACT 3 — ENDGAME CONTENT
**Category:** content/longevity  
**Why:** The game ends just as synergies get interesting. Act 2's Void Sovereign is the final content wall.

**Implementation:**
- **Act 3 enemy pool** (8 new enemies): Escalated stats, new mechanics
  - Nightmare Husk (55HP, 13dmg, applies 2 burn/turn)
  - Hex Revenant (60HP, 11dmg, strips 3 hex from itself when attacked — immune to hex spam)
  - Stone Eater (70HP, 14dmg, gains +1 strength per 2 turns)
  - Soul Collector (50HP, 12dmg, heals 5HP if curse in player deck)
  - Void Crawler (65HP, 10dmg, applies vulnerable each turn)
  - Ashwalker (55HP, 16dmg, blocks 10 every other turn)
  - Elites: Hex Titan (100HP, 16dmg, 3 phases), Cinder Colossus (110HP, 14dmg, burn stack immune)
- **Act 3 Boss: The Undying** — 3-phase boss
  - Phase 1 (150HP): Heavy attacks + applies 2 burn/turn
  - Phase 2 (100HP → triggered at 100HP): Gains 3 strength, attack pattern shifts, spawns adds
  - Phase 3 (50HP → triggered at 50HP): Panic mode — 25 dmg/turn, curse floods deck
  - Victory condition changes: need to deplete all 3 phase HP pools
- Act 3 map: same 5×3 structure, escalated enemy pool + new boss
- `src/actTransition.js` needs Act 3 routing
- Reward after Act 3 boss: "True Victory" end screen

**Files:** `src/enemies.js`, `src/actTransition.js`, `src/map.js`, `src/nodeResolver.js`, `browser/play.js` (act 3 theming)

---

### 9. META-PROGRESSION — ASCENSION SYSTEM
**Category:** replayability  
**Why:** Winning does nothing. There is zero reason to start run 2. This is the deepest engagement hook.

**Implementation:**
- **Ascension 1–10** (start with 5 levels)
  - Level 1: Enemies have +10% HP
  - Level 2: +10% HP and +1 enemy attack damage
  - Level 3: Starting deck includes 1 Curse (Wound)
  - Level 4: +20% enemy HP, +1 enemy damage, shop prices +25%
  - Level 5: Boss has Phase 2 that starts immediately
- **Persistence:** Ascension level stored in `localStorage["drawforge_ascension"]`
- **Unlock condition:** Win at current level to unlock next
- **Win tracking:** `localStorage["drawforge_wins"]`, `localStorage["drawforge_best_ascension"]`
- **Victory screen:** Show current Ascension, best, total wins, "Next Challenge: Ascension N" CTA
- **Deck choice screen:** Show current Ascension level badge
- No gameplay changes needed to existing combat — ascension just tweaks enemy `hp` and `damage` multipliers at enemy creation time in `src/enemies.js` via a passed `ascensionLevel` parameter
- Add to `src/run.js` as `run.ascensionLevel` and propagate through `createBrowserRun()`

**Files:** `src/run.js`, `src/enemies.js`, `browser/play.js` (UI for ascension), `src/constants.js`

---

### 10. MAP VARIETY
**Category:** replayability  
**Why:** Every run is an identical 5×3 grid. By run 3 the structure is memorized.

**Implementation:**
- **3 map templates** per act (randomly selected per run):
  - Dense: 6 rows × 3 cols (more combat, 2 shops, 2 events)
  - Sparse: 4 rows × 4 cols (fewer combats, guaranteed rest, 3 events)
  - Gauntlet: 7 rows × 2 cols (no events, 1 shop, extra elite row)
- **Act-specific map seeds** so Act 1 and Act 2 have different shapes each run
- Template selection seeded from `run.seed` (deterministic per run, varied across runs)
- `src/map.js` `createMap()` accepts `{ template }` param
- No UI changes needed — existing map renderer adapts to grid dimensions

**Files:** `src/map.js`, `src/balance.js` (map template constants)

---

## Verification Plan

1. `npm test` — 404+ tests green (new tests for poison/burn, balance caps, upgrade coverage, ascension, sound hooks)
2. `BURNIN_CONCURRENCY=6 BURNIN_RUNS=50` — 50/50 passes with Act 3 content
3. Manual play: build a Hex deck → Cataclysm Sigil should no longer one-shot boss
4. Manual play: build an Exhaust deck → campfire should show upgradeable cards
5. Manual play: complete Act 3 → see Ascension unlock
6. Visual check: hand fan arc renders, enemy lunges on attack, reward cards cascade in
7. Audio check: hit sounds, card plays, reward chime all fire (with `fx=off` silencing them)

---

## Files Changed (summary)

| File | Change |
|------|--------|
| `browser/soundEngine.js` | **NEW** — Web Audio SFX synthesizer |
| `browser/play.js` | Hand arc layout, enemy attack sequence, reward cascade, sound hooks, ascension UI |
| `browser/play.css` | Arc transforms, stagger animations |
| `browser/animEngine.js` | freeze state, `onEnemyAttack` callback |
| `src/cards.js` | 10 new cards (5 poison, 5 burn), upgraded variants for 30+ cards |
| `src/cardUpgrade.js` | 40+ upgradeable cards (up from 11) |
| `src/enemies.js` | 8 Act 3 enemies + 2 elites + Act 3 boss (3-phase), ascension scaling |
| `src/turns.js` | Poison/burn resolution at correct phase |
| `src/combat.js` | Hex cap, energy exhaust cap |
| `src/constants.js` | MAX_HEX_STACKS, MAX_EXHAUST_ENERGY_PER_TURN |
| `src/actTransition.js` | Act 3 routing |
| `src/map.js` | 3 map templates per act |
| `src/run.js` | ascensionLevel field |
| `tests/` | New tests for all above |
| `TODO.md` | This milestone appended as next milestone block |

---

## Out of Scope (next milestone after this one)

- Multiple playable characters / class system (large card pool work)
- Music / background tracks (needs audio assets)
- Drag-to-play card interactions (major input remodel)
- Narrative event chains (scripted story arcs)
- Online leaderboards / run sharing
