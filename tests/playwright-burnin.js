/* eslint-env node */
/* global window, document, localStorage */
const { chromium } = require('playwright');

const RUNS = Number(process.env.BURNIN_RUNS || 50);
const CONCURRENCY = Number(process.env.BURNIN_CONCURRENCY || 4);
const BASE = process.env.PLAYWRIGHT_BASE || 'http://localhost:3000/play.html?fx=off';
const MAX_STEPS_PER_RUN = Number(process.env.BURNIN_MAX_STEPS || 220);
const CLICK_TIMEOUT_MS = Number(process.env.BURNIN_CLICK_TIMEOUT_MS || 250);
const COMBAT_MICRO_DELAY_MS = Number(process.env.BURNIN_COMBAT_MICRO_DELAY_MS || 35);
const REWARD_SETTLE_DELAY_MS = Number(process.env.BURNIN_REWARD_SETTLE_DELAY_MS || 220);
const DEFAULT_RUN_IDLE_TIMEOUT_MS = Math.max(12000, (MAX_STEPS_PER_RUN * 180) + 4000);
const DEFAULT_RUN_HARD_TIMEOUT_MS = Math.max(300000, (MAX_STEPS_PER_RUN * 2000) + 60000);
const RUN_IDLE_TIMEOUT_MS = Number(process.env.BURNIN_RUN_IDLE_TIMEOUT_MS || DEFAULT_RUN_IDLE_TIMEOUT_MS);
const RUN_HARD_TIMEOUT_MS = Number(process.env.BURNIN_RUN_TIMEOUT_MS || DEFAULT_RUN_HARD_TIMEOUT_MS);

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
    const handles = await page.$$(selector);
    for (const handle of handles) {
      try {
        const actionable = await handle.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return !el.classList.contains('hidden')
            && style.display !== 'none'
            && style.visibility !== 'hidden'
            && rect.width > 0
            && rect.height > 0
            && !el.disabled
            && !el.closest('.hidden');
        });
        if (!actionable) continue;
        await handle.click({ force: true, timeout: CLICK_TIMEOUT_MS });
        return selector;
      } catch {
        // keep trying visible candidates/selectors
      }
    }
  }
  return null;
}

async function collectState(page) {
  return page.evaluate(() => {
    const isShown = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
    };
    const countVisible = (selector) => Array.from(document.querySelectorAll(selector)).filter((el) => {
      const style = window.getComputedStyle(el);
      return !el.classList.contains('hidden')
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && el.getBoundingClientRect().width > 0
        && el.getBoundingClientRect().height > 0
        && !el.closest('.hidden');
    }).length;

    const rewardMode = isShown('#event-panel')
      ? 'event'
      : isShown('#removal-panel')
        ? 'removal'
        : isShown('#relic-choice-panel')
          ? 'relic'
          : isShown('#reward-content')
            ? 'cards'
            : 'none';

    return {
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
      rewardSummary: {
        mode: rewardMode,
        cardChoices: countVisible('#reward-cards-row > *'),
        relicChoices: countVisible('#reward-cards-row-relics > *'),
        removalChoices: countVisible('#removal-cards > *'),
        continueVisible: isShown('#reward-continue-btn'),
        skipVisible: isShown('#reward-skip-btn') || isShown('#removal-skip-btn')
      },
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
    };
  });
}

async function clickCombatCard(page) {
  return clickFirst(page, [
    '#hand-area .card-component.is-selected',
    '#hand-area .card.is-selected',
    '#hand-area .card-component.type-attack:not(.unplayable)',
    '#hand-area .card.type-attack:not(.unplayable)',
    '#hand-area .card-component:not(.unplayable)',
    '#hand-area .card:not(.unplayable)'
  ]);
}

