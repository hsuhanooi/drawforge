const fs = require("fs");
const path = require("path");

const playJs = fs.readFileSync(path.join(__dirname, "..", "browser", "play.js"), "utf8");

describe("play.js thin-client regression coverage", () => {
  it("loads shared card and relic catalogs instead of keeping local catalogs", () => {
    expect(playJs).toContain('fetchJson("/cards.json")');
    expect(playJs).toContain('fetchJson("/relics.json")');
    expect(playJs).not.toContain("const CARD_LIBRARY = {");
    expect(playJs).not.toContain("const RELICS = [");
  });

  it("uses shared/server-backed content generation endpoints", () => {
    expect(playJs).toContain('fetchJson(`/play/reward-options.json?count=${count}`)');
    expect(playJs).toContain('fetchJson(`/play/event.json?nodeType=${encodeURIComponent(node.type)}&row=${node.row || 0}&col=${node.col || 0}`)');
    expect(playJs).toContain('fetchJson("/play/shop.json"');
  });

  it("uses shared/server-backed run and combat action endpoints", () => {
    expect(playJs).toContain('fetchJson("/run/new.json")');
    expect(playJs).toContain('fetchJson("/run/enter-node.json"');
    expect(playJs).toContain('fetchJson("/run/play-card.json"');
    expect(playJs).toContain('fetchJson("/run/end-turn.json"');
    expect(playJs).toContain('fetchJson("/run/claim-card.json"');
    expect(playJs).toContain('fetchJson("/run/claim-choice-relic.json"');
    expect(playJs).toContain('fetchJson("/run/claim-event-option.json"');
  });
});
