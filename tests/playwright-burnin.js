/* eslint-env node */
/* global window, document, localStorage, MouseEvent */
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
const IGNORABLE_CONSOLE_ERRORS = new Set([
  'Failed to load resource: the server responded with a status of 400 (Bad Request)'
]);

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
        const dispatched = await handle.evaluate((el) => {
          if (!el || el.disabled) return false;
          el.scrollIntoView({ block: 'center', inline: 'center' });
          ['mousedown', 'mouseup', 'click'].forEach((type) => {
            el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
          });
          el.click();
          return true;
        }).catch(() => false);
        if (dispatched) return selector;
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

    const saveKey = 'drawforge.v1';
    let savedRun = null;
    try {
      savedRun = JSON.parse(localStorage.getItem(saveKey) || 'null');
    } catch {
      savedRun = null;
    }

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
        deck: document.querySelector('#map-deck-count')?.textContent || null,
        currentNodeId: savedRun?.map?.currentNodeId || null,
        totalNodes: document.querySelectorAll('.map-node').length,
        availableNodes: document.querySelectorAll('.map-node.available').length,
        availableBossNodes: document.querySelectorAll('.map-node.available.type-boss').length
      },
      runStats: savedRun?.stats || null,
      runSummary: {
        deckSize: savedRun?.player?.deck?.length || 0,
        gold: savedRun?.player?.gold || 0,
        act: savedRun?.act || 1,
        state: savedRun?.state || null,
        trueVictory: Boolean(savedRun?.trueVictory)
      },
      combatSummary: {
        playerHp: document.querySelector('#player-hp-current')?.textContent || null,
        enemyHp: document.querySelector('#enemy-hp-current')?.textContent || null,
        intent: document.querySelector('#enemy-intent-label')?.textContent || null,
        playableCards: countVisible('#hand-area .card-component:not(.unplayable), #hand-area .card:not(.unplayable)'),
        selectedCards: countVisible('#hand-area .card-component.is-selected, #hand-area .card.is-selected'),
        endTurnDisabled: document.querySelector('#end-turn-btn')?.disabled ?? null
      }
    };
  });
}

