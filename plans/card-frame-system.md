# Drawforge Card Frame System

Approved frame direction for the shared card component.

## Core layout

```text
┌──────────────────────────────┐
│ COST GEM          RARITY RIM │
│ NAME                        │
├──────────── ART WINDOW ─────┤
│                              │
├──────── TYPE STRIPE ─────────┤
│ RULES TEXT                   │
│ KEYWORDS / CONDITIONAL COPY  │
│                              │
└──────────────────────────────┘
```

## Shared rules

- Cost gem always anchors the top-left corner.
- Name stays on a single strong title rail above the art.
- Art window is large enough for silhouette-first illustrations and safe placeholder art.
- Type stripe separates art from rules and carries class color identity.
- Rules area supports short impact text and longer combo text without collapsing readability.

## Type treatments

- Attack: ember-red top energy reflections, sharper stripe edges, stronger offensive glow.
- Skill: teal-ward stripe, calmer rim light, defensive utility framing.
- Power: violet-gold stripe, heavier ornament band, slower premium glow.
- Status/Curse/Special: darker shell with harsher rune treatment and reduced warmth.

## Rarity treatments

- Common: restrained steel frame, low shimmer.
- Uncommon: brighter trim with selective inner glow and richer type stripe.
- Rare: gilded outer rim, stronger art plate contrast, brighter title foil.
- Special: unique trim allowance, but preserve the same card anatomy for familiarity.

## Readability rules

- Body copy never sits directly on busy art.
- Long text wraps with generous line height and comfortable side padding.
- Keyword emphasis uses weight/color shifts, not full-line recoloring.
- Frame decoration must step back when a card enters disabled or exhausted state.

## State variants

- Default: readable base lighting and rarity trim.
- Hover: lift card, brighten rim, slightly enlarge art contrast.
- Selected: strong linked glow, clearer type stripe, visible targeting affordance.
- Disabled: desaturate frame and cost gem, keep text readable.
- Exhausted/resolved: reduced opacity or collapse animation after the shared play sequence.

## Reuse rules

- Hand, rewards, deck, library, removal, and shop views all reuse the same anatomy.
- Variant surfaces may scale the card, but should not reorder frame regions.
- Missing art always falls back to the same placeholder treatment so layout remains stable.
