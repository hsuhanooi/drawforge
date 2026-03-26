const fs = require("fs");
const path = require("path");

const appJs = fs.readFileSync(path.join(__dirname, "..", "browser", "app.js"), "utf8");

const extractBlock = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start === -1 || end === -1) {
    throw new Error(`Unable to extract block between ${startMarker} and ${endMarker}`);
  }
  return source.slice(start, end);
};

describe("browser bundle regression coverage", () => {
  it("defines every browser reward/event card id inside the browser card library", () => {
    const cardLibraryBlock = extractBlock(appJs, "const CARD_LIBRARY = {", "\n  };\n\n  const RELICS");
    const rewardIdsBlock = extractBlock(appJs, "const ids = [", "];\n    return [0, 1, 2].map");
    const eventTemplateBlock = extractBlock(appJs, "const EVENT_TEMPLATES = [", "\n  ];\n\n  function clone");

    const libraryIds = [...cardLibraryBlock.matchAll(/\n\s+([a-z_]+):\s+\{/g)].map((match) => match[1]);
    const rewardIds = [...rewardIdsBlock.matchAll(/"([a-z_]+)"/g)].map((match) => match[1]);
    const eventCardIds = [...eventTemplateBlock.matchAll(/createCardFromId\("([a-z_]+)"\)/g)].map((match) => match[1]);

    const referencedIds = [...new Set([...rewardIds, ...eventCardIds])];

    expect(libraryIds).toEqual(expect.arrayContaining(referencedIds));
  });

  it("loads bundle metadata on startup so the checksum build tag is rendered", () => {
    expect(appJs).toContain("loadBundleMeta();");
  });
});
