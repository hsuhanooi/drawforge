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
    const cardLibraryBlock = extractBlock(appJs, "const CARD_LIBRARY = {", "\n  };\n\n  const RELICS");
    const rewardIdsBlock = extractBlock(appJs, "const ids = [", "];\n    return pickUniqueItems");

    const libraryIds = [...cardLibraryBlock.matchAll(/\n\s+([a-z_]+):\s+\{/g)].map((match) => match[1]);
    const rewardIds = [...rewardIdsBlock.matchAll(/"([a-z_]+)"/g)].map((match) => match[1]);

    expect(libraryIds).toEqual(expect.arrayContaining(rewardIds));
  });

  it("loads bundle metadata on startup so the checksum build tag is rendered", () => {
    expect(appJs).toContain("loadBundleMeta();");
  });

  it("fetches event content from the server instead of keeping a browser-only event template block", () => {
    expect(appJs).toContain('fetch(`/event.json?nodeId=${encodeURIComponent(node.id)}&row=${node.row}&col=${node.col}`');
    expect(appJs).toContain("hydrateEventOption(option)");
    expect(appJs).not.toContain("const EVENT_TEMPLATES = [");
  });

  it("elite victory transitions through a two-phase reward flow before finishing the node", () => {
    expect(appJs).toContain("function afterCardSelection(run)");
    expect(appJs).toContain("pendingRewards.removeCard");

    const claimBlock = extractBlock(appJs, "function claimCardReward(run, card)", "function claimRelicReward");
    const skipBlock = extractBlock(appJs, "function skipRewards(run)", "function claimEventOption");
    expect(claimBlock).toContain("afterCardSelection");
    expect(skipBlock).toContain("afterCardSelection");
    expect(claimBlock).not.toContain("finishNode");
    expect(skipBlock).not.toContain("finishNode");
  });

  it("finishNode detects boss victory by node type, not by hardcoded node id", () => {
    const finishNodeBlock = extractBlock(appJs, "function finishNode(run)", "function afterCardSelection");
    expect(finishNodeBlock).toContain("currentNode.type");
    expect(finishNodeBlock).not.toContain("c1");
  });

  it("renderRewards does not return early when removeCard is true", () => {
    const renderRewardsBlock = extractBlock(appJs, "function renderRewards()", "function renderRemoval");
    expect(renderRewardsBlock).not.toContain("if (removeCard) {\n      return;");
  });

  it("relic description is shown in every interactive relic surface", () => {
    const eventRenderBlock = extractBlock(appJs, "currentRun.event.options.forEach", "elements.rewardActions.appendChild(button);\n      });\n      return;");
    expect(eventRenderBlock).toContain("option.relic.description");

    const rewardsBlock = extractBlock(appJs, "function renderRewards()", "function renderRemoval");
    expect(rewardsBlock).toContain("relic.description");

    const renderRunBlock = extractBlock(appJs, "(currentRun.relics || []).forEach((relic) => {", "renderMap();");
    expect(renderRunBlock).toContain("relic.description");
  });

  it("describeCard is used at every site where a card can be chosen", () => {
    const renderCombatBlock = extractBlock(appJs, "function renderCombat()", "function renderRewards()");
    expect(renderCombatBlock).toContain("describeCard(card)");

    const rewardsBlock = extractBlock(appJs, "function renderRewards()", "function renderRemoval");
    expect(rewardsBlock).toContain("describeCard(card)");

    const eventRenderBlock = extractBlock(appJs, "currentRun.event.options.forEach", "elements.rewardActions.appendChild(button);\n      });\n      return;");
    expect(eventRenderBlock).toContain("describeCard(option.card)");
    expect(eventRenderBlock).toContain("describeCard(card)");
  });

  it("all 15 relic IDs are present in the RELICS array", () => {
    const relicIds = [
      "iron_core", "feather_charm", "ember_ring", "bone_token", "rusted_buckler",
      "quickened_loop", "worn_grimoire", "coal_pendant", "hex_nail", "cinder_box",
      "volt_shard", "merchant_ledger", "sigil_engine", "time_locked_seal", "phoenix_ash"
    ];
    for (const id of relicIds) {
      expect(appJs).toContain(`"${id}"`);
    }
  });

  it("passive relic effects are wired into playCardAtIndex", () => {
    const playBlock = extractBlock(appJs, "function playCardAtIndex(combat, handIndex", "function applyEnemyIntent");
    expect(playBlock).toContain("hex_nail");
    expect(playBlock).toContain("worn_grimoire");
    expect(playBlock).toContain("coal_pendant");
    expect(playBlock).toContain("cinder_box");
    expect(playBlock).toContain("volt_shard");
    expect(playBlock).toContain("sigil_engine");
    expect(playBlock).toContain("time_locked_seal");
  });

  it("phoenix_ash survival check is in resolveEndTurn", () => {
    const endTurnBlock = extractBlock(appJs, "function resolveEndTurn(combat, run)", "function applyRelic");
    expect(endTurnBlock).toContain("phoenix_ash");
    expect(endTurnBlock).toContain("phoenix_used");
  });

  it("bone_token heal is applied in applyVictory", () => {
    const victoryBlock = extractBlock(appJs, "function applyVictory(run, combat)", "function playCardAtIndex");
    expect(victoryBlock).toContain("bone_token");
    expect(victoryBlock).toContain("boneTokenHeal");
  });

  it("rusted_buckler and quickened_loop are wired into startCombat", () => {
    const startCombatBlock = extractBlock(appJs, "function startCombat(run, node)", "function createVictoryRewards");
    expect(startCombatBlock).toContain("rusted_buckler");
    expect(startCombatBlock).toContain("quickened_loop");
  });
});
