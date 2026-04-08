# Combat UI review checklist

Date: 2026-04-08
Milestone: Combat UI Visual Direction and UX Foundation

## Review criteria

Score each area from 1 to 5.

1. **Readability at a glance**
   - Can a new player spot HP, energy, block, enemy intent, piles, relics, and turn controls quickly?
2. **Hierarchy and focus**
   - Does the screen naturally prioritize hand, selected card, target, and current turn state?
3. **Interaction clarity**
   - Is it obvious what can be clicked, selected, hovered, bought, claimed, or dismissed?
4. **Card legibility**
   - Are title, cost, type, rarity, and rules text readable in combat, rewards, deck, and shop views?
5. **Feedback and responsiveness**
   - Do play, hit, turn, reward, and end-state actions feel visible and immediate?
6. **System coherence**
   - Do combat, reward, deck, rest, and shop screens feel like parts of one game rather than separate prototypes?
7. **Originality and identity**
   - Does the presentation feel inspired by deckbuilders without obviously copying another game's exact layout or assets?
8. **Safety under reduced presentation**
   - Is the core state still understandable if animation flair is skipped or reduced?

## Review pass

### Combat screen

- **Readability at a glance: 4/5**
  - Strong: HP bars, energy pips, enemy intent, relic strip, pile counters, and end-turn button are all present in stable regions.
  - Gap: player block is badge-driven rather than a clearly labeled always-on combat stat, so it can be missed.
- **Hierarchy and focus: 4/5**
  - Strong: enemy panel, hand area, and central turn indicator are visually distinct.
  - Gap: the bottom area gets busy once many cards, counters, and controls are active at once.
- **Interaction clarity: 4/5**
  - Strong: deck buttons, end turn, and card play affordances are apparent.
  - Gap: pile inspection is not obviously exposed from the current screen structure.
- **Card legibility: 4/5**
  - Strong: rarity, cost, and richer card framing exist.
  - Gap: dense mechanic text will need guardrails for very long future cards.
- **Feedback and responsiveness: 5/5**
  - Strong: turn banner, floating numbers, attack motion, recoil, and intent text updates create good game-feel.
- **System coherence: 4/5**
  - Strong: combat shares card language with rewards/deck views.
  - Gap: some panels still feel more functional than authored.
- **Originality and identity: 4/5**
  - Strong: the large-card fantasy-tactical presentation, canvas enemy art, and framed overlays feel like Drawforge.
- **Safety under reduced presentation: 3/5**
  - Gap: this should be regression-tested more directly instead of assumed from architecture.

### Reward and deck screens

- **Readability at a glance: 4/5**
  - Reward choice is easy to understand, and the deck overlay is simple.
- **Hierarchy and focus: 4/5**
  - Reward cards are the focus, with clear skip/close paths.
- **Interaction clarity: 4/5**
  - Reward and deck interactions are understandable, but deck filtering or sorting is still absent.
- **Card legibility: 4/5**
  - Shared card presentation keeps reward and deck cards readable.
- **Feedback and responsiveness: 4/5**
  - Reward reveal timing and transitions help, but deck inspection is comparatively static.
- **System coherence: 5/5**
  - Reuse of the upgraded card component is working in Drawforge's favor here.
- **Originality and identity: 4/5**
  - The current style is distinct enough to feel owned rather than placeholder-only.
- **Safety under reduced presentation: 4/5**
  - These views are less animation-dependent and remain understandable.

## Biggest gaps found

1. Make block, statuses, and temporary state changes even easier to scan in combat.
2. Add explicit pile inspection flows instead of count-only visibility.
3. Add a direct regression pass for presentation-disabled or reduced-animation rendering.
4. Add a clearer authored visual spec so future UI work does not drift.
5. Add deck-view scaling aids such as filtering, grouping, or paging for larger collections.

## Follow-up polish items

1. Add clickable draw, discard, and exhaust pile inspection overlays with shared card rendering.
2. Add dedicated tests for presentation-disabled combat rendering and state parity.
3. Add a compact always-visible player stat strip for block and key statuses.
4. Add deck overlay grouping or filtering by type, cost, rarity, or upgraded state.
5. Add a visual style guide artifact covering palette, spacing, icon rules, and frame treatments.

## Verdict

The current interface is already playable and much more tactile than the earlier prototype. The biggest remaining risk is not basic usability, it is consistency: Drawforge now needs a few explicit UX guardrails and regression checks so future content growth does not make the UI noisy or fragile.
