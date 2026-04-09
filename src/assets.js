const ASSET_CATEGORIES = Object.freeze({
  card: "card",
  relic: "relic",
  enemy: "enemy",
  icon: "icon",
  background: "background",
  vfx: "vfx"
});

const CATEGORY_PREFIX = Object.freeze({
  [ASSET_CATEGORIES.card]: "cards",
  [ASSET_CATEGORIES.relic]: "relics",
  [ASSET_CATEGORIES.enemy]: "enemies",
  [ASSET_CATEGORIES.icon]: "icons",
  [ASSET_CATEGORIES.background]: "backgrounds",
  [ASSET_CATEGORIES.vfx]: "vfx"
});

const PLACEHOLDER_ASSETS = Object.freeze({
  [ASSET_CATEGORIES.card]: "cards/_placeholder",
  [ASSET_CATEGORIES.relic]: "relics/_placeholder",
  [ASSET_CATEGORIES.enemy]: "enemies/_placeholder",
  [ASSET_CATEGORIES.icon]: "icons/_placeholder",
  [ASSET_CATEGORIES.background]: "backgrounds/_placeholder",
  [ASSET_CATEGORIES.vfx]: "vfx/_placeholder"
});

const isKnownCategory = (category) => Object.values(ASSET_CATEGORIES).includes(category);

const makeAssetRef = (category, id) => {
  if (!isKnownCategory(category)) {
    throw new Error(`Unknown asset category: ${category}`);
  }
  if (!id || typeof id !== "string") {
    return PLACEHOLDER_ASSETS[category];
  }
  return `${CATEGORY_PREFIX[category]}/${id}`;
};

const resolveAsset = ({ category, assetRef, id = null }) => {
  if (!isKnownCategory(category)) {
    throw new Error(`Unknown asset category: ${category}`);
  }

  const expectedPrefix = `${CATEGORY_PREFIX[category]}/`;
  const validAssetRef = typeof assetRef === "string" && assetRef.startsWith(expectedPrefix)
    ? assetRef
    : null;

  return {
    category,
    assetRef: validAssetRef || makeAssetRef(category, id),
    placeholderRef: PLACEHOLDER_ASSETS[category],
    isPlaceholder: !validAssetRef && (!id || makeAssetRef(category, id) === PLACEHOLDER_ASSETS[category])
  };
};

const buildPresentationAssets = ({
  cardId = null,
  relicId = null,
  enemyId = null,
  backgroundId = null,
  iconId = null,
  vfxId = null,
  assetRef = null
} = {}) => ({
  card: resolveAsset({ category: ASSET_CATEGORIES.card, assetRef, id: cardId }),
  relic: resolveAsset({ category: ASSET_CATEGORIES.relic, id: relicId }),
  enemy: resolveAsset({ category: ASSET_CATEGORIES.enemy, id: enemyId }),
  icon: resolveAsset({ category: ASSET_CATEGORIES.icon, id: iconId || cardId || relicId || enemyId }),
  background: resolveAsset({ category: ASSET_CATEGORIES.background, id: backgroundId }),
  vfx: resolveAsset({ category: ASSET_CATEGORIES.vfx, id: vfxId || cardId || relicId || enemyId })
});

module.exports = {
  ASSET_CATEGORIES,
  PLACEHOLDER_ASSETS,
  makeAssetRef,
  resolveAsset,
  buildPresentationAssets
};
