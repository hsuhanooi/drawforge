/* eslint-env node */
/* global window, document, localStorage */
const { chromium } = require('playwright');

const RUNS = Number(process.env.BURNIN_RUNS || 50);
const BASE = process.env.PLAYWRIGHT_BASE || 'http://localhost:3000/play.html';
const MAX_STEPS_PER_RUN = Number(process.env.BURNIN_MAX_STEPS || 220);
const DEFAULT_RUN_TIMEOUT_MS = Math.max(45000, (MAX_STEPS_PER_RUN * 450) + 10000);
const RUN_TIMEOUT_MS = Number(process.env.BURNIN_RUN_TIMEOUT_MS || DEFAULT_RUN_TIMEOUT_MS);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function summarizeError(error) {
  return error?.message || String(error);
}

async function safeClose(target) {
  if (!target) return;
  try {
    await target.close();
  } catch {
    // ignore already-closed target races during watchdog timeouts
  }
}

async function isVisible(page, selector) {
  try {
    return await page.$eval(selector, (el) => {
      const style = window.getComputedStyle(el);
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
    });
  } catch {
    return false;
  }
}

async function visibleScreen(page) {
  if (await isVisible(page, '#event-panel')) return 'event';

  const screens = [
    ['start', '#screen-start'],
    ['deck-choice', '#screen-deck-choice'],
    ['map', '#screen-map'],
    ['combat', '#screen-combat'],
    ['reward', '#screen-reward'],
    ['shop', '#screen-shop'],
    ['rest', '#screen-rest'],
    ['end', '#screen-end']
  ];

  for (const [name, selector] of screens) {
    if (await isVisible(page, selector)) return name;
  }

  return 'unknown';
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (!handle) continue;
    try {
      await handle.click({ force: true, timeout: 3000 });
      return selector;
    } catch {
      // keep trying
    }
  }
  return null;
}

async function collectState(page) {
  return page.evaluate(() => ({
    location: window.location.href,
    title: document.title,
    visibleScreens: Array.from(document.querySelectorAll('[id^="screen-"]'))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
      })
      .map((el) => el.id),
    combatTurnLabel: document.querySelector('#combat-turn-label')?.textContent || null,
    combatTurnState: document.querySelector('#turn-state-chip')?.textContent || null,
    eventTitle: document.querySelector('#event-title')?.textContent || null,
    rewardHeader: document.querySelector('#reward-header')?.textContent || null,
    rewardSubtitle: document.querySelector('#reward-subtitle')?.textContent || null,
    mapStats: {
      hp: document.querySelector('#map-hp')?.textContent || null,
      gold: document.querySelector('#map-gold')?.textContent || null,
      deck: document.querySelector('#map-deck-count')?.textContent || null
    },
    combatSummary: {
      playerHp: document.querySelector('#player-hp-current')?.textContent || null,
      enemyHp: document.querySelector('#enemy-hp-current')?.textContent || null,
      intent: document.querySelector('#enemy-intent-label')?.textContent || null,
      playableCards: document.querySelectorAll('#hand-area .card-component:not(.unplayable), #hand-area .card:not(.unplayable)').length,
      selectedCards: document.querySelectorAll('#hand-area .card-component.is-selected, #hand-area .card.is-selected').length,
      endTurnDisabled: document.querySelector('#end-turn-btn')?.disabled ?? null
    }
  }));
}

async function actOnScreen(page, screen) {
  switch (screen) {
    case 'start':
      await clickFirst(page, ['#start-new-run-btn']);
      return 'start:new-run';
    case 'deck-choice': {
      const choice = await clickFirst(page, [
        '#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn',
        '#deck-choice-row .archetype-select-btn'
      ]);
      return choice ? `deck-choice:${choice}` : null;
    }
    case 'map': {
      const choice = await clickFirst(page, [
        '.map-node.available.type-combat',
        '.map-node.available.type-elite',
        '.map-node.available.type-event',
        '.map-node.available.type-shop',
        '.map-node.available.type-rest',
        '.map-node.available'
      ]);
      return choice ? `map:${choice}` : null;
    }
    case 'combat': {
      const played = await clickFirst(page, [
        '#hand-area .card-component:not(.unplayable)',
        '#hand-area .card:not(.unplayable)',
        '#hand-area .card-component.is-selected',
        '#hand-area .card.is-selected'
      ]);
      if (played) {
        await sleep(90);
        await clickFirst(page, ['#enemy-panel', '#enemy-canvas', '.enemy-target', '.combat-enemy', '#hand-area .card-component.is-selected', '#hand-area .card.is-selected']);
        return `combat:play:${played}`;
      }
      const endTurn = await clickFirst(page, ['#end-turn-btn']);
      if (endTurn) return 'combat:end-turn';
      try {
        await page.keyboard.press('e');
        return 'combat:key-end-turn';
      } catch {
        return null;
      }
    }
    case 'reward': {
      const rewardChoice = await clickFirst(page, [
        '#reward-cards-row-relics > * button',
        '#reward-cards-row-relics > *',
        '#reward-cards-row > * button',
        '#reward-cards-row > *',
        '#removal-cards > * button',
        '#removal-cards > *',
        '#reward-skip-btn',
        '#reward-continue-btn',
        '#removal-skip-btn'
      ]);
      return rewardChoice ? `reward:${rewardChoice}` : null;
    }
    case 'event': {
      const choice = await clickFirst(page, ['#event-choices > * button', '#event-choices > *']);
      return choice ? `event:${choice}` : null;
    }
    case 'shop': {
      const leave = await clickFirst(page, ['#shop-leave-btn']);
      return leave ? 'shop:leave' : null;
    }
    case 'rest': {
      const option = await clickFirst(page, ['#rest-options-row .rest-option-btn', '#upgrade-cancel-btn']);
      return option ? `rest:${option}` : null;
    }
    case 'end':
      return 'end';
    default:
      return null;
  }
}

