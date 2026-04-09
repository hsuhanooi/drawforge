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
    expect(burninSource).toContain("return `combat:target:${target}`;");
  });

  it('prefers the first archetype explicitly so burn-in runs stay deterministic', () => {
    expect(burninSource).toContain("'#deck-choice-row .archetype-panel:nth-child(1) .archetype-select-btn'");
  });
});
