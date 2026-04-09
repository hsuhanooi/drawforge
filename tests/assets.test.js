const { ASSET_CATEGORIES, PLACEHOLDER_ASSETS, makeAssetRef, resolveAsset, buildPresentationAssets } = require("../src/assets");

describe("asset pipeline helpers", () => {
  it("builds convention-based asset refs for supported categories", () => {
    expect(makeAssetRef(ASSET_CATEGORIES.card, "strike")).toBe("cards/strike");
    expect(makeAssetRef(ASSET_CATEGORIES.relic, "iron_core")).toBe("relics/iron_core");
    expect(makeAssetRef(ASSET_CATEGORIES.enemy, "slime")).toBe("enemies/slime");
  });

  it("falls back to safe placeholders for missing ids or invalid refs", () => {
    expect(resolveAsset({ category: ASSET_CATEGORIES.background, assetRef: "cards/wrong" })).toEqual({
      category: ASSET_CATEGORIES.background,
      assetRef: PLACEHOLDER_ASSETS.background,
      placeholderRef: PLACEHOLDER_ASSETS.background,
      isPlaceholder: true
    });

    expect(resolveAsset({ category: ASSET_CATEGORIES.icon })).toEqual({
      category: ASSET_CATEGORIES.icon,
      assetRef: PLACEHOLDER_ASSETS.icon,
      placeholderRef: PLACEHOLDER_ASSETS.icon,
      isPlaceholder: true
    });
  });

  it("builds multi-surface presentation bundles for cards, relics, enemies, icons, backgrounds, and vfx", () => {
    expect(buildPresentationAssets({ cardId: "strike", iconId: "attack", vfxId: "attack" })).toEqual({
      card: { category: "card", assetRef: "cards/strike", placeholderRef: "cards/_placeholder", isPlaceholder: false },
      relic: { category: "relic", assetRef: "relics/_placeholder", placeholderRef: "relics/_placeholder", isPlaceholder: true },
      enemy: { category: "enemy", assetRef: "enemies/_placeholder", placeholderRef: "enemies/_placeholder", isPlaceholder: true },
      icon: { category: "icon", assetRef: "icons/attack", placeholderRef: "icons/_placeholder", isPlaceholder: false },
      background: { category: "background", assetRef: "backgrounds/_placeholder", placeholderRef: "backgrounds/_placeholder", isPlaceholder: true },
      vfx: { category: "vfx", assetRef: "vfx/attack", placeholderRef: "vfx/_placeholder", isPlaceholder: false }
    });
  });
});
