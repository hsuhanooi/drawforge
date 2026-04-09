# Drawforge Asset Specifications

Production-facing asset specs for the shared card, relic, enemy, status, intent, background, and panel pipeline.

## Shared pipeline rules

- Asset refs follow the existing `src/assets.js` convention: `cards/<id>`, `relics/<id>`, `enemies/<id>`, `icons/<id>`, `backgrounds/<id>`, and `vfx/<id>`.
- Missing or invalid refs must safely fall back to the matching `_placeholder` asset for that category.
- Final exported filenames should stay lowercase snake_case so they can map directly to game ids.
- Prefer source files in layered formats during production, but ship flattened runtime assets in web-friendly formats.
- All gameplay surfaces must remain readable if an asset is missing, late, or replaced by a placeholder.

## Card art

- Runtime ref: `cards/<card-id>`.
- Recommended source canvas: 768 x 1024 px.
- Runtime aspect ratio target: 3:4 portrait.
- Safe area: keep critical faces, weapons, hands, and spell cores inside the middle 70% width and top 62% height.
- Leave outer frame bleed around all edges so rarity trim and hover glow do not cover key silhouettes.
- Composition goal: one strong focal action, readable at hand size before reward/deck zoom.
- Avoid tiny background storytelling that disappears when the card is fanned in hand.

## Relic art

- Runtime ref: `relics/<relic-id>`.
- Recommended source canvas: 512 x 512 px.
- Runtime target: square badge or medallion crop.
- Safe area: keep the relic silhouette inside the middle 80% with extra padding for tooltip glow and trigger pulse.
- Relics should read as a single iconic object, not a full scene.
- Common relics can stay flatter and simpler; rare and boss relics may use stronger inner glow and secondary runes.

## Enemy art

- Runtime ref: `enemies/<enemy-id>`.
- Recommended source canvas: 1280 x 720 px.
- Runtime target: wide portrait with room for HP, block, statuses, and intent UI around it.
- Safe area: keep the head, torso, and primary threat shape inside the center-right 65% so left-side intent and damage feedback remain legible.
- Enemy art should prioritize silhouette clarity over intricate texture detail.
- Leave negative space above the enemy for intent chips and below for hit reactions.

## Status and intent icons

- Runtime ref: `icons/<status-or-intent-id>`.
- Recommended source canvas: 256 x 256 px.
- Runtime target: readable down to small badge sizes.
- Use thick silhouettes and 1 to 2 dominant shapes only.
- Status icons should support the current mechanics set cleanly: Hex, Charged, Weak, Vulnerable, Strength, Dexterity, Block, Energy, Exhaust, Draw.
- Intent icons should map to the current intent families cleanly: attack, multi_attack, block, buff, debuff_hex, debuff_weak, debuff_curse.
- Color helps, but shape language must still carry meaning without hue.

## Backgrounds

- Runtime ref: `backgrounds/<id>`.
- Recommended source canvas: 1920 x 1080 px.
- Runtime target: 16:9 desktop-first layout with safe crop tolerance toward 1440 x 900 style windows.
- Preserve a quiet center band behind the hand and combat HUD so cards, text, and particles remain readable.
- Strongest detail should live near the horizon and outer thirds, not directly behind card text or intent labels.
- Background variants should support biome or encounter mood without changing gameplay readability tokens.

## Panel art and UI surfaces

- Shared panels should be authored as modular textures or layered shapes, not single baked screenshots.
- Recommended source tile sizes: 64 px, 128 px, and 256 px elements for corners, rails, insets, and badges.
- Preserve the style-guide token set from `plans/visual-style-guide.md`: Night Iron, Forge Slate, Ash Blue, Bone Ink, Smoke Text, Ember Gold, Cinder Red, Ward Teal, Hex Violet, Charge Mint.
- Panel embellishments should stay strongest on screen edges and corners so content regions remain calm.
- Tooltips, pile overlays, relic overlays, and shop/deck modals should all feel like the same forged-glass family.

## VFX hooks

- Runtime ref: `vfx/<id>`.
- Match card, relic, or enemy ids when the effect is source-specific.
- VFX assets should be authored so they can be disabled entirely without affecting rules resolution.
- Prefer short burst sheets or lightweight particle masks over long blocking cinematics.
- Keep color language aligned with gameplay meaning: ember for attack, teal for block, violet for Hex, mint for Charged, gold for relic or premium moments.

## Naming and approval checklist

- Use snake_case ids that match gameplay definitions exactly.
- Check that each exported asset still reads correctly in hand-scale, enemy-panel-scale, or icon-scale previews.
- Verify placeholder fallback behavior before claiming an asset integration is complete.
- Verify text remains readable on top of the asset in combat, reward, deck, and overlay surfaces.
- If a new asset type needs a new category, extend `src/assets.js` first instead of inventing an ad hoc path.
