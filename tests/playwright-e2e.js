/* eslint-env node */
/* global window, document, localStorage */
/**
 * Drawforge Playwright E2E Test
 * Tests all user flows as specified
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000/play.html';
const BUGS = [];
let page;
let browser;
const consoleErrors = [];
const consoleWarnings = [];

function bug(step, expected, actual) {
  BUGS.push({ step, expected, actual });
  console.log(`[BUG] ${step}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
}

function info(msg) {
  console.log(`[INFO] ${msg}`);
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(name) {
  await page.screenshot({ path: `/tmp/drawforge-${name}.png`, fullPage: false });
}

async function isVisible(id) {
  return page.$eval(`#${id}`, el => !el.classList.contains('hidden') && el.style.display !== 'none').catch(() => false);
}

async function run() {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  page = await context.newPage();

  // Capture all console output
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push(text);
      console.log(`[CONSOLE ERROR] ${text}`);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // ─── 1. Start Screen ────────────────────────────────────────────────
  info('=== TEST 1: Start Screen ===');
  await page.goto(BASE);
  await wait(1000);
  await screenshot('01-start');

  const startVisible = await isVisible('screen-start');
  if (!startVisible) {
    bug('1. Start Screen', 'Start screen visible on load', 'Start screen NOT visible');
  } else {
    info('Start screen is visible ✓');
  }

  const title = await page.textContent('h1').catch(() => null);
  if (title !== 'DRAWFORGE') {
    bug('1. Start Screen Title', 'Title reads DRAWFORGE', `Title shows "${title}"`);
  } else {
    info('Title: "DRAWFORGE" ✓');
  }

  // Clear save and check Continue button
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await wait(800);

  const continueVisible = await page.$eval('#start-load-run-btn', el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
  }).catch(() => false);

  if (continueVisible) {
    bug('1. Continue Button Hidden', 'Continue button hidden when no save exists', 'Continue button is visible with no save in localStorage');
  } else {
    info('Continue button correctly hidden when no save ✓');
  }

  // ─── 2. New Run + Deck Choice ────────────────────────────────────────
  info('=== TEST 2: New Run + Deck Choice ===');
  await page.click('#start-new-run-btn');
  await wait(1500);
  await screenshot('02-after-new-run');

  // Check which screen appears
  const deckChoiceVisible = await isVisible('screen-deck-choice');
  const mapVisibleAfterNewRun = await isVisible('screen-map');

  if (deckChoiceVisible) {
    info('Deck choice screen visible ✓');

    // Check deck options
    const deckOptions = await page.$$('#deck-choice-row > *');
    if (deckOptions.length === 0) {
      bug('2. Deck Choice Options', 'Deck options rendered in #deck-choice-row', 'No deck options found');
    } else {
      info(`${deckOptions.length} deck options found ✓`);
      // Click first deck option
      await deckOptions[0].click();
      await wait(1500);
      info('Clicked first deck option');
    }
  } else if (mapVisibleAfterNewRun) {
    bug('2. Deck Choice Screen', 'Deck choice screen shown before map on New Run', 'Map shown immediately - deck choice screen skipped entirely');
    info('Proceeding with map (deck was auto-assigned)');
  } else {
    bug('2. New Run Navigation', 'Deck choice or map screen after New Run', 'Neither deck choice nor map is visible');
  }

  // ─── 3. Map ──────────────────────────────────────────────────────────
  info('=== TEST 3: Map ===');
  await screenshot('03-map');

  const mapVisible = await isVisible('screen-map');
  if (!mapVisible) {
    bug('3. Map Screen', 'Map screen visible after deck selection', 'Map screen NOT visible');
  } else {
    info('Map screen visible ✓');
  }

  // Check floor labels (rendered as div.map-row-label in div.map-row-wrap)
  const rowLabels = await page.$$('.map-row-label');
  info(`Floor label elements found: ${rowLabels.length}`);
  if (rowLabels.length === 0) {
    bug('3. Floor Labels', 'Floor labels (F1, F2, BOSS etc) visible on map', 'No .map-row-label elements found');
  } else {
    const labelTexts = await Promise.all(rowLabels.map(el => el.textContent()));
    info(`Floor labels: ${labelTexts.join(', ')}`);
    const hasFloorLabel = labelTexts.some(t => t.match(/F\d+|BOSS/));
    if (!hasFloorLabel) {
      bug('3. Floor Label Format', 'Labels show F1, F2, BOSS format', `Labels show: ${labelTexts.join(', ')}`);
    } else {
      info('Floor labels with F1/BOSS format found ✓');
    }
  }

  // Check nodes visible
  const mapNodes = await page.$$('.map-node');
  info(`Map nodes found: ${mapNodes.length}`);
  if (mapNodes.length === 0) {
    bug('3. Map Nodes', 'Map nodes visible (.map-node elements)', 'No .map-node elements found');
  } else {
    info(`${mapNodes.length} map nodes rendered ✓`);
  }

  // Check HP, Gold, Deck count
  const mapHp = await page.textContent('#map-hp').catch(() => null);
  const mapGold = await page.textContent('#map-gold').catch(() => null);
  const mapDeckCount = await page.textContent('#map-deck-count').catch(() => null);
  info(`Map stats: HP=${mapHp}, Gold=${mapGold}, Deck=${mapDeckCount}`);

  if (!mapHp || mapHp === '—' || mapHp.trim() === '') {
    bug('3. Map HP Stat', 'HP stat shows actual HP value', `HP stat shows "${mapHp}"`);
  } else {
    info(`Map HP display OK: "${mapHp}" ✓`);
  }
  if (!mapGold || mapGold === '—' || mapGold.trim() === '') {
    bug('3. Map Gold Stat', 'Gold stat shows actual gold value', `Gold stat shows "${mapGold}"`);
  } else {
    info(`Map Gold display OK: "${mapGold}" ✓`);
  }
  if (!mapDeckCount || mapDeckCount === '—' || mapDeckCount.trim() === '') {
    bug('3. Map Deck Count', 'Deck count shows card count', `Deck count shows "${mapDeckCount}"`);
  } else {
    info(`Map Deck Count display OK: "${mapDeckCount}" ✓`);
  }

  // Check tooltip element exists in DOM (hover CSS is hard to test in headless)
  const tooltipEls = await page.$$('.node-tooltip');
  info(`Node tooltip elements in DOM: ${tooltipEls.length}`);
  if (tooltipEls.length === 0) {
    bug('3. Node Tooltip', 'Tooltip element (.node-tooltip) in node markup', 'No .node-tooltip found in any map node');
  } else {
    info('Node tooltip elements present in DOM ✓ (CSS :hover controls visibility)');
    // Try hovering with force to bypass stability check
    try {
      const availableNode = await page.$('.map-node.available');
      if (availableNode) {
        await availableNode.hover({ force: true, timeout: 5000 });
        await wait(400);
        info('Hovered node successfully');
      }
    } catch (e) {
      info(`Note: hover animation prevents stable hover check: ${e.message.substring(0, 100)}`);
    }
  }

  // ─── 4. Enter Combat ─────────────────────────────────────────────────
  info('=== TEST 4: Enter Combat ===');

  // Find available combat node to click
  const combatNodes = await page.$$('.map-node.available.type-combat');
  const anyAvailable = await page.$$('.map-node.available');
  info(`Available combat nodes: ${combatNodes.length}, any available: ${anyAvailable.length}`);

  let enteredCombat = false;

  // Try combat nodes first, then any available
  const nodesToTry = combatNodes.length > 0 ? combatNodes : anyAvailable;

  for (const node of nodesToTry) {
    const nodeType = await node.getAttribute('class').then(c => {
      const m = c?.match(/type-(\w+)/);
      return m ? m[1] : 'unknown';
    }).catch(() => 'unknown');

    info(`Trying to click ${nodeType} node (with force to bypass animation)`);
    await node.click({ force: true });
    await wait(2000);

    const combatNow = await isVisible('screen-combat');
    if (combatNow) {
      enteredCombat = true;
      info(`Entered combat via ${nodeType} node ✓`);
      break;
    }
    // May have entered a different screen - check
    const shopNow = await isVisible('screen-shop');
    const restNow = await isVisible('screen-rest');
    const rewardNow = await isVisible('screen-reward');
    if (shopNow || restNow || rewardNow) {
      info(`Entered ${shopNow ? 'shop' : restNow ? 'rest' : 'reward'} screen instead`);
      break;
    }
    info('Still on map, node may be locked - trying next');
  }

  if (!enteredCombat) {
    // Check if we're on a non-combat screen instead
    const mapStillVisible = await isVisible('screen-map');
    bug('4. Enter Combat', 'Clicking available combat node enters combat screen', `Could not enter combat. Map still visible: ${mapStillVisible}`);
  }

  const combatVisible = await isVisible('screen-combat');
  if (combatVisible) {
    await screenshot('04-combat');

    // Check enemy canvas
    const enemyCanvas = await page.$('#enemy-canvas');
    if (!enemyCanvas) {
      bug('4. Enemy Canvas', 'Enemy canvas (#enemy-canvas) visible in combat', 'Enemy canvas not found');
    } else {
      info('Enemy canvas present ✓');
    }

    // Check enemy HP
    const enemyHpCurrent = await page.textContent('#enemy-hp-current').catch(() => null);
    const enemyHpMax = await page.textContent('#enemy-hp-max').catch(() => null);
    info(`Enemy HP: ${enemyHpCurrent}/${enemyHpMax}`);
    if (!enemyHpCurrent || enemyHpCurrent === '—') {
      bug('4. Enemy HP Display', 'Enemy HP shows a number', `Enemy HP shows "${enemyHpCurrent}"`);
    }

    // Check hand shows cards
    await wait(500); // let deal animation finish
    const handCards = await page.$$('#hand-area .card-component, #hand-area .card');
    info(`Cards in hand: ${handCards.length}`);
    if (handCards.length === 0) {
      // Check hand area HTML
      const handHtml = await page.$eval('#hand-area', el => el.innerHTML.substring(0, 200)).catch(() => '');
      info(`Hand area HTML: ${handHtml}`);
      bug('4. Hand Cards', 'Cards visible in hand area after entering combat', 'No cards visible in hand');
    } else {
      info(`${handCards.length} cards in hand ✓`);
    }

    // Check player HP
    const playerHpCurrent = await page.textContent('#player-hp-current').catch(() => null);
    info(`Player HP: ${playerHpCurrent}`);
    if (!playerHpCurrent || playerHpCurrent === '—') {
      bug('4. Player HP Display', 'Player HP shows a number', `Player HP shows "${playerHpCurrent}"`);
    }

    // ─── 5. Play a Card ─────────────────────────────────────────────
    info('=== TEST 5: Play a Card ===');
    const handCardsBefore = await page.$$('#hand-area .card-component, #hand-area .card');
    const discardBefore = parseInt(await page.textContent('#discard-count').catch(() => '0')) || 0;

    if (handCardsBefore.length > 0) {
      // Find a playable (non-unplayable) card
      let playableCard = null;
      for (const card of handCardsBefore) {
        const isUnplayable = await card.evaluate(el => el.classList.contains('unplayable')).catch(() => false);
        if (!isUnplayable) {
          playableCard = card;
          break;
        }
      }

      if (playableCard) {
        const cardName = await playableCard.$eval('.card-name, [class*="name"]', el => el.textContent).catch(() => 'unknown');
        info(`Playing card: "${cardName}"`);
        // Use direct JS click to avoid animation stability issues
        await page.evaluate(() => {
          const card = document.querySelector('#hand-area .card-component:not(.unplayable)');
          if (card) card.click();
        });
        await wait(800);
        await screenshot('05-after-card-play');

        const handCardsAfter = await page.$$('#hand-area .card-component, #hand-area .card');
        const discardAfter = parseInt(await page.textContent('#discard-count').catch(() => '0')) || 0;
        info(`Hand before: ${handCardsBefore.length}, after: ${handCardsAfter.length}`);
        info(`Discard before: ${discardBefore}, after: ${discardAfter}`);

        if (handCardsAfter.length >= handCardsBefore.length && discardAfter <= discardBefore) {
          bug('5. Card Leaves Hand', 'Card leaves hand after being played (hand count decreases or discard increases)', `Hand count stayed ${handCardsAfter.length}, discard stayed ${discardAfter}`);
        } else {
          info('Card successfully played - hand changed ✓');
        }
      } else {
        bug('5. Playable Card', 'At least one playable card in hand (not unplayable)', 'All cards in hand are marked unplayable');
      }
    } else {
      bug('5. Play Card', 'Cards available to play in hand', 'No cards in hand');
    }

    // ─── 6. End Turn ─────────────────────────────────────────────────
    info('=== TEST 6: End Turn ===');
    const turnBefore = await page.textContent('#combat-turn-label').catch(() => null);
    info(`Turn before: ${turnBefore}`);

    const endTurnBtn = await page.$('#end-turn-btn');
    if (!endTurnBtn) {
      bug('6. End Turn Button', '#end-turn-btn exists in combat', 'End Turn button not found in DOM');
    } else {
      await endTurnBtn.click();
      await wait(2500); // wait for enemy turn animation

      await screenshot('06-after-end-turn');

      const turnAfter = await page.textContent('#combat-turn-label').catch(() => null);
      info(`Turn after end turn: ${turnAfter}`);

      const newHandCards = await page.$$('#hand-area .card-component, #hand-area .card');
      info(`Cards in hand after new turn: ${newHandCards.length}`);
      if (newHandCards.length === 0) {
        bug('6. Draw After End Turn', 'Cards drawn at start of new turn', 'No cards in hand after ending turn and starting new turn');
      } else {
        info('New cards drawn after end turn ✓');
      }
    }

    // Test keyboard E shortcut
    info('Testing keyboard E shortcut for end turn');
    const turnBeforeE = await page.textContent('#combat-turn-label').catch(() => '');
    await page.keyboard.press('e');
    await wait(2500);
    const turnAfterE = await page.textContent('#combat-turn-label').catch(() => '');
    info(`Turn before E: "${turnBeforeE}", after E: "${turnAfterE}"`);
    // We can't easily verify turn number changed without knowing format, but no error = ok

    // Test keyboard 1 shortcut for first card
    info('Testing keyboard "1" shortcut for first card');
    const handBeforeKey = await page.$$('#hand-area .card-component:not(.unplayable), #hand-area .card:not(.unplayable)');
    if (handBeforeKey.length > 0) {
      const discardBeforeKey = parseInt(await page.textContent('#discard-count').catch(() => '0')) || 0;
      await page.keyboard.press('1');
      await wait(800);
      const discardAfterKey = parseInt(await page.textContent('#discard-count').catch(() => '0')) || 0;
      info(`Discard before "1" press: ${discardBeforeKey}, after: ${discardAfterKey}`);
      if (discardAfterKey > discardBeforeKey) {
        info('Keyboard "1" shortcut plays first card ✓');
      } else {
        // Could be exhaust card - check exhaust count
        const handAfterKey = await page.$$('#hand-area .card-component, #hand-area .card');
        if (handAfterKey.length < handBeforeKey.length) {
          info('Keyboard "1" shortcut plays first card (card exhausted or otherwise removed) ✓');
        } else {
          bug('13. Keyboard "1" Shortcut', '"1" key plays first card in hand', 'Card count did not decrease after pressing "1"');
        }
      }
    }

    // ─── 7. Win Combat ───────────────────────────────────────────────
    info('=== TEST 7: Win Combat ===');

    for (let turn = 0; turn < 15; turn++) {
      const stillInCombat = await isVisible('screen-combat');
      if (!stillInCombat) {
        info(`Combat ended at turn ${turn}`);
        break;
      }

      // Play all playable cards via JS evaluate to avoid stale element issues
      const enemyHpNow = await page.textContent('#enemy-hp-current').catch(() => '?');
      const playResult = await page.evaluate(async () => {
        const cards = Array.from(document.querySelectorAll('#hand-area .card-component:not(.unplayable)'));
        let played = 0;
        for (const card of cards) {
          card.click();
          played++;
          await new Promise(r => setTimeout(r, 350));
          if (document.getElementById('screen-combat')?.classList.contains('hidden')) break;
        }
        return { played, hp: document.getElementById('enemy-hp-current')?.textContent };
      });
      info(`Turn ${turn + 1}: Played ${playResult.played} cards, enemy_hp before=${enemyHpNow} after=${playResult.hp}`);

      await wait(300);
      const combatAfterCards = await isVisible('screen-combat');
      if (!combatAfterCards) {
        info(`Combat ended after playing cards at turn ${turn + 1}`);
        break;
      }
      const endBtn = await page.$('#end-turn-btn');
      const endBtnDisabled = await endBtn?.evaluate(el => el.disabled).catch(() => false);
      if (!endBtnDisabled) {
        await page.evaluate(() => document.getElementById('end-turn-btn')?.click());
        await wait(2500);
      }
    }

    await screenshot('07-after-combat');

    // Check for reward screen
    const rewardVisible = await isVisible('screen-reward');
    if (!rewardVisible) {
      const stillCombat = await isVisible('screen-combat');
      bug('7. Win Combat Reward', 'Reward screen shown after defeating enemy', `After 15 turns: reward=${rewardVisible}, combat=${stillCombat}`);
    } else {
      info('Reward screen shown after combat victory ✓');
      await screenshot('07-reward');

      // Check reward cards
      const rewardCards = await page.$$('#reward-cards-row > *');
      info(`Reward card options: ${rewardCards.length}`);
      if (rewardCards.length === 0) {
        bug('7. Reward Cards', 'Card options shown on reward screen', 'No card options in #reward-cards-row');
      }

      // Check for confetti (canvas or particle elements)
      const confettiCanvas = await page.$('canvas.confetti, #confetti, [id*="confetti"], [class*="confetti"]');
      if (!confettiCanvas) {
        info('NOTE: No confetti canvas/element found - may use CSS animation or not implemented');
      } else {
        info('Confetti element found ✓');
      }

      // ─── 8. Card Pick Animation ───────────────────────────────────
      info('=== TEST 8: Card Pick Animation ===');
      if (rewardCards.length > 0) {
        await rewardCards[0].click();
        await wait(1200);
        await screenshot('08-after-card-pick');
        // After picking, we should be back on map or reward screen dismissed
        const mapAfterPick = await isVisible('screen-map');
        const rewardAfterPick = await isVisible('screen-reward');
        info(`After picking reward card: map=${mapAfterPick}, reward=${rewardAfterPick}`);
        if (!mapAfterPick && rewardAfterPick) {
          // Still on reward - may need to skip remaining rewards
          info('Still on reward screen after card pick');
        }
      }
    }
  } else {
    // If we couldn't enter combat, try to still test other screens
    info('Not in combat - skipping combat tests 4-8');
    bug('4-8. Combat Tests Skipped', 'Was able to enter combat for tests', 'Combat screen never reached');
  }

  // ─── Navigate back to map for remaining tests ────────────────────────
  await wait(1000);
  let onMap = await isVisible('screen-map');
  if (!onMap) {
    // Try skip button
    await page.click('#reward-skip-btn').catch(() => {});
    await wait(800);
    onMap = await isVisible('screen-map');
  }
  info(`On map for remaining tests: ${onMap}`);

  // ─── 9. Shop ─────────────────────────────────────────────────────────
  info('=== TEST 9: Shop ===');
  onMap = await isVisible('screen-map');

  if (onMap) {
    // Try to find and click a shop node
    const shopNodes = await page.$$('.map-node.available.type-shop');
    info(`Available shop nodes: ${shopNodes.length}`);

    if (shopNodes.length > 0) {
      await shopNodes[0].click({ force: true });
      await wait(2000);
    } else {
      info('No available shop node - cannot test shop screen this run');
    }
  }

  const shopVisible = await isVisible('screen-shop');
  if (shopVisible) {
    info('Shop screen visible ✓');
    await screenshot('09-shop');

    // Check warm background tint
    const shopBgColor = await page.$eval('#screen-shop', el => window.getComputedStyle(el).background).catch(() => '');
    info(`Shop background: ${shopBgColor.substring(0, 150)}`);
    // Check for warm color presence
    const hasWarmTint = shopBgColor.includes('rgba') || shopBgColor.includes('rgb');
    info(`Shop has background styling: ${hasWarmTint}`);

    // Check service buttons have class shop-service-btn (not plain .btn)
    const serviceBtns = await page.$$('#shop-services-row .shop-service-btn');
    const plainBtns = await page.$$('#shop-services-row .btn:not(.shop-service-btn)');
    info(`Service buttons with .shop-service-btn: ${serviceBtns.length}`);
    info(`Plain .btn service buttons: ${plainBtns.length}`);

    if (serviceBtns.length === 0 && plainBtns.length === 0) {
      bug('9. Shop Services', 'Service buttons visible in shop', 'No service buttons found in #shop-services-row');
    } else if (plainBtns.length > 0) {
      bug('9. Shop Service Button Style', 'Service buttons use .shop-service-btn class (not plain .btn)', `${plainBtns.length} plain .btn service buttons found instead`);
    } else {
      info(`${serviceBtns.length} shop service buttons with correct class ✓`);
    }

    // Check shop cards
    const shopCards = await page.$$('#shop-cards-row > *');
    info(`Shop cards for sale: ${shopCards.length}`);
    if (shopCards.length === 0) {
      bug('9. Shop Cards', 'Cards for sale visible in shop', 'No cards in #shop-cards-row');
    }

    await page.click('#shop-leave-btn').catch(() => {});
    await wait(1000);
  } else {
    info('Shop screen not reached (may not have had available shop node)');
  }

  // ─── 10. Campfire ────────────────────────────────────────────────────
  info('=== TEST 10: Campfire ===');
  onMap = await isVisible('screen-map');

  if (onMap) {
    const restNodes = await page.$$('.map-node.available.type-rest');
    info(`Available campfire/rest nodes: ${restNodes.length}`);

    if (restNodes.length > 0) {
      await restNodes[0].click({ force: true });
      await wait(2000);
    } else {
      info('No available rest node - cannot test campfire this run');
    }
  }

  const campfireVisible = await isVisible('screen-rest');
  if (campfireVisible) {
    info('Campfire screen visible ✓');
    await screenshot('10-campfire');

    // Check flame animation - should be #campfire-flames with .flame children
    const flamesEl = await page.$('#campfire-flames');
    if (!flamesEl) {
      bug('10. Campfire Flames', 'Flame animation element (#campfire-flames) present', 'No #campfire-flames element found');
    } else {
      const flameChildren = await page.$$('#campfire-flames .flame');
      info(`Flame elements in campfire: ${flameChildren.length}`);
      if (flameChildren.length === 0) {
        bug('10. Campfire Flame Tongues', '.flame child elements inside #campfire-flames', 'No .flame children found');
      } else {
        info(`${flameChildren.length} flame elements found ✓`);
      }
    }

    // Check option buttons have icons and names (rest-option-btn with rest-option-icon and rest-option-name)
    const optionBtns = await page.$$('#rest-options-row .rest-option-btn');
    const genericBtns = await page.$$('#rest-options-row .btn:not(.rest-option-btn)');
    info(`Campfire option buttons (.rest-option-btn): ${optionBtns.length}`);
    info(`Generic .btn campfire options: ${genericBtns.length}`);

    if (optionBtns.length === 0 && genericBtns.length === 0) {
      bug('10. Campfire Options', 'Option buttons visible at campfire', 'No option buttons found in #rest-options-row');
    } else if (genericBtns.length > 0) {
      bug('10. Campfire Button Style', 'Options use .rest-option-btn (with icon + name)', `${genericBtns.length} plain .btn options without proper structure`);
    } else {
      info(`${optionBtns.length} properly structured campfire option buttons ✓`);
      for (const btn of optionBtns) {
        const icon = await btn.$('.rest-option-icon');
        const name = await btn.$('.rest-option-name');
        const btnText = await btn.textContent();
        info(`Campfire option: "${btnText?.trim().substring(0, 60)}"`);
        if (!icon) bug('10. Campfire Option Icon', 'Each option button has .rest-option-icon', `Option "${btnText?.trim().substring(0,30)}" missing icon`);
        if (!name) bug('10. Campfire Option Name', 'Each option button has .rest-option-name', `Option "${btnText?.trim().substring(0,30)}" missing name`);
      }
    }

    // Go back
    await page.click('#reward-skip-btn').catch(() => {});
    await wait(500);
  } else {
    info('Campfire screen not reached');
  }

  // ─── 11. Event ───────────────────────────────────────────────────────
  info('=== TEST 11: Event ===');
  onMap = await isVisible('screen-map');

  if (onMap) {
    const eventNodes = await page.$$('.map-node.available.type-event');
    info(`Available event nodes: ${eventNodes.length}`);

    if (eventNodes.length > 0) {
      await eventNodes[0].click({ force: true });
      await wait(2000);
    } else {
      info('No available event node - cannot test event screen this run');
    }
  }

  const eventScreenVisible = await isVisible('screen-reward');
  const eventPanelVisible = await isVisible('event-panel');
  if (eventScreenVisible && eventPanelVisible) {
    info('Event screen visible ✓');
    await screenshot('11-event');

    const eventTitle = await page.textContent('#event-title').catch(() => null);
    const eventText = await page.textContent('#event-text').catch(() => null);
    info(`Event title: "${eventTitle}"`);
    info(`Event text (first 100): "${eventText?.substring(0, 100)}"`);

    // Check text fade-in (has CSS animation class or opacity)
    const eventTextEl = await page.$('#event-text');
    const eventTextStyle = await eventTextEl?.evaluate(el => {
      const s = window.getComputedStyle(el);
      return { animation: s.animation, opacity: s.opacity, transition: s.transition };
    }).catch(() => null);
    info(`Event text style: ${JSON.stringify(eventTextStyle)}`);

    // Check choice buttons have icons
    const choiceBtns = await page.$$('#event-choices > *');
    info(`Event choices: ${choiceBtns.length}`);
    if (choiceBtns.length === 0) {
      bug('11. Event Choices', 'Choice buttons visible in event', 'No elements in #event-choices');
    } else {
      for (const btn of choiceBtns) {
        const btnHtml = await btn.innerHTML().catch(() => '');
        const btnText = await btn.textContent().catch(() => '');
        info(`Event choice: "${btnText?.trim().substring(0, 60)}"`);
        // Check for icon element
        const hasIcon = btnHtml.includes('event-choice-icon') || btnHtml.includes('icon') || /[\u{1F000}-\u{1FFFF}]/u.test(btnText || '');
        if (!hasIcon) {
          info(`NOTE: Event choice may not have explicit icon: "${btnText?.trim().substring(0, 40)}"`);
        }
      }
    }
  } else {
    info('Event screen not reached');
  }

  // ─── 12. Deck Overlay ────────────────────────────────────────────────
  info('=== TEST 12: Deck Overlay ===');

  // Make sure we're on map
  onMap = await isVisible('screen-map');
  if (!onMap) {
    // Navigate away and get fresh run if needed
    await page.goto(BASE);
    await wait(500);
    await page.evaluate(() => {
      const saved = localStorage.getItem('drawforge_save') || localStorage.getItem('drawforge-run');
      if (saved) {
        // We have a save, click continue
      }
    });
    await page.click('#start-new-run-btn').catch(() => {});
    await wait(1500);
    // If deck choice shown, pick first
    const dcVisible = await isVisible('screen-deck-choice');
    if (dcVisible) {
      const firstOpt = await page.$('#deck-choice-row > *');
      if (firstOpt) { await firstOpt.click(); await wait(1500); }
    }
    onMap = await isVisible('screen-map');
  }

  if (onMap) {
    await page.click('#map-deck-btn');
    await wait(500);
    await screenshot('12-deck-overlay');

    const deckOverlayHidden = await page.$eval('#deck-overlay', el => el.classList.contains('hidden')).catch(() => true);
    if (deckOverlayHidden) {
      bug('12. Deck Overlay Opens', 'Deck overlay opens when clicking "View Deck"', 'Deck overlay still has .hidden class after clicking button');
    } else {
      info('Deck overlay opened ✓');

      // Check sort toggle
      const sortBtn = await page.$('#deck-sort-btn');
      if (!sortBtn) {
        const deckPanelHtml = await page.$eval('#deck-panel', el => el.innerHTML.substring(0, 400)).catch(() => '');
        info(`Deck panel HTML: ${deckPanelHtml}`);
        bug('12. Sort Toggle Button', 'Sort toggle button (#deck-sort-btn) in deck overlay', 'No #deck-sort-btn found');
      } else {
        const sortBtnText = await sortBtn.textContent();
        info(`Sort button text: "${sortBtnText}" ✓`);

        // Test sorting - click sort button
        await sortBtn.click();
        await wait(300);
        const sortBtnAfter = await page.textContent('#deck-sort-btn').catch(() => '');
        info(`Sort button after click: "${sortBtnAfter}"`);
        if (sortBtnAfter === sortBtnText) {
          bug('12. Sort Toggle Cycles', 'Sort button text changes when clicked (Type→Cost or Cost→Type)', 'Sort button text did not change after clicking');
        } else {
          info('Sort button cycles modes ✓');
        }
      }

      // Check summary line
      const summaryEl = await page.$('#deck-summary');
      if (!summaryEl) {
        bug('12. Deck Summary', 'Summary element (#deck-summary) with "X cards · XA XS..." format', 'No #deck-summary element found');
      } else {
        const summaryText = await summaryEl.textContent();
        info(`Deck summary: "${summaryText}" ✓`);
        const hasSummaryFormat = /\d+ cards/.test(summaryText) && summaryText.includes('·');
        if (!hasSummaryFormat) {
          bug('12. Deck Summary Format', 'Summary reads "X cards · XA XS..."', `Summary shows "${summaryText}"`);
        }
      }

      // Check deck cards rendered
      const deckCards = await page.$$('#deck-panel-cards > *');
      info(`Items in deck panel: ${deckCards.length}`);

      // Test Escape closes overlay
      await page.keyboard.press('Escape');
      await wait(400);
      const closedByEsc = await page.$eval('#deck-overlay', el => el.classList.contains('hidden')).catch(() => false);
      if (!closedByEsc) {
        bug('13. Escape Closes Deck', 'Escape key closes deck overlay', 'Escape did not close deck overlay');
      } else {
        info('Escape closes deck overlay ✓');
      }
    }
  } else {
    info('Not on map - skipping deck overlay test');
  }

  // ─── 13. Keyboard Shortcuts in Combat ────────────────────────────────
  info('=== TEST 13: Keyboard Shortcuts Summary ===');
  info('E key (end turn) - tested in step 6');
  info('1 key (play first card) - tested in step 5/6');
  info('Escape (close deck) - tested in step 12');

  // ─── Summary ────────────────────────────────────────────────────────
  info('\n');
  console.log('========================================');
  console.log('FINAL BUGS REPORT');
  console.log('========================================');
  console.log(`Total bugs found: ${BUGS.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Console warnings: ${consoleWarnings.length}`);

  if (BUGS.length > 0) {
    console.log('\nBUGS:');
    BUGS.forEach((b, i) => {
      console.log(`\nBUG ${i + 1}: ${b.step}`);
      console.log(`  Expected: ${b.expected}`);
      console.log(`  Actual:   ${b.actual}`);
    });
  }

  if (consoleErrors.length > 0) {
    console.log('\nCONSOLE ERRORS:');
    consoleErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  }

  await browser.close();
  return { bugs: BUGS, consoleErrors, consoleWarnings };
}

run().catch(err => {
  console.error('Test runner error:', err);
  if (browser) browser.close();
  process.exit(1);
});
