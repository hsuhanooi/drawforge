# Milestone Plan: Card Depth & Combat Feel

## Context

The "Character Identity & World Variety" milestone is complete. Drawforge now has 4 archetypes, 7 bosses across 3 acts, archetype-biased rewards, and cross-act event chains. 488 tests pass, 91 cards, 45 relics.

**The user's complaint**: "gameplay still feels flat and card depth and balance still feels wrong."

Three audits identified the root causes:
1. **Poison (5 cards) and Burn (5 cards) are dangerously thin** — Hex has 7 pure + 6 hybrids with rich mechanics (Hexburst consumes stacks, No Mercy repeats vs hexed). Poison/Burn have zero consumption or scaling mechanics.
2. **0% power card upgrade coverage** — all 8 powers stuck at base stats forever. Defense and Debuff cards also largely unupgradeable.
3. **No multi-hit attacks** — a StS staple. Only conditional repeats (Harvester, No Mercy) exist.
4. **Powers are flat** — 9 total, most are "+1 stat/turn" with no build-around potential.
5. **Stack caps too low** (MAX_POISON=10, MAX_BURN=10) — consumption finishers need headroom.

This milestone adds 14 new cards, 30 new upgrades, and 3 new combat engine mechanics (consume-poison, consume-burn, multi-hit). Expected outcome: Poison and Burn become viable archetype strategies with real depth, every power card can scale via upgrades, and multi-hit opens new interaction with Vulnerable/Strength.

---

## Task 1 — Deepen Poison Archetype (5 new cards + consume mechanic)

### Problem
Poison Vanguard has 5 cards and no finisher. Hex has Hexburst (consume all hex, deal bonus per stack). Poison needs the same consumption pattern plus scaling depth.

### Files
- `src/constants.js` — raise `MAX_POISON_STACKS` from 10 to 20
- `src/cardRegistry.js` — add 5 card entries
- `src/cardCatalog.js` — add 5 `implementedOverrides`, update `deriveKeywords`
- `src/browserCombatActions.js` — add `consumePoisonBonus`, `hitCount`, `applyPoisonPerHit`, `doublePoison` mechanics; add `virulent_aura` power
- `src/cards.js` — mirror `consumePoisonBonus` in server-side damage calc (follows `consumeHexBonus` pattern at line 160)

### New Cards

| ID | Name | Cost | Type | Rarity | Archetype | Effect |
|---|---|---|---|---|---|---|
| `plague_burst` | Plague Burst | 2 | attack | rare | Poison | Dmg 5. Consume all Poison on target. Deal 3 per stack consumed. |
| `toxic_barrage` | Toxic Barrage | 1 | attack | uncommon | Poison | Hit 3×3 dmg. Apply 1 Poison per hit. |
| `virulent_aura` | Virulent Aura | 2 | power | uncommon | Poison | Each turn, apply 1 Poison to enemy. |
| `contagion` | Contagion | 1 | skill | uncommon | Poison | Double Poison on target (up to cap). |
| `fetid_wound` | Fetid Wound | 1 | attack | common | Poison | Dmg 4. Apply Poison 2. Gain 3 Block. |

### Implementation

1. `constants.js`: `MAX_POISON_STACKS = 20`
2. `cardRegistry.js`: Add 5 entries following existing pattern
3. `cardCatalog.js` `implementedOverrides`:
   - `plague_burst: { damage: 5, consumePoisonBonus: 3 }`
   - `toxic_barrage: { damage: 3, hitCount: 3, applyPoisonPerHit: 1 }`
   - `virulent_aura: {}` (power — resolved in endCombatTurn)
   - `contagion: { doublePoison: true }`
   - `fetid_wound: { damage: 4, applyPoison: 2, block: 3 }`
4. `cardCatalog.js` `deriveKeywords`: Add `consumePoisonBonus` → "Consume" keyword (mirror line 151 for hex)
5. `browserCombatActions.js` `playCombatCard` damage section (near line 285-288):
   - **consumePoisonBonus**: Mirror `consumeHexBonus` pattern — read `enemy.poison`, multiply by bonus, zero out poison
   - **hitCount**: Wrap damage+block-piercing block in a loop. Each hit independently resolves vs enemy block. Apply `applyPoisonPerHit` per iteration.
   - **doublePoison**: `next.enemy.poison = clampStacks((next.enemy.poison || 0) * 2, MAX_POISON_STACKS)`
