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
  it("defines every browser reward card id inside the browser card library", () => {
    const cardLibraryBlock = extractBlock(appJs, "const CARD_LIBRARY = {", "\n  };\n\n  function createEventLabel");
    const libraryIds = [...cardLibraryBlock.matchAll(/\n\s+([a-z_]+):\s+\{/g)].map((match) => match[1]);

    const expectedRewardIds = [
      "bash", "barrier", "quick_strike", "focus", "volley", "surge", "hex", "punish", "burnout", "crackdown",
      "momentum", "wither", "siphon_ward", "detonate_sigil", "lingering_curse", "mark_of_ruin", "hexblade",
      "reapers_clause", "fire_sale", "cremate", "grave_fuel", "brand_the_soul", "harvester", "charge_up",
      "arc_lash", "blood_pact", "spite_shield"
    ];

    expect(libraryIds).toEqual(expect.arrayContaining(expectedRewardIds));
  });

  it("loads bundle metadata on startup so the checksum build tag is rendered", () => {
    expect(appJs).toContain("loadBundleMeta();");
  });

  it("uses server-backed endpoints for run init and node entry instead of browser-owned event templates", () => {
    expect(appJs).toContain('fetchJson("/run/new.json")');
    expect(appJs).toContain('fetchJson("/run/enter-node.json"');
    expect(appJs).toContain("hydrateEventOption(option)");
    expect(appJs).not.toContain("const EVENT_TEMPLATES = [");
  });

  it("uses server-backed endpoints for reward and event resolution", () => {
    expect(appJs).toContain('fetchJson("/run/apply-victory.json"');
    expect(appJs).toContain('fetchJson("/run/claim-card.json"');
    expect(appJs).toContain('fetchJson("/run/claim-choice-relic.json"');
    expect(appJs).toContain('fetchJson("/run/claim-relic.json"');
    expect(appJs).toContain('fetchJson("/run/skip-rewards.json"');
    expect(appJs).toContain('fetchJson("/run/claim-event-option.json"');
    expect(appJs).toContain('fetchJson("/run/remove-card.json"');
    expect(appJs).toContain('fetchJson("/run/finish-node.json"');
  });

  it("uses server-backed endpoints for combat progression and no longer keeps a browser combat engine", () => {
    expect(appJs).toContain('fetchJson("/run/play-card.json"');
    expect(appJs).toContain('fetchJson("/run/end-turn.json"');
    expect(appJs).not.toContain("function startCombat(run, node)");
    expect(appJs).not.toContain("function playCardAtIndex(combat, handIndex");
    expect(appJs).not.toContain("function resolveEndTurn(combat, run)");
  });

  it("does not keep a browser-owned relic catalog anymore", () => {
    expect(appJs).not.toContain("const RELICS = [");
  });

  it("renderRewards does not return early when removeCard is true", () => {
    const renderRewardsBlock = extractBlock(appJs, "function renderRewards()", "function renderRemoval");
    expect(renderRewardsBlock).not.toContain("if (removeCard) {\n      return;");
  });

  it("relic description is shown in every interactive relic surface", () => {
    const eventRenderBlock = extractBlock(appJs, "currentRun.event.options.forEach", "if (!currentRun.pendingRewards)");
    expect(eventRenderBlock).toContain("option.relic.description");

    const rewardsBlock = extractBlock(appJs, "function renderRewards()", "function renderRemoval");
    expect(rewardsBlock).toContain("relic.description");

    const renderRunBlock = extractBlock(appJs, "(currentRun.relics || []).forEach((relic) => {", "const hasCombat =");
    expect(renderRunBlock).toContain("relic.description");
  });

  it("describeCard is used at every site where a card can be chosen", () => {
    const renderCombatBlock = extractBlock(appJs, "function renderCombat()", "function renderRewards()");
    expect(renderCombatBlock).toContain("describeCard(card)");

    const rewardsBlock = extractBlock(appJs, "function renderRewards()", "function renderRemoval");
    expect(rewardsBlock).toContain("describeCard(card)");

    const eventRenderBlock = extractBlock(appJs, "currentRun.event.options.forEach", "if (!currentRun.pendingRewards)");
    expect(eventRenderBlock).toContain("describeCard(option.card)");
    expect(eventRenderBlock).toContain("describeCard(card)");
  });
});