async function actOnRewardScreen(page, { preferContinue = true } = {}) {
  const rewardTarget = await page.evaluate((shouldPreferContinue) => {
    const isShown = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
    };
    const countVisible = (selector) => Array.from(document.querySelectorAll(selector)).filter((el) => {
      const style = window.getComputedStyle(el);
      return !el.classList.contains('hidden')
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && el.getBoundingClientRect().width > 0
        && el.getBoundingClientRect().height > 0
        && !el.closest('.hidden');
    }).length;

    if (shouldPreferContinue) {
      if (isShown('#reward-continue-btn')) return '#reward-continue-btn';
      if (isShown('#reward-skip-btn')) return '#reward-skip-btn';
      if (isShown('#removal-skip-btn')) return '#removal-skip-btn';
    }
    if (isShown('#relic-choice-panel') && countVisible('#reward-cards-row-relics > *') > 0) return '#reward-cards-row-relics > *';
    if (isShown('#reward-content') && countVisible('#reward-cards-row > *') > 0) return '#reward-cards-row > *';
    if (isShown('#removal-panel') && countVisible('#removal-cards > *') > 0) return '#removal-cards > *';
    if (isShown('#reward-continue-btn')) return '#reward-continue-btn';
    if (isShown('#reward-skip-btn')) return '#reward-skip-btn';
    if (isShown('#removal-skip-btn')) return '#removal-skip-btn';
    return null;
  }, preferContinue);

  if (!rewardTarget) return null;
  let clicked = await clickFirst(page, [rewardTarget]);
  if (!clicked) {
    // Target exists in DOM but may not have finished layout — wait for settle then retry
    await sleep(REWARD_SETTLE_DELAY_MS);
    clicked = await clickFirst(page, [rewardTarget]);
    if (!clicked) {
      // getBoundingClientRect may still return zero despite offsetHeight > 0 — force-click via evaluate
      const baseSelector = rewardTarget.split(' > ')[0];
      const didForceClick = await page.$eval(baseSelector, (el) => {
        if (!el || el.disabled) return false;
        el.click();
        return true;
      }).catch(() => false);
      if (didForceClick) clicked = baseSelector;
    }
  }
  if (clicked && /reward-cards-row|removal-cards/.test(rewardTarget)) {
    await page.waitForFunction(() => {
      const isShown = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
      };
      return isShown('#screen-map')
        || isShown('#screen-combat')
        || isShown('#screen-end')
        || !isShown('#screen-reward');
    }, { timeout: 1500 }).catch(() => {});
  }
  return clicked ? `reward:${clicked}` : null;
}

async function actOnCombatScreen(page) {
  const actions = [];

  for (let microStep = 0; microStep < 8; microStep += 1) {
    const combatState = await collectState(page).catch(() => null);
    if (!combatState || await visibleScreen(page).catch(() => 'combat') !== 'combat') {
      return actions.length ? `combat:${actions.join('|')}` : null;
    }

    const combatResolved = /victory|defeat/i.test(combatState.combatTurnState || '')
      || (Number(combatState.combatSummary?.enemyHp) || 0) <= 0
      || (Number(combatState.combatSummary?.playerHp) || 0) <= 0;
    if (combatResolved) {
      await page.waitForFunction(() => {
        const isShown = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return false;
          const style = window.getComputedStyle(el);
          return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
        };
        return isShown('#screen-reward') || isShown('#screen-map') || isShown('#screen-end') || !isShown('#screen-combat');
      }, { timeout: 1500 }).catch(() => {});
      actions.push('await-resolution');
      return `combat:${actions.join('|')}`;
    }

    const selectedAttack = await page.evaluate(() => {
      const selected = document.querySelector('#hand-area .card-component.is-selected, #hand-area .card.is-selected');
      if (!selected) return false;
      return selected.classList.contains('type-attack');
    }).catch(() => false);

    if (selectedAttack) {
      const target = await clickFirst(page, ['#enemy-panel', '#enemy-canvas', '.enemy-target', '.combat-enemy']);
      if (target) {
        actions.push(`target:${target}`);
        await sleep(COMBAT_MICRO_DELAY_MS);
        continue;
      }
    }

    if ((combatState.combatSummary?.playableCards || 0) <= 0) break;

    let played = await clickCombatCard(page);
    if (!played) {
      // Cards exist in DOM but may not have finished layout — retry once after a brief settle
      await sleep(COMBAT_MICRO_DELAY_MS * 3);
      played = await clickCombatCard(page);
    }
    if (!played) break;

    await sleep(COMBAT_MICRO_DELAY_MS);

    const selectedCardState = await page.evaluate(() => {
      const selected = document.querySelector('#hand-area .card-component.is-selected, #hand-area .card.is-selected');
      if (!selected) return null;
      return {
        type: selected.classList.contains('type-attack') ? 'attack' : 'other',
        selector: selected.classList.contains('card-component') ? '#hand-area .card-component.is-selected' : '#hand-area .card.is-selected'
      };
    }).catch(() => null);

    let target = null;
    if (selectedCardState?.type === 'attack') {
      target = await clickFirst(page, ['#enemy-panel', '#enemy-canvas', '.enemy-target', '.combat-enemy']);
    } else if (selectedCardState?.selector) {
      target = await clickFirst(page, [selectedCardState.selector]);
    }

    actions.push(`play:${played}${target ? `:${target}` : ':no-target'}`);
    await sleep(COMBAT_MICRO_DELAY_MS);
  }

  if (await visibleScreen(page).catch(() => 'combat') !== 'combat') {
    return actions.length ? `combat:${actions.join('|')}` : null;
  }

  const resolvedBeforeEndTurn = await collectState(page).catch(() => null);
  if (resolvedBeforeEndTurn && (/victory|defeat/i.test(resolvedBeforeEndTurn.combatTurnState || '')
    || (Number(resolvedBeforeEndTurn.combatSummary?.enemyHp) || 0) <= 0
    || (Number(resolvedBeforeEndTurn.combatSummary?.playerHp) || 0) <= 0)) {
    actions.push('await-resolution');
    return `combat:${actions.join('|')}`;
  }

  const endTurn = await clickFirst(page, ['#end-turn-btn']);
  if (endTurn) {
    actions.push('end-turn');
    return `combat:${actions.join('|')}`;
  }
  try {
    await page.keyboard.press('e');
    actions.push('key-end-turn');
    return `combat:${actions.join('|')}`;
  } catch {
    return actions.length ? `combat:${actions.join('|')}` : null;
  }
}