async function clickCombatCard(page) {
  const clicked = await clickFirst(page, [
    '#hand-area .card-component.is-selected',
    '#hand-area .card.is-selected',
    '#hand-area .card-component.type-attack:not(.unplayable)',
    '#hand-area .card.type-attack:not(.unplayable)',
    '#hand-area .card-component:not(.unplayable)',
    '#hand-area .card:not(.unplayable)'
  ]);
  if (clicked) return clicked;

  const domClicked = await page.evaluate(() => {
    const isVisible = (el) => {
      if (!el || el.disabled || el.closest('.hidden')) return false;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return !el.classList.contains('hidden')
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0;
    };

    const selectors = [
      '#hand-area .card-component.is-selected',
      '#hand-area .card.is-selected',
      '#hand-area .card-component.type-attack:not(.unplayable)',
      '#hand-area .card.type-attack:not(.unplayable)',
      '#hand-area .card-component:not(.unplayable)',
      '#hand-area .card:not(.unplayable)'
    ];

    for (const selector of selectors) {
      const card = Array.from(document.querySelectorAll(selector)).find(isVisible);
      if (!card) continue;
      card.scrollIntoView({ block: 'center', inline: 'center' });
      card.click();
      return `dom:${selector}`;
    }

    return null;
  }).catch(() => null);

  return domClicked;
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
    const currentCombatScreen = await visibleScreen(page).catch(() => 'unknown');
    if (!combatState || currentCombatScreen !== 'combat') {
      if (!actions.length && (currentCombatScreen === 'unknown' || currentCombatScreen === 'map' || currentCombatScreen === 'reward')) {
        await sleep(Math.max(COMBAT_MICRO_DELAY_MS * 3, 120));
        return 'combat:await-ready';
      }
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

  const combatFallback = await page.evaluate(() => {
    const selectedCard = document.querySelector('#hand-area .card-component.is-selected, #hand-area .card.is-selected');
    const enemyTarget = document.querySelector('#enemy-panel, #enemy-canvas, .enemy-target, .combat-enemy');
    if (selectedCard) {
      if (selectedCard.classList.contains('type-attack') && enemyTarget) {
        enemyTarget.click();
        return 'selected-attack-target-dom';
      }
      selectedCard.click();
      return 'selected-card-dom';
    }

    const playableCard = document.querySelector('#hand-area .card-component:not(.unplayable), #hand-area .card:not(.unplayable)');
    if (playableCard) {
      playableCard.click();
      const nowSelected = document.querySelector('#hand-area .card-component.is-selected, #hand-area .card.is-selected');
      if (nowSelected) {
        if (nowSelected.classList.contains('type-attack') && enemyTarget) {
          enemyTarget.click();
          return 'play-attack-dom';
        }
        nowSelected.click();
        return 'play-skill-dom';
      }
      return 'play-card-dom';
    }

    const endTurnBtn = document.querySelector('#end-turn-btn');
    if (endTurnBtn && !endTurnBtn.disabled) {
      endTurnBtn.click();
      return 'end-turn-dom';
    }

    return null;
  }).catch(() => null);
  if (combatFallback) {
    actions.push(combatFallback);
    return `combat:${actions.join('|')}`;
  }

  try {
    await page.keyboard.press('1');
    await sleep(COMBAT_MICRO_DELAY_MS);
    const selectedAfterOne = await page.evaluate(() => Boolean(
      document.querySelector('#hand-area .card-component.is-selected, #hand-area .card.is-selected')
    )).catch(() => false);
    if (selectedAfterOne) {
      await page.keyboard.press('1');
      actions.push('key-1-double');
      return `combat:${actions.join('|')}`;
    }
  } catch {
    // fall through to end-turn shortcut
  }

  try {
    await page.keyboard.press('e');
    actions.push('key-end-turn');
    return `combat:${actions.join('|')}`;
  } catch {
    const readyState = await collectState(page).catch(() => null);
    if (readyState?.combatSummary?.playableCards > 0 && readyState?.combatSummary?.endTurnDisabled === false) {
      await sleep(Math.max(COMBAT_MICRO_DELAY_MS * 4, 180));
      actions.push('await-ready');
      return `combat:${actions.join('|')}`;
    }
    return actions.length ? `combat:${actions.join('|')}` : null;
  }
}

async function clickAvailableMapNode(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
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
    }, { timeout: 1200 }).catch(() => {});

    const nodeChoice = await page.evaluate((attemptIndex) => {
      const selectorsInPriority = [
        '.map-node.available.type-combat',
        '.map-node.available.type-elite',
        '.map-node.available.type-event',
        '.map-node.available.type-shop',
        '.map-node.available.type-rest',
        '.map-node.available.type-boss',
        '.map-node.available'
      ];
      for (const selector of selectorsInPriority) {
        const nodes = Array.from(document.querySelectorAll(selector)).filter((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return !el.classList.contains('hidden')
            && style.display !== 'none'
            && style.visibility !== 'hidden'
            && rect.width > 0
            && rect.height > 0
            && !el.closest('.hidden');
        });
        if (!nodes.length) continue;
        const target = nodes[attemptIndex % nodes.length];
        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        target.click();
        return `${selector}:${target.dataset.nodeId || attemptIndex}`;
      }
      return null;
    }, attempt).catch(() => null);
    if (nodeChoice) return nodeChoice;

    const mapSnapshot = await page.evaluate(() => ({
      available: document.querySelectorAll('.map-node.available').length,
      total: document.querySelectorAll('.map-node').length,
      screenMapVisible: !document.querySelector('#screen-map')?.classList.contains('hidden')
    })).catch(() => null);
    if (mapSnapshot?.available || mapSnapshot?.total) {
      await sleep(350);
    } else {
      await sleep(500);
    }
  }

  return null;
}

async function waitForDeckChoiceActions(page) {
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('#deck-choice-row .archetype-select-btn'));
    return buttons.some((button) => {
      const style = window.getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return !button.disabled
        && !button.classList.contains('hidden')
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0
        && !button.closest('.hidden');
    });
  }, { timeout: 1200 }).catch(() => {});
}

