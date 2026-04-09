# Drawforge Visual Style Guide

Original UI direction for the combat and run surfaces.

## Visual goals

- Readable at a glance, especially hand, energy, intent, health, block, relics, and pile counts.
- Tactile and dramatic without copying another game's exact frames, icons, or layout.
- Dark-forged fantasy tone with bright magical accents for interaction and combat outcomes.

## Color palette

### Core surfaces
- Night Iron: `#151821` for page background and deep shadows.
- Forge Slate: `#202634` for raised panels and HUD rails.
- Ash Blue: `#2b3448` for card backs, secondary panels, and separators.
- Bone Ink: `#edf0f6` for primary text on dark surfaces.
- Smoke Text: `#aab4c8` for supporting labels and metadata.

### Combat accents
- Ember Gold: `#ffbf47` for energy, active turn, and premium highlights.
- Cinder Red: `#ff6b57` for damage, attack intent, danger states, and low HP.
- Ward Teal: `#4fd1c5` for block, defensive actions, and calm interactive states.
- Hex Violet: `#9b6bff` for debuffs, cursed effects, and rare arcane UI moments.
- Charge Mint: `#5ee6a8` for Charged, draw-energy utility, and positive combo states.

### Rarity accents
- Common: cool steel border with low-glow neutral trim.
- Uncommon: teal-violet mixed trim to signal stronger crafted effects.
- Rare: warm gold-violet trim with stronger inner glow and richer art plate.
- Special/Boss: pale ember core with dark obsidian shell and animated highlight allowance.

## Typography

- Card title: bold condensed sans for quick scan and strong silhouette.
- Card rules: clean readable sans with generous line-height and strong keyword emphasis.
- UI labels: all-caps micro labels for rails, piles, and metadata.
- Numbers: wide, high-contrast tabular figures for HP, block, energy, and damage previews.

## Spacing and framing

- Base spacing unit: 8px.
- Panel radius: 14px on HUD/panel surfaces, 20px on modal overlays.
- Panels use layered borders, soft inner highlights, and subtle vertical gradients.
- The hand gets the cleanest silhouette and largest negative space budget.
- Secondary rails stay flatter and quieter so cards and enemy intent win focus.

## Iconography

- Icons should read as etched glyphs rather than cartoon stickers.
- Energy uses a faceted ember gem silhouette.
- Block uses a plated ward crest.
- Statuses use compact rune badges with color-coded glow.
- Enemy intents use clear shape language first, color second: blade, shield, burst, curse, spark.
- Pile icons should be simple stamped emblems that remain legible at small size.

## Interaction states

- Hover: slight lift, brighter rim light, stronger art contrast.
- Focus/selected: clear outer glow plus stronger title and cost treatment.
- Disabled: lowered saturation, flatter lighting, reduced gem glow.
- Pending target: selected card and valid target share a linked accent color treatment.
- Relic trigger: brief pulse and readable text chip, never a full-screen interruption.

## Surface rules

- Hand is the visual hero.
- Enemy intent is the next priority, then HP/block/energy, then relics and piles.
- Tooltips and overlays should feel like forged glass panels, not browser-default boxes.
- Theme variants may recolor backgrounds and panel materials, but must preserve text contrast and action clarity.

## Implementation notes

- Keep all palette, rarity, and frame tokens centralized so hand, rewards, deck, shop, and overlays stay visually aligned.
- Animated effects are optional garnish on top of a fully readable static presentation.