async function runSingle(browser, runIndex) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const actions = [];
  const startedAt = Date.now();
  let repeatedState = null;
  let repeatedCount = 0;

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    await page.goto(BASE, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });

    for (let step = 0; step < MAX_STEPS_PER_RUN; step += 1) {
      if ((Date.now() - startedAt) > RUN_TIMEOUT_MS) {
        const state = await collectState(page).catch(() => null);
        return {
          runIndex,
          ok: false,
          ended: false,
          steps: step,
          actions,
          consoleErrors,
          pageErrors,
          bug: `Run timed out after ${RUN_TIMEOUT_MS}ms`,
          state
        };
      }

      const screen = await visibleScreen(page);
      if (screen === 'end') {
        const state = await collectState(page);
        return { runIndex, ok: consoleErrors.length === 0 && pageErrors.length === 0, ended: true, steps: step, actions, consoleErrors, pageErrors, state };
      }

      const stateBeforeAction = await collectState(page).catch(() => null);
      const action = await actOnScreen(page, screen);
      actions.push({ step, screen, action, state: stateBeforeAction });

      if (!action) {
        const state = stateBeforeAction || await collectState(page).catch(() => null);
        return {
          runIndex,
          ok: false,
          ended: false,
          steps: step,
          actions,
          consoleErrors,
          pageErrors,
          bug: `No actionable control found on ${screen}`,
          state
        };
      }

      const repeatKey = JSON.stringify({
        screen,
        action,
        combat: stateBeforeAction?.combatSummary,
        rewardSubtitle: stateBeforeAction?.rewardSubtitle,
        visibleScreens: stateBeforeAction?.visibleScreens
      });
      if (repeatKey === repeatedState) {
        repeatedCount += 1;
      } else {
        repeatedState = repeatKey;
        repeatedCount = 1;
      }

      if (repeatedCount >= 12 && screen === 'combat') {
        return {
          runIndex,
          ok: false,
          ended: false,
          steps: step,
          actions,
          consoleErrors,
          pageErrors,
          bug: 'Combat action loop repeated without state change',
          state: stateBeforeAction
        };
      }

      const postActionDelay = screen === 'reward'
        ? 550
        : screen === 'combat'
          ? 170
          : 200;
      await sleep(postActionDelay);
    }

    const state = await collectState(page);
    return {
      runIndex,
      ok: false,
      ended: false,
      steps: MAX_STEPS_PER_RUN,
      actions,
      consoleErrors,
      pageErrors,
      bug: `Run exceeded ${MAX_STEPS_PER_RUN} steps`,
      state
    };
  } catch (error) {
    const state = await collectState(page).catch(() => null);
    return {
      runIndex,
      ok: false,
      ended: false,
      actions,
      consoleErrors,
      pageErrors,
      bug: summarizeError(error),
      state
    };
  } finally {
    await safeClose(context);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (let runIndex = 1; runIndex <= RUNS; runIndex += 1) {
    const result = await runSingle(browser, runIndex);
    results.push(result);
    const status = result.ok && result.ended ? 'OK' : 'BUG';
    console.log(`[${status}] run ${runIndex} ended=${result.ended} steps=${result.steps ?? 'n/a'}${result.bug ? ` bug=${result.bug}` : ''}`);
    if (result.consoleErrors.length) console.log(`  consoleErrors=${result.consoleErrors.length}`);
    if (result.pageErrors.length) console.log(`  pageErrors=${result.pageErrors.length}`);
    if (result.bug) console.log(`  state=${JSON.stringify(result.state)}`);
  }

  await safeClose(browser);

  const failed = results.filter((result) => !result.ok || !result.ended || result.consoleErrors.length || result.pageErrors.length);
  console.log(JSON.stringify({
    base: BASE,
    runs: RUNS,
    failures: failed.length,
    failedRuns: failed
  }, null, 2));
})();