async function waitForCombatControls(page) {
  await page.waitForFunction(() => {
    const isShown = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
    };
    if (!isShown('#screen-combat')) return false;

    const playableCard = document.querySelector('#hand-area .card-component:not(.unplayable), #hand-area .card:not(.unplayable)');
    const selectedCard = document.querySelector('#hand-area .card-component.is-selected, #hand-area .card.is-selected');
    const endTurnBtn = document.querySelector('#end-turn-btn');
    const turnState = document.querySelector('#turn-state-chip')?.textContent || '';
    const playerHp = Number(document.querySelector('#player-hp-current')?.textContent || 0);
    const enemyHp = Number(document.querySelector('#enemy-hp-current')?.textContent || 0);

    return Boolean(selectedCard)
      || Boolean(playableCard)
      || Boolean(endTurnBtn && !endTurnBtn.disabled)
      || /victory|defeat/i.test(turnState)
      || playerHp <= 0
      || enemyHp <= 0;
  }, { timeout: 1200 }).catch(() => {});
}

async function actOnScreen(page, screen, options = {}) {
  switch (screen) {
    case 'start':
      await clickFirst(page, ['#start-new-run-btn']);
      return 'start:new-run';
    case 'deck-choice': {
      await waitForDeckChoiceActions(page);
      let choice = await clickFirst(page, [
        '#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn',
        '#deck-choice-row .archetype-select-btn'
      ]);
      if (!choice) {
        await sleep(180);
        choice = await clickFirst(page, [
          '#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn',
          '#deck-choice-row .archetype-select-btn'
        ]);
      }
      if (!choice) {
        choice = await page.evaluate(() => {
          const isVisible = (el) => {
            if (!el || el.disabled || el.closest('.hidden')) return false;
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return !el.classList.contains('hidden')
              && style.display !== 'none'
              && style.visibility !== 'hidden'
              && rect.width > 0
              && rect.height > 0;
          };
          const preferred = document.querySelector('#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn');
          if (isVisible(preferred)) {
            preferred.click();
            return 'dom:#deck-choice-row .archetype-panel:nth-child(2) .archetype-select-btn';
          }
          const fallback = Array.from(document.querySelectorAll('#deck-choice-row .archetype-select-btn')).find(isVisible);
          if (fallback) {
            fallback.click();
            return 'dom:#deck-choice-row .archetype-select-btn';
          }
          return null;
        }).catch(() => null);
      }
      return choice ? `deck-choice:${choice}` : 'deck-choice:await-ready';
    }
    case 'map': {
      const choice = await clickAvailableMapNode(page);
      return choice ? `map:${choice}` : null;
    }
    case 'combat':
      await waitForCombatControls(page);
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
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORABLE_CONSOLE_ERRORS.has(text)) return;
    consoleErrors.push(text);
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
      let action = await actOnScreen(page, screen, { preferContinue: preferRewardContinue });
      if (!action && (screen === 'combat' || screen === 'map')) {
        await sleep(screen === 'combat' ? Math.max(COMBAT_MICRO_DELAY_MS, 80) : 180);
        action = await actOnScreen(page, screen, { preferContinue: preferRewardContinue });
      }
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

      if (repeatedCount >= 10 && screen === 'map') {
        return {
          runIndex,
          ok: false,
          ended: false,
          steps: step,
          actions,
          consoleErrors,
          pageErrors,
          bug: 'Map action loop repeated without state change',
          state: stateBeforeAction
        };
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
          : screen === 'map'
            ? 220
            : 80;
      await sleep(postActionDelay);

      if (screen === 'map') {
        const beforeMapKey = JSON.stringify({
          currentNodeId: stateBeforeAction?.mapStats?.currentNodeId,
          availableNodes: stateBeforeAction?.mapStats?.availableNodes,
          availableBossNodes: stateBeforeAction?.mapStats?.availableBossNodes,
          visibleScreens: stateBeforeAction?.visibleScreens
        });
        await page.waitForFunction((expected) => {
          const readVisibleScreens = () => Array.from(document.querySelectorAll('[id^="screen-"]'))
            .filter((el) => {
              const style = window.getComputedStyle(el);
              return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
            })
            .map((el) => el.id);
          let savedRun = null;
          try {
            savedRun = JSON.parse(localStorage.getItem('drawforge.v1') || 'null');
          } catch {
            savedRun = null;
          }
          const currentKey = JSON.stringify({
            currentNodeId: savedRun?.map?.currentNodeId || null,
            availableNodes: document.querySelectorAll('.map-node.available').length,
            availableBossNodes: document.querySelectorAll('.map-node.available.type-boss').length,
            visibleScreens: readVisibleScreens()
          });
          return currentKey !== expected;
        }, beforeMapKey, { timeout: 1200 }).catch(() => {});
      }

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
    const s = result.state?.runStats || {};
    const summary = result.state?.runSummary || {};
    const statsLine = `killed=${s.enemiesKilled ?? '?'} goldEarned=${s.goldEarned ?? '?'} rewardScreens=${s.rewardCardChoiceScreens ?? '?'} deck=${summary.deckSize ?? '?'} act=${summary.act ?? '?'} state=${summary.state ?? '?'}`;
    console.log(`[${status}] run ${result.runIndex} ended=${result.ended} steps=${result.steps ?? 'n/a'}${result.bug ? ` bug=${result.bug}` : ''} | ${statsLine}`);
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
  const completed = results.filter((result) => result.ok && result.ended && result.state?.runStats);
  const totals = completed.reduce((acc, result) => {
    const stats = result.state.runStats || {};
    const summary = result.state.runSummary || {};
    acc.deckSize += summary.deckSize || 0;
    acc.goldEarned += stats.goldEarned || 0;
    acc.goldSpent += stats.goldSpent || 0;
    acc.shopVisits += stats.shopVisits || 0;
    acc.rewardChoiceScreens += stats.rewardCardChoiceScreens || 0;
    acc.rewardCardsClaimed += stats.rewardCardsClaimed || 0;
    acc.enemiesKilled += stats.enemiesKilled || 0;
    acc.turnsPlayed += stats.turnsPlayed || 0;
    acc.trueVictories += summary.trueVictory ? 1 : 0;
    acc.defeats += (summary.state === 'lost') ? 1 : 0;
    acc.actReached += summary.act || 1;
    return acc;
  }, {
    deckSize: 0,
    goldEarned: 0,
    goldSpent: 0,
    shopVisits: 0,
    rewardChoiceScreens: 0,
    rewardCardsClaimed: 0,
    enemiesKilled: 0,
    turnsPlayed: 0,
    trueVictories: 0,
    defeats: 0,
    actReached: 0
  });
  const divisor = completed.length || 1;
  console.log(JSON.stringify({
    base: BASE,
    runs: RUNS,
    concurrency: CONCURRENCY,
    completedRuns: completed.length,
    failures: failed.length,
    averages: completed.length ? {
      finalDeckSize: Number((totals.deckSize / divisor).toFixed(2)),
      goldEarned: Number((totals.goldEarned / divisor).toFixed(2)),
      goldSpent: Number((totals.goldSpent / divisor).toFixed(2)),
      shopVisits: Number((totals.shopVisits / divisor).toFixed(2)),
      rewardChoiceScreens: Number((totals.rewardChoiceScreens / divisor).toFixed(2)),
      rewardCardsClaimed: Number((totals.rewardCardsClaimed / divisor).toFixed(2)),
      rewardPickRatePerScreen: Number((totals.rewardCardsClaimed / Math.max(1, totals.rewardChoiceScreens)).toFixed(2)),
      enemiesKilled: Number((totals.enemiesKilled / divisor).toFixed(2)),
      turnsPlayed: Number((totals.turnsPlayed / divisor).toFixed(2)),
      avgActReached: Number((totals.actReached / divisor).toFixed(2)),
      trueVictoryRate: Number((totals.trueVictories / divisor).toFixed(2)),
      defeatRate: Number((totals.defeats / divisor).toFixed(2))
    } : null,
    failedRuns: failed
  }, null, 2));
})();
