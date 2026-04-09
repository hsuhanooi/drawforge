# Drawforge Theme-Aware Rendering

## Goal
Keep Drawforge's combat UI original while letting the same shared components shift tone by archetype and encounter type.

## Current approach

- `browser/play.js` owns a small `VISUAL_THEMES` map keyed by run archetype.
- `applySurfaceTheme()` writes the active theme to `document.body.dataset.*` and mirrors it onto major screens.
- `resolveCardFrameVariant()` assigns shared card-frame variants (`neutral`, `hex`, `ember`, `storm`, `royal`) without forking the card component.
- Encounter tone is layered separately through `data-node-tone` so elite, boss, shop, and rest screens can add atmosphere without changing gameplay logic.

## Why this split

- Archetype theme controls the persistent run identity.
- Node tone controls short-lived location or encounter intensity.
- Shared card anatomy stays intact across hand, rewards, deck, shop, and overlays.

## Styling rules

- Theme overrides should mostly change tokens like `--bg`, `--bg2`, `--bg3`, `--border`, `--accent`, and type colors.
- Frame variants can change card shell gradients, stripe glow, and title tint, but not card layout.
- Boss and elite tones can intensify backgrounds and panel glow, but they should not reduce readability.

## Extension path

- Add new archetypes by extending `VISUAL_THEMES`.
- Add new encounter moods by extending `getNodeTone()` and CSS selectors.
- Keep future asset-driven frame art optional, with the current data-attribute hooks as the stable API.