6. `browserCombatActions.js` `endCombatTurn` power loop (line 670-700): Add `virulent_aura` branch — apply 1 poison per turn
7. `cards.js` server-side: Mirror `consumePoisonBonus` (line 160 pattern)
8. Add `poison_vanguard` archetype theme entries for new cards in `ARCHETYPE_CARD_THEMES` in `src/rewards.js` (already includes "Poison")

### Tests — `tests/poisonDepth.test.js`
- `plague_burst` consumes all poison, deals base + bonus
- `plague_burst` with 0 poison deals only base damage
- `toxic_barrage` hits 3 times independently (test with enemy block)
- `toxic_barrage` applies 1 poison per hit (3 total)
- `contagion` doubles poison, respects cap of 20
- `virulent_aura` applies 1 poison per turn via power
- `fetid_wound` deals damage + poison + block
- Verify MAX_POISON_STACKS is now 20

---

## Task 2 — Deepen Burn Archetype (5 new cards + consume mechanic)

### Problem
Burn has 5 cards with no consumption finisher and no block interaction. Burn doesn't decay (unlike Poison), which is a unique strength — but there's no way to exploit high burn stacks.

### Files
- `src/constants.js` — raise `MAX_BURN_STACKS` from 10 to 20
- `src/cardRegistry.js` — add 5 card entries
- `src/cardCatalog.js` — add 5 overrides, update `deriveKeywords`
- `src/browserCombatActions.js` — add `consumeBurnBonus`, `blockPerBurn` mechanics; add `inferno_aura` power
- `src/cards.js` — mirror `consumeBurnBonus` in server-side calc

### New Cards

| ID | Name | Cost | Type | Rarity | Archetype | Effect |
|---|---|---|---|---|---|---|
| `immolate` | Immolate | 2 | attack | rare | Burn | Dmg 6. Consume all Burn. Deal 3 per stack consumed. |
| `backdraft` | Backdraft | 1 | attack | uncommon | Burn | Dmg 4. +2 damage per Burn on target. |
| `inferno_aura` | Inferno Aura | 2 | power | uncommon | Burn | Each turn, apply 1 Burn to enemy. |
| `heat_shield` | Heat Shield | 1 | skill | uncommon | Burn | Gain 4 Block. +2 Block per Burn on target. |
| `flash_fire` | Flash Fire | 0 | skill | common | Burn | Apply Burn 2. Draw 1. Exhaust. |

### Implementation

1. `constants.js`: `MAX_BURN_STACKS = 20`
2. `cardRegistry.js`: Add 5 entries
3. `cardCatalog.js`:
   - `immolate: { damage: 6, consumeBurnBonus: 3 }`
   - `backdraft: { damage: 4, bonusDmgPerBurn: 2 }`
   - `inferno_aura: {}` (power)
   - `heat_shield: { block: 4, blockPerBurn: 2 }`
   - `flash_fire: { applyBurn: 2, draw: 1, exhaust: true }`
4. `deriveKeywords`: Add `consumeBurnBonus` → "Consume"
5. `browserCombatActions.js`:
   - **consumeBurnBonus**: Mirror consumeHexBonus/consumePoisonBonus — consume burn stacks, deal bonus
   - **blockPerBurn**: In block section, add burn-scaled block: `if (card.blockPerBurn) totalBlock += (enemy.burn || 0) * card.blockPerBurn`
6. `endCombatTurn` power loop: Add `inferno_aura` — apply 1 burn per turn
7. `cards.js` server-side: Mirror consumeBurnBonus

### Tests — `tests/burnDepth.test.js`
- `immolate` consumes all burn, correct burst damage
- `immolate` with 0 burn deals only base
- `backdraft` scales with burn stacks
- `heat_shield` block scales with burn stacks
- `inferno_aura` applies 1 burn per turn
- `flash_fire` applies burn, draws, exhausts
- Verify MAX_BURN_STACKS is now 20

---

## Task 3 — Multi-Hit Cards + Build-Around Powers (4 new cards)

### Problem
No multi-hit player attacks exist. Multi-hit interacts multiplicatively with Vulnerable (1.5× per hit) and Strength (+N per hit), creating emergent depth. Also need powers with real build-around potential.

### Files
- `src/cardRegistry.js` — add 4 card entries
- `src/cardCatalog.js` — add 4 overrides
- `src/browserCombatActions.js` — `hitCountIfCharged` variant, `noxious_presence` on-attack trigger, `charged_field` power

