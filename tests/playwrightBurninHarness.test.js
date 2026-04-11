const fs = require('fs');
const path = require('path');

describe('playwright burn-in harness combat prioritization', () => {
  const burninPath = path.join(__dirname, 'playwright-burnin.js');
  const burninSource = fs.readFileSync(burninPath, 'utf8');

  it('prioritizes already-selected hand cards before picking a fresh combat card', () => {
    const selectedIndex = burninSource.indexOf("'#hand-area .card-component.is-selected'");
    const attackIndex = burninSource.indexOf("'#hand-area .card-component.type-attack:not(.unplayable)'");
    expect(selectedIndex).toBeGreaterThan(-1);
    expect(attackIndex).toBeGreaterThan(-1);
    expect(selectedIndex).toBeLessThan(attackIndex);
  });

  it('waits for combat controls and still resolves selected attacks before reselecting cards', () => {
    expect(burninSource).toContain('async function waitForCombatControls(page) {');
    expect(burninSource).toContain("const playableCard = document.querySelector('#hand-area .card-component:not(.unplayable), #hand-area .card:not(.unplayable)');");
    expect(burninSource).toContain("const currentCombatScreen = await visibleScreen(page).catch(() => 'unknown');");
    expect(burninSource).toContain("return 'combat:await-ready';");
    expect(burninSource).toContain("const selectedAttack = await page.evaluate(() => {");
    expect(burninSource).toContain("if (selectedAttack) {");
    expect(burninSource).toContain("const target = await clickFirst(page, ['#enemy-panel', '#enemy-canvas', '.enemy-target', '.combat-enemy']);");
    expect(burninSource).toContain("actions.push(`target:${target}`);");
    expect(burninSource).toContain("const domClicked = await page.evaluate(() => {");
    expect(burninSource).toContain("return `dom:${selector}`;");
    expect(burninSource).toContain("const combatFallback = await page.evaluate(() => {");
    expect(burninSource).toContain("return 'selected-attack-target-dom';");
    expect(burninSource).toContain("return 'play-skill-dom';");
    expect(burninSource).toContain("await page.keyboard.press('1');");
    expect(burninSource).toContain("actions.push('key-1-double');");
    expect(burninSource).toContain("return 'end-turn-dom';");
  });

  it('confirms selected non-attack cards by clicking the selected hand card again', () => {
    expect(burninSource).toContain("const selectedCardState = await page.evaluate(() => {");
    expect(burninSource).toContain("if (selectedCardState?.type === 'attack') {");
    expect(burninSource).toContain("} else if (selectedCardState?.selector) {");
    expect(burninSource).toContain("target = await clickFirst(page, [selectedCardState.selector]);");
  });

  it('batches multiple combat micro-actions before spending a whole burn-in step', () => {
    expect(burninSource).toContain('async function actOnCombatScreen(page) {');
    expect(burninSource).toContain('for (let microStep = 0; microStep < 8; microStep += 1) {');
    expect(burninSource).toContain("actions.push(`play:${played}${target ? `:${target}` : ':no-target'}`);");
    expect(burninSource).toContain("actions.push('await-resolution');");
    expect(burninSource).toContain("actions.push('end-turn');");
  });

  it('defaults burn-in to presentation-safe fast mode', () => {
    expect(burninSource).toContain("const BASE = process.env.PLAYWRIGHT_BASE || 'http://localhost:3000/play.html?fx=off';");
    expect(burninSource).toContain("const CLICK_TIMEOUT_MS = Number(process.env.BURNIN_CLICK_TIMEOUT_MS || 250);");
    expect(burninSource).toContain("const COMBAT_MICRO_DELAY_MS = Number(process.env.BURNIN_COMBAT_MICRO_DELAY_MS || 35);");
    expect(burninSource).toContain("const REWARD_SETTLE_DELAY_MS = Number(process.env.BURNIN_REWARD_SETTLE_DELAY_MS || 220);");
    expect(burninSource).toContain("const IGNORABLE_CONSOLE_ERRORS = new Set([");
    expect(burninSource).toContain("'Failed to load resource: the server responded with a status of 400 (Bad Request)'");
    expect(burninSource).toContain('if (IGNORABLE_CONSOLE_ERRORS.has(text)) return;');
    expect(burninSource).toContain("await handle.click({ force: true, timeout: CLICK_TIMEOUT_MS });");
  });

  it('waits for deck-choice buttons before preferring the second archetype deterministically', () => {
    expect(burninSource).toContain('async function waitForDeckChoiceActions(page) {');
    expect(burninSource).toContain("document.querySelectorAll('#deck-choice-row .archetype-select-btn')");
    expect(burninSource).toContain("'#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn'");
    expect(burninSource).toContain('await sleep(180);');
    expect(burninSource).toContain("return 'dom:#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn';");
    expect(burninSource).toContain("return 'dom:#deck-choice-row .archetype-select-btn';");
    expect(burninSource).toContain("return choice ? `deck-choice:${choice}` : 'deck-choice:await-ready';");
  });

  it('waits briefly for available map nodes before failing the map step', () => {
    expect(burninSource).toContain('async function clickAvailableMapNode(page) {');
    expect(burninSource).toContain("await page.waitForFunction(() => {");
    expect(burninSource).toContain("document.querySelectorAll('.map-node.available')");
    expect(burninSource).toContain("'.map-node.available.type-boss'");
    expect(burninSource).toContain('for (let attempt = 0; attempt < 4; attempt += 1) {');
    expect(burninSource).toContain('const nodeChoice = await page.evaluate((attemptIndex) => {');
    expect(burninSource).toContain("return `${selector}:${target.dataset.nodeId || attemptIndex}`;");
    expect(burninSource).toContain("const mapSnapshot = await page.evaluate(() => ({");
    expect(burninSource).toContain("currentNodeId: savedRun?.map?.currentNodeId || null,");
    expect(burninSource).toContain("await page.waitForFunction((expected) => {");
    expect(burninSource).toContain("const choice = await clickAvailableMapNode(page);");
  });

  it('supports parallel run concurrency via BURNIN_CONCURRENCY', () => {
    expect(burninSource).toContain("const CONCURRENCY = Number(process.env.BURNIN_CONCURRENCY || 4);");
    expect(burninSource).toContain('async function worker() {');
    expect(burninSource).toContain('const workers = Array.from({ length: Math.min(CONCURRENCY, RUNS) }, () => worker());');
    expect(burninSource).toContain('await Promise.all(workers);');
  });

  it('reports aggregate run-depth telemetry from saved run stats', () => {
    expect(burninSource).toContain("const saveKey = 'drawforge.v1';");
    expect(burninSource).toContain('runStats: savedRun?.stats || null,');
    expect(burninSource).toContain('rewardPickRatePerScreen');
    expect(burninSource).toContain('trueVictoryRate');
    // extended economy telemetry
    expect(burninSource).toContain('goldEarned');
    expect(burninSource).toContain('enemiesKilled');
    expect(burninSource).toContain('turnsPlayed');
    expect(burninSource).toContain('avgActReached');
    expect(burninSource).toContain('defeatRate');
    expect(burninSource).toContain('completedRuns');
  });

  it('claims reward choices and affordable shop items before falling back to continue or leave controls', () => {
    expect(burninSource).toContain('async function actOnRewardScreen(page, { preferContinue = false } = {}) {');
    expect(burninSource).toContain('const rewardStateBeforeAction = await collectState(page).catch(() => null);');
    expect(burninSource).toContain('if (shouldPreferContinue) {');
    expect(burninSource).toContain("const preferRewardContinue = false;");
    expect(burninSource).toContain("let action = await actOnScreen(page, screen, { preferContinue: preferRewardContinue });");
    expect(burninSource).toContain("if (!clicked && rewardTarget === '#removal-cards > *') {");
    expect(burninSource).toContain("return `dom:#removal-cards > *:${removalCard.dataset.cardId || removalCard.textContent?.trim() || 'card'}`;");
    expect(burninSource).toContain("const previousDeckSize = rewardStateBeforeAction?.runSummary?.deckSize || 0;");
    expect(burninSource).toContain("const removalResolved = await page.evaluate((expectedDeckSize) => {");
    expect(burninSource).toContain("const fallback = await clickFirst(page, ['#removal-skip-btn', '#reward-continue-btn']);");
    expect(burninSource).toContain("clicked = `${clicked}|fallback:${fallback}`;");
    expect(burninSource).toContain('async function actOnShopScreen(page) {');
    expect(burninSource).toContain("const gold = parsePrice(document.querySelector('#shop-gold')?.textContent || '0');");
    expect(burninSource).toContain("const affordableService = Array.from(document.querySelectorAll('#shop-services-row .shop-service-btn'))");
    expect(burninSource).toContain("const affordableCard = Array.from(document.querySelectorAll('#shop-cards-row > *')).find((wrap) => {");
    expect(burninSource).toContain("const affordableRelic = Array.from(document.querySelectorAll('#shop-relic-row > *')).find((wrap) => {");
    expect(burninSource).toContain("return action ? `shop:${action}` : null;");
    expect(burninSource).toContain("if (!action && (screen === 'combat' || screen === 'map')) {");
    expect(burninSource).toContain("bug: screen === 'combat'");
    expect(burninSource).toContain("'Reward action loop repeated without state change'");
  });
});
