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

  it('tries to resolve a selected attack against the enemy before reselecting cards', () => {
    expect(burninSource).toContain("const selectedAttack = await page.evaluate(() => {");
    expect(burninSource).toContain("if (selectedAttack) {");
    expect(burninSource).toContain("const target = await clickFirst(page, ['#enemy-panel', '#enemy-canvas', '.enemy-target', '.combat-enemy']);");
    expect(burninSource).toContain("actions.push(`target:${target}`);");
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
    expect(burninSource).toContain("await handle.click({ force: true, timeout: CLICK_TIMEOUT_MS });");
  });

  it('prefers the second archetype explicitly so burn-in runs stay deterministic and more aggressive', () => {
    expect(burninSource).toContain("'#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn'");
  });

  it('waits briefly for available map nodes before failing the map step', () => {
    expect(burninSource).toContain('async function clickAvailableMapNode(page) {');
    expect(burninSource).toContain("await page.waitForFunction(() => {");
    expect(burninSource).toContain("document.querySelectorAll('.map-node.available')");
    expect(burninSource).toContain('await sleep(120);');
    expect(burninSource).toContain("const choice = await clickAvailableMapNode(page);");
  });
});