async function clickAvailableMapNode(page) {
  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('.map-node.available'));
    return nodes.some((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return !el.classList.contains('hidden')
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0
        && !el.closest('.hidden');
    });
  }, { timeout: 1000 }).catch(() => {});

  const choice = await clickFirst(page, [
    '.map-node.available.type-combat',
    '.map-node.available.type-elite',
    '.map-node.available.type-event',
    '.map-node.available.type-shop',
    '.map-node.available.type-rest',
    '.map-node.available'
  ]);

  if (choice) return choice;

  await sleep(120);
  return clickFirst(page, [
    '.map-node.available.type-combat',
    '.map-node.available.type-elite',
    '.map-node.available.type-event',
    '.map-node.available.type-shop',
    '.map-node.available.type-rest',
    '.map-node.available'
  ]);
}

async function actOnScreen(page, screen, options = {}) {
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
      const choice = await clickAvailableMapNode(page);
      return choice ? `map:${choice}` : null;
    }
    case 'combat':
      return actOnCombatScreen(page);
    case 'reward':
      return actOnRewardScreen(page, options);
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
  let lastProgressAt = startedAt;
  let lastProgressKey = null;
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
      if (step > 0 && step % 25 === 0) {
        const liveState = await collectState(page).catch(() => null);
        const liveScreen = await visibleScreen(page).catch(() => 'unknown');
        console.log(`[PROGRESS] run ${runIndex} step=${step} screen=${liveScreen} hp=${liveState?.mapStats?.hp || '—'} gold=${liveState?.mapStats?.gold || '—'} deck=${liveState?.mapStats?.deck || '—'} rewardMode=${liveState?.rewardSummary?.mode || 'none'}`);
      }
      const now = Date.now();
      if (RUN_HARD_TIMEOUT_MS > 0 && (now - startedAt) > RUN_HARD_TIMEOUT_MS) {
        const state = await collectState(page).catch(() => null);
        return {
          runIndex,
          ok: false,
          ended: false,
          steps: step,
          actions,
          consoleErrors,
          pageErrors,
          bug: `Run hard-timed out after ${RUN_HARD_TIMEOUT_MS}ms`,
          state
        };
      }
      if ((now - lastProgressAt) > RUN_IDLE_TIMEOUT_MS) {
        const state = await collectState(page).catch(() => null);
        return {
          runIndex,
          ok: false,
          ended: false,
          steps: step,
          actions,
          consoleErrors,
          pageErrors,
          bug: `Run stalled for ${RUN_IDLE_TIMEOUT_MS}ms without progress`,
          state
        };
      }

      const screen = await visibleScreen(page);
      if (screen === 'end') {
        const state = await collectState(page);
        return { runIndex, ok: consoleErrors.length === 0 && pageErrors.length === 0, ended: true, steps: step, actions, consoleErrors, pageErrors, state };
      }

      if (screen === 'unknown') {
        // Mid-transition: no recognized screen is visible yet — wait briefly and retry
        await sleep(REWARD_SETTLE_DELAY_MS);
        // eslint-disable-next-line no-continue
        continue;
      }

      const stateBeforeAction = await collectState(page).catch(() => null);
      const progressKey = JSON.stringify({
        screen,
        visibleScreens: stateBeforeAction?.visibleScreens,
        mapStats: stateBeforeAction?.mapStats,
        rewardSummary: stateBeforeAction?.rewardSummary,
        rewardSubtitle: stateBeforeAction?.rewardSubtitle,
        combatSummary: stateBeforeAction?.combatSummary
      });
      if (progressKey !== lastProgressKey) {
        lastProgressKey = progressKey;
        lastProgressAt = Date.now();
      }

      const preferRewardContinue = screen === 'reward';
      const action = await actOnScreen(page, screen, { preferContinue: preferRewardContinue });
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
        rewardSummary: stateBeforeAction?.rewardSummary,
        rewardSubtitle: stateBeforeAction?.rewardSubtitle,
        visibleScreens: stateBeforeAction?.visibleScreens
      });
      if (repeatKey === repeatedState) {
        repeatedCount += 1;
      } else {
        repeatedState = repeatKey;
        repeatedCount = 1;
      }

      if (repeatedCount >= 12 && (screen === 'combat' || screen === 'reward')) {
        return {
          runIndex,
          ok: false,
          ended: false,
          steps: step,
          actions,
          consoleErrors,
          pageErrors,
          bug: screen === 'combat'
            ? 'Combat action loop repeated without state change'
            : 'Reward action loop repeated without state change',
          state: stateBeforeAction
        };
      }

      const postActionDelay = screen === 'reward'
        ? REWARD_SETTLE_DELAY_MS
        : screen === 'combat'
          ? COMBAT_MICRO_DELAY_MS
          : 80;
      await sleep(postActionDelay);

      const stateAfterAction = await collectState(page).catch(() => null);
      const postActionKey = JSON.stringify({
        screen: await visibleScreen(page).catch(() => screen),
        visibleScreens: stateAfterAction?.visibleScreens,
        mapStats: stateAfterAction?.mapStats,
        rewardSummary: stateAfterAction?.rewardSummary,
        rewardSubtitle: stateAfterAction?.rewardSubtitle,
        combatSummary: stateAfterAction?.combatSummary
      });
      if (postActionKey !== lastProgressKey) {
        lastProgressKey = postActionKey;
        lastProgressAt = Date.now();
      }
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
  const queue = Array.from({ length: RUNS }, (_, i) => i + 1);

  function onResult(result) {
    results.push(result);
    const status = result.ok && result.ended ? 'OK' : 'BUG';
    console.log(`[${status}] run ${result.runIndex} ended=${result.ended} steps=${result.steps ?? 'n/a'}${result.bug ? ` bug=${result.bug}` : ''}`);
    if (result.consoleErrors.length) console.log(`  consoleErrors=${result.consoleErrors.length}`);
    if (result.pageErrors.length) console.log(`  pageErrors=${result.pageErrors.length}`);
    if (result.bug) console.log(`  state=${JSON.stringify(result.state)}`);
  }

  async function worker() {
    while (queue.length > 0) {
      const runIndex = queue.shift();
      if (runIndex === undefined) break;
      const result = await runSingle(browser, runIndex);
      onResult(result);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, RUNS) }, () => worker());
  await Promise.all(workers);

  await safeClose(browser);

  const failed = results.filter((result) => !result.ok || !result.ended || result.consoleErrors.length || result.pageErrors.length);
  console.log(JSON.stringify({
    base: BASE,
    runs: RUNS,
    concurrency: CONCURRENCY,
    failures: failed.length,
    failedRuns: failed
  }, null, 2));
})();
