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
    expect(playJs).toContain('/play/event.json?nodeType=');
    expect(playJs).toContain('/play/shop.json');
  });

  it("uses shared/server-backed run and combat action endpoints", () => {
    expect(playJs).toContain('fetchJson("/run/new.json")');
    expect(playJs).toContain('"/run/enter-node.json"');
    expect(playJs).toContain('"/run/play-card.json"');
    expect(playJs).toContain('"/run/end-turn.json"');
    expect(playJs).toContain('"/run/claim-card.json"');
    expect(playJs).toContain('"/run/claim-choice-relic.json"');
    expect(playJs).toContain('"/run/claim-event-option.json"');
  });

  it("renders keyword glossary tooltips in card surfaces", () => {
    expect(playJs).toContain("const KEYWORD_GLOSSARY = {");
    expect(playJs).toContain('keywordEl.className = "keyword-term"');
    expect(playJs).toContain('tooltip.className = "keyword-tooltip"');
    expect(playJs).toContain("renderRulesText(descDiv, describeCard(card));");
    expect(playJs).toContain('renderRulesText(effEl, card.effectText || describeCard(card));');
  });

  it("wires clickable pile inspection controls and modal dismissal", () => {
    expect(playJs).toContain('function hidePileModal()');
    expect(playJs).toContain('buttonEl.setAttribute("aria-label", `Open ${label}, ${pile.length} cards`)');
    expect(playJs).toContain('buttonEl.onclick = () => showPileModal(label, pile);');
    expect(playJs).toContain('subtitleEl.className = "pile-modal-subtitle"');
    expect(playJs).toContain('hidePileModal();');
  });

  it("renders a dedicated turn-state message for player, enemy, victory, defeat, and relic triggers", () => {
    expect(playJs).toContain('function setCombatStateMessage(message, tone = "player")');
    expect(playJs).toContain('setCombatStateMessage("Victory secured · claim your spoils", "victory")');
    expect(playJs).toContain('setCombatStateMessage("Defeat · the run is over", "defeat")');
    expect(playJs).toContain('setCombatStateMessage(`Enemy turn · ${enemyIntentLabel}`, "enemy")');
    expect(playJs).toContain('setCombatStateMessage(`Relic triggered · ${triggeredNames.join(", ")}`, "relic")');
  });
});