### New Cards

| ID | Name | Cost | Type | Rarity | Archetype | Effect |
|---|---|---|---|---|---|---|
| `volt_barrage` | Volt Barrage | 1 | attack | uncommon | Charged | Hit 3×3 dmg. If Charged, hit 5× instead. |
| `flurry_of_blows` | Flurry of Blows | 2 | attack | uncommon | Neutral | Hit 4×3 dmg. |
| `noxious_presence` | Noxious Presence | 1 | power | uncommon | Poison | Whenever you play an Attack, apply 1 Poison. |
| `charged_field` | Charged Field | 2 | power | rare | Charged | Each turn, become Charged. Draw 1 extra. |

### Implementation

1. `cardRegistry.js` + `cardCatalog.js`: Add entries
   - `volt_barrage: { damage: 3, hitCount: 3, hitCountIfCharged: 5 }`
   - `flurry_of_blows: { damage: 3, hitCount: 4 }`
   - `noxious_presence: {}` (triggered power)
   - `charged_field: {}` (turn-start power)
2. `browserCombatActions.js` hitCount (from Task 1):
   - Add `hitCountIfCharged`: If player is charged and card has this prop, use it instead of `hitCount`
3. `browserCombatActions.js` after attack damage resolution:
   - If `powers` includes `noxious_presence` and card is an attack, apply 1 poison
4. `endCombatTurn` power loop:
   - `charged_field`: Set `next.player.charged = true`, draw 1 extra card

### Tests — `tests/multiHit.test.js`
- `flurry_of_blows` hits 4× independently (test with enemy block — first hits absorbed, rest damage HP)
- `volt_barrage` hits 3× normally, 5× when charged
- Multi-hit interacts correctly with Vulnerable (each hit amplified)
- Multi-hit interacts correctly with Weak (each hit reduced)
- Multi-hit interacts correctly with Strength (bonus per hit)
- `noxious_presence` applies 1 poison per attack played
- `charged_field` sets charged + draws extra each turn

---

## Task 4 — Power & Defense Upgrades (20 upgrade entries)

### Problem
8 power cards have 0% upgrade coverage. 4 defense cards and most debuff cards also can't upgrade. Upgrade coverage is ~45% — should be >75%.

### Files
- `src/cardUpgrade.js` — add 20 entries to `UPGRADE_ID_MAP` and `UPGRADED_CARD_ENTRIES`
- `src/browserCombatActions.js` — refactor power resolution to read values from power object (not hardcoded)

### Power Upgrade Strategy

Currently powers store only `{ id, label }` in `combat.powers[]` (line 261). For upgrades to affect power behavior, change the push to store full card data:
```js
next.powers = [...(next.powers || []), { id: card.id, label: card.name, ...card }];
```
Then refactor `endCombatTurn` power loop to read parametric values (e.g., `power.dexPerTurn || 1`) instead of hardcoded numbers.

### Upgrade Specifications

**8 Power upgrades:**

| Base ID | Cost Change | Effect Change |
|---|---|---|
| `iron_will` | 2→1 | +2 Dex/turn (was 1) |
| `burning_aura` | 2→1 | 5 damage/turn (was 3) |
| `hex_resonance` | 1→0 | +2 Hex/turn (was 1) |
| `storm_call` | 2→1 | 3 dmg per Hex (was 2) |
| `exhaust_engine` | 2→1 | Max 4 energy (was 3) |
| `weak_field` | 1→0 | +2 Weak/turn (was 1) |
| `dark_pact` | 1→0 | Lose 1 HP (was 2), +1 Energy |
| `vampiric_aura` | 2→1 | Heal 3 (was 2) |

**6 Defense upgrades:**

| Base ID | Upgrade Effect |
|---|---|
| `brace` | Block 10 (was 7) |
| `parry` | Block 5 (was 3) |
| `spite_shield` | Block 8. Apply Hex 2 if attacked. |
| `hollow_ward` | Block 12 (was 8). Exhaust. |
| `refrain` | Block 6 (was 4). Return to hand. |
| `last_word` | Dmg 10. +12 if last card. |

**6 Archetype upgrades:**

| Base ID | Upgrade Effect |
|---|---|
| `septic_touch` | Apply Poison 3. Apply Weak 2. |
| `infectious_wound` | Dmg 6. Apply Poison 3. Draw 1. |
| `kindle` | Apply Burn 5 (was 3). |
| `smoldering_brand` | Apply Burn 3. Apply Weak 2. |
| `funeral_pyre` | Apply Burn 6 (was 4). Exhaust. |
| `harvester` | Dmg 6. Repeat conditions unchanged. |

### Implementation

1. Add 20 entries to `UPGRADE_ID_MAP`
2. Add 20 `createUpgrade(...)` entries to `UPGRADED_CARD_ENTRIES`
3. Refactor power push (line 261) to store full card data with parametric values
4. Add parametric values to power card overrides in `cardCatalog.js`:
   - `iron_will: { dexPerTurn: 1 }`, upgrade gets `{ dexPerTurn: 2 }`
   - `burning_aura: { auraDamage: 3 }`, upgrade gets `{ auraDamage: 5 }`
   - etc.
5. Refactor `endCombatTurn` power loop to read from power object fields

### Tests — extend `tests/cardUpgrade.test.js`
- All 20 new upgrades appear in catalog
- Power upgrades have correct cost reductions
- `iron_will_plus` grants 2 dex/turn via combat test
- `burning_aura_plus` deals 5 damage/turn via combat test
- Defense upgrades produce correct block values
- Regression: all existing upgrade tests pass

---

## Task 5 — Remaining Upgrade Coverage Sweep (10 entries)

### Problem
After Task 4, upgrade coverage is ~75%. Push to ~85% by covering the remaining debuff, exhaust, and hybrid gaps.

### Files
- `src/cardUpgrade.js` — add 10 entries

### Upgrade Specifications

| Base ID | Type | Upgrade Effect |
|---|---|---|
| `cripple` | Debuff | Cost 1→0. Apply 2 Weak. |
| `pressure_point` | Debuff | Dmg 6. Apply 2 Vulnerable. |
| `enervate` | Debuff | Apply 3 Weak. Draw 1. |
| `echo_strike` | Debuff | Dmg 9. +9 vs Vulnerable. |
| `titan_strike` | Strength | Dmg 10. +3 per Strength. |
| `ashen_blow` | Exhaust | Dmg 10. Energy gain unchanged. |
| `scorch_nerves` | Exhaust | Dmg 20 (was 15). Exhaust. |
| `final_draft` | Exhaust | Draw 3. Exhaust 1 random. |
| `doom_engine` | Hex/Exhaust | Cost 1→0. Effect unchanged. |
| `plan_ahead` | Neutral | Draw 3. Exhaust. |

### Implementation
1. Add 10 entries to `UPGRADE_ID_MAP`
2. Add 10 `createUpgrade(...)` entries — all use existing mechanics, no engine changes

### Tests — extend `tests/cardUpgrade.test.js`
- All 10 new upgrades in catalog
- Cost reductions and stat bumps match spec
- Full suite regression pass

---

## Sequencing

Task 1 → Task 2 → Task 3 → Task 4 → Task 5

Tasks 1 and 2 are symmetric and can run in parallel. Task 1 introduces `hitCount` needed by Task 3. Task 4 refactors the power loop, so do it after Tasks 1-3 add new powers. Task 5 is pure data.

## Verification

```bash
# After each task — targeted tests + lint
npm test -- --runInBand tests/poisonDepth.test.js tests/burnDepth.test.js tests/multiHit.test.js tests/cardUpgrade.test.js

# Full suite after all tasks
npm test

# Lint
npm run lint

# Short burn-in (1-3 runs)
BURNIN_RUNS=3 BURNIN_CONCURRENCY=3 node tests/playwright-burnin.js
```

Expected: ~520+ tests green, lint clean, burn-in passes. New card variety visible in burn-in logs.

## Files Changed Summary

| File | Change |
|------|--------|
| `src/constants.js` | MAX_POISON_STACKS and MAX_BURN_STACKS → 20 |
| `src/cardRegistry.js` | +14 new card entries |
| `src/cardCatalog.js` | +14 implementedOverrides, deriveKeywords updates |
| `src/cardUpgrade.js` | +30 upgrade entries |
| `src/browserCombatActions.js` | consumePoison/Burn, hitCount, blockPerBurn, 4 new powers, power data refactor |
| `src/cards.js` | Mirror consumePoison/Burn in server calc |
| `tests/poisonDepth.test.js` | New — 8 tests |
| `tests/burnDepth.test.js` | New — 7 tests |
| `tests/multiHit.test.js` | New — 7 tests |
| `tests/cardUpgrade.test.js` | +20 upgrade assertions |
