const fs = require("fs");
const path = require("path");

const playJs = fs.readFileSync(path.join(__dirname, "..", "browser", "play.js"), "utf8");
const playCss = fs.readFileSync(path.join(__dirname, "..", "browser", "play.css"), "utf8");
const soundEngineJs = fs.readFileSync(path.join(__dirname, "..", "browser", "soundEngine.js"), "utf8");

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
    expect(playJs).toContain('"/run/new.json"');
    expect(playJs).toContain('JSON.stringify({ ascensionLevel: getStoredAscensionLevel() })');
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

  it("supports active hand-card focus states for readability and keyboard play", () => {
    expect(playJs).toContain('function setActiveHandCard(handArea, activeEl = null)');
    expect(playJs).toContain('cardEl.addEventListener("focus", () => setActiveHandCard(handArea, cardEl));');
    expect(playJs).toContain('cardEl.addEventListener("mouseenter", () => setActiveHandCard(handArea, cardEl));');
    expect(playJs).toContain('div.addEventListener("keydown", (event) => {');
    expect(playJs).toContain('if (event.key === "Enter" || event.key === " ")');
  });

  it("supports click-to-select and drag-up-to-play hand interactions", () => {
    expect(playJs).toContain('let selectedHandCardIndex = null;');
    expect(playJs).toContain('function setSelectedHandCard(handArea, handIndex, cardEl, card) {');
    expect(playJs).toContain('selectedHandCardIndex = handIndex;');
    expect(playJs).toContain('el.classList.toggle("is-selected", idx === handIndex);');
    expect(playJs).toContain('function bindHandCardInteraction({ handArea, cardEl, card, idx, canAfford }) {');
    expect(playJs).toContain('cardEl.addEventListener("pointerdown", (event) => {');
    expect(playJs).toContain('cardEl.addEventListener("pointermove", (event) => {');
    expect(playJs).toContain('const shouldPlay = draggedFarEnough && deltaY <= -90 && card.type !== "attack";');
    expect(playJs).toContain('await playCard(idx, cardEl);');
  });

  it("requires enemy target confirmation for selected attack cards", () => {
    expect(playJs).toContain('function getSelectedCombatCard() {');
    expect(playJs).toContain('function syncCombatSelectionState(combat = currentRun?.combat) {');
    expect(playJs).toContain('const selectedCard = getSelectedCombatCard();');
    expect(playJs).toContain('const enemyTargetingActive = combat?.turn === "player" && selectedCard?.type === "attack" && combat?.state === "active";');
    expect(playJs).toContain('enemyPanel.classList.toggle("targetable", enemyTargetingActive);');
    expect(playJs).toContain('enemyPanel.classList.toggle("target-selected", enemyTargetingActive);');
    expect(playJs).toContain('setCombatStateMessage("Target locked · click the enemy to strike", "player")');
    expect(playJs).toContain('enemyPanel.onclick = enemyTargetingActive');
    expect(playJs).toContain('playCard(targetIndex, targetCardEl || null);');
  });

  it("shows selected-card outcome previews for damage, block, and status effects", () => {
    expect(playJs).toContain('function buildCardPreviewSummary(card, combat) {');
    expect(playJs).toContain('if (totalDamage > 0) parts.push(`Deal ${totalDamage}`);');
    expect(playJs).toContain('parts.push(`Gain ${blockGain} block`);');
    expect(playJs).toContain('if (card.hex) parts.push(`Apply ${card.hex} Hex`);');
    expect(playJs).toContain('if (card.applyPoison) parts.push(`Apply ${card.applyPoison} Poison`);');
    expect(playJs).toContain('if (card.applyBurn) parts.push(`Apply ${card.applyBurn} Burn`);');
    expect(playJs).toContain('function renderCardSelectionPreview(card, combat) {');
    expect(playJs).toContain('chip.className = "combat-preview-chip hidden";');
    expect(playJs).toContain('renderCardSelectionPreview(selectedCard, combat);');
  });

  it("applies an adaptive arced hand layout for dense combat hands", () => {
    expect(playJs).toContain('function applyHandArc(handArea) {');
    expect(playJs).toContain('const compact = n >= 8 || width < 980;');
    expect(playJs).toContain('const overlapPx = n <= 4 ? 0 : Math.min(44, 8 + (n - 4) * 6);');
    expect(playJs).toContain('handArea.style.setProperty("--hand-count", String(n));');
    expect(playJs).toContain('handArea.style.setProperty("--hand-overlap", `${overlapPx}px`);');
    expect(playJs).toContain('handArea.classList.toggle("hand-dense", compact);');
    expect(playJs).toContain('card.style.marginLeft = i === 0 ? "0px" : `-${overlapPx}px`;');
    expect(playJs).toContain('requestAnimationFrame(() => applyHandArc(handArea));');
  });

  it("uses a shared upgraded card component across hand, rewards, deck, and removal flows", () => {
    expect(playJs).toContain('function makeCard(card, opts = {}) {');
    expect(playJs).toContain('"card-component"');
    expect(playJs).toContain('`rarity-${card.rarity || "common"}`');
    expect(playJs).toContain('const cardType = card.type || "skill";');
    expect(playJs).toContain('const frameVariant = resolveCardFrameVariant(card, themeId);');
    expect(playJs).toContain('`type-${cardType}`');
    expect(playJs).toContain('unplayable ? "unplayable" : ""');
    expect(playJs).toContain('div.dataset.theme = themeId;');
    expect(playJs).toContain('div.dataset.frameVariant = frameVariant;');
    expect(playJs).toContain('stripe.dataset.frameVariant = frameVariant;');
    expect(playJs).toContain('costDiv.className = `card-cost cost-${costVal}`;');
    expect(playJs).toContain('canvas.className = "card-art-canvas"');
    expect(playJs).toContain('nameDiv.className = "card-name"');
    expect(playJs).toContain('descDiv.className = "card-desc"');
    expect(playJs).toContain('div.tabIndex = 0;');
    expect(playJs).toContain('div.setAttribute("role", "button");');
    expect(playJs).toContain('container.appendChild(makeCard(card, { dealDelay: -1 }));');
    expect(playJs).toContain('cardsRow.appendChild(makeCard(card, { dealDelay: -1 }));');
    expect(playJs).toContain('cards.forEach((card) => grid.appendChild(makeCard(card, { dealDelay: -1 })));');
    expect(playJs).toContain('const cardEl = makeCard(card, {');
  });

  it("covers tooltip and inspection systems across combat, map, and relic UI surfaces", () => {
    expect(playJs).toContain('function renderRulesText(targetEl, text) {');
    expect(playJs).toContain('keywordEl.className = "keyword-term"');
    expect(playJs).toContain('tooltip.className = "keyword-tooltip"');
    expect(playJs).toContain('tip.className = "node-tooltip"');
    expect(playJs).toContain('tipEl.className = "status-tooltip"');
    expect(playJs).toContain('tip.className = "relic-tooltip"');
    expect(playJs).toContain('buttonEl.onclick = () => showPileModal(label, pile);');
    expect(playJs).toContain('badge.addEventListener("click", () => openRelicOverlay(relic.id));');
    expect(playJs).toContain('openRelicOverlay(highlightRelicId = null)');
  });

  it("applies theme-aware surface and frame variants across run screens", () => {
    expect(playJs).toContain('const VISUAL_THEMES = {');
    expect(playJs).toContain('function getRunThemeId(run = currentRun) {');
    expect(playJs).toContain('function resolveCardFrameVariant(card = {}, themeId = getRunThemeId()) {');
    expect(playJs).toContain('function applySurfaceTheme({ run = currentRun, screen = "map", nodeType = null } = {}) {');
    expect(playJs).toContain('document.body.dataset.theme = theme.id;');
    expect(playJs).toContain('document.body.dataset.themePanel = theme.panel;');
    expect(playJs).toContain('document.body.dataset.themeAccent = theme.accent;');
    expect(playJs).toContain('applySurfaceTheme({ run: currentRun, screen: "map", nodeType: currentRun.currentNodeType || "combat" });');
    expect(playJs).toContain('applySurfaceTheme({ run: currentRun, screen: "combat", nodeType: currentRun.combat?.nodeType || "combat" });');
    expect(playJs).toContain('applySurfaceTheme({ run: currentRun, screen: "shop", nodeType: "shop" });');
    expect(playJs).toContain('applySurfaceTheme({ run: currentRun, screen: "rest", nodeType: "rest" });');
  });

  it("persists ascension progression and shows it in the run UI", () => {
    expect(playJs).toContain('const ASCENSION_KEY = "drawforge_ascension";');
    expect(playJs).toContain('const WINS_KEY = "drawforge_wins";');
    expect(playJs).toContain('function getStoredAscensionLevel() {');
    expect(playJs).toContain('function recordAscensionVictory(run) {');
    expect(playJs).toContain('`Choose Your Starting Deck · Ascension ${currentRun?.ascensionLevel || 0}`');
    expect(playJs).toContain('ascensionBadge.textContent = `Ascension ${currentRun?.ascensionLevel || 0}`;');
    expect(playJs).toContain('`Ascension ${getStoredAscensionLevel()} selected · highest unlocked ${unlockedAscension} · total wins ${getStoredWins()}`');
    expect(playJs).toContain('`Ascension: <strong>${currentRun.ascensionLevel || 0}</strong>`');
    expect(playJs).toContain('`Best ascension: <strong>${ascensionResult.unlockedAscension}</strong>`');
    expect(playJs).toContain('`Total wins: <strong>${ascensionResult.totalWins}</strong>`');
  });

  it("renders post-combat reward cards with the shared large card component and claim interaction", () => {
    expect(playJs).toContain('async function continueRewardFlow() {');
    expect(playJs).toContain('clearSelectedHandCard();');
    expect(playJs).toContain('hide("reward-content", "event-panel", "relic-choice-panel", "removal-panel");');
    expect(playJs).toContain('show("reward-actions-row", "reward-continue-btn");');
    expect(playJs).toContain('hide("reward-skip-btn");');
    expect(playJs).toContain('const cardRow = $id("reward-cards-row");');
    expect(playJs).toContain('const el = makeCard(card, {');
    expect(playJs).toContain('large: true,');
    expect(playJs).toContain('dealDelay: i * 80,');
    expect(playJs).toContain('el.classList.add("card-picked");');
    expect(playJs).toContain('currentRun = await api("/run/claim-card.json", { run: currentRun, cardId: card.id });');
    expect(playJs).toContain('show("relic-choice-panel", "reward-actions-row", "reward-continue-btn");');
    expect(playJs).toContain('$id("reward-continue-btn").textContent = "Skip Relic";');
    expect(playJs).toContain('show("reward-content", "reward-actions-row", "reward-continue-btn", "reward-skip-btn");');
    expect(playJs).toContain('$id("reward-header").textContent = "Reward Claimed";');
    expect(playJs).toContain('$id("reward-continue-btn")?.addEventListener("click", async () => {');
    expect(playJs).toContain('await continueRewardFlow();');
    expect(playJs).toContain('el.classList.add("reward-item");');
    expect(playJs).toContain('cardRow.appendChild(el);');
  });

  it("supports deck and library overlay browsing with shared card rendering", () => {
    expect(playJs).toContain('let deckFilterMode = "all";');
    expect(playJs).toContain('let deckOverlayMode = "deck";');
    expect(playJs).toContain('function getLibraryCards() {');
    expect(playJs).toContain('filter((card) => card && !card.id.endsWith("_plus"))');
    expect(playJs).toContain('function openDeckOverlay(mode = "deck") {');
    expect(playJs).toContain('const cards = mode === "library" ? getLibraryCards() : getDeckCards();');
    expect(playJs).toContain('countLabel.textContent = mode === "library"');
    expect(playJs).toContain('modeBar.id = "deck-mode-bar";');
    expect(playJs).toContain('btn.className = "deck-mode-btn";');
    expect(playJs).toContain('filterBar.id = "deck-filter-bar";');
    expect(playJs).toContain('["all", "attack", "skill", "power", "curse"].forEach((type) => {');
    expect(playJs).toContain('btn.className = "deck-filter-btn";');
    expect(playJs).toContain('deckFilterMode = type;');
    expect(playJs).toContain('const filteredCards = deckFilterMode === "all"');
    expect(playJs).toContain('const sorted = [...filteredCards];');
    expect(playJs).toContain('$id("map-library-btn")?.addEventListener("click", () => openDeckOverlay("library"));');
    expect(playJs).toContain('$id("combat-library-btn")?.addEventListener("click", () => openDeckOverlay("library"));');
  });

  it("supports relic inspection controls from map and combat surfaces", () => {
    expect(playJs).toContain('$id("map-relics-btn")?.addEventListener("click", () => openRelicOverlay());');
    expect(playJs).toContain('$id("combat-relics-btn")?.addEventListener("click", () => openRelicOverlay());');
    expect(playJs).toContain('$id("relic-close-btn")?.addEventListener("click", () => hide("relic-overlay"));');
    expect(playJs).toContain('hide("relic-overlay");');
  });

  it("renders the combat HUD, hand, piles, relic bar, combat log, and end-turn control from dedicated regions", () => {
    expect(playJs).toContain('renderRelicStrip("combat-relic-strip", currentRun.relics || []);');
    expect(playJs).toContain('function makeRelicTooltip(relic, isTriggered = false) {');
    expect(playJs).toContain('badge.addEventListener("click", () => openRelicOverlay(relic.id));');
    expect(playJs).toContain('function openRelicOverlay(highlightRelicId = null) {');
    expect(playJs).toContain('$id("player-hp-current").textContent = combat.player.health;');
    expect(playJs).toContain('renderEnergyPips(combat.player.energy');
    expect(playJs).toContain('renderBadgesAnimated("player-badges", [');
    expect(playJs).toContain('renderCombatLog(combat);');
    expect(playJs).toContain('pileSetup("draw-pile-btn", "draw-count", combat.drawPile || [], "Draw Pile");');
    expect(playJs).toContain('pileSetup("discard-pile-btn", "discard-count", combat.discardPile || [], "Discard Pile");');
    expect(playJs).toContain('pileSetup("exhaust-pile-btn", "exhaust-count", combat.exhaustPile || [], "Exhaust Pile");');
    expect(playJs).toContain('const handArea = $id("hand-area");');
    expect(playJs).toContain('const endBtn = $id("end-turn-btn");');
    expect(playJs).toContain('endBtn.textContent = combat.state === "victory"');
    expect(playJs).toContain(': "End Turn";');
  });

  it("renders enemy intent and panel state from live combat data", () => {
    expect(playJs).toContain('function renderIntent(intent) {');
    expect(playJs).toContain('const box = $id("intent-box");');
    expect(playJs).toContain('const actionEl = $id("intent-action");');
    expect(playJs).toContain('const icon = ICONS[intent.type] || "❓";');
    expect(playJs).toContain('$id("enemy-hp-current").textContent = Math.max(0, combat.enemy.health);');
    expect(playJs).toContain('renderBadgesAnimated("enemy-badges", [');
    expect(playJs).toContain('value: combat.enemy.poison || 0');
    expect(playJs).toContain('value: combat.enemy.burn || 0');
    expect(playJs).toContain('renderIntent(combat.enemyIntent);');
  });

  it("renders relic badges with tooltip content and triggered-state feedback", () => {
    expect(playJs).toContain('function makeRelicBadge(relic) {');
    expect(playJs).toContain('badge.className = `relic-badge rarity-${relic.rarity || "common"}`;');
    expect(playJs).toContain('function makeRelicTooltip(relic, isTriggered = false) {');
    expect(playJs).toContain('tip.className = "relic-tooltip";');
    expect(playJs).toContain('modeChip.textContent = getRelicModeLabel(relic);');
    expect(playJs).toContain('setCombatStateMessage(`Relic triggered · ${triggeredNames.join(", ")}`, "relic")');
    expect(playJs).toContain('badges[idx].classList.add("relic-triggered");');
  });

  it("surfaces combat feedback for block, energy, draw, status, and relic-trigger deltas", () => {
    expect(playJs).toContain('function showCombatDeltaFeedback({');
    expect(playJs).toContain('const playerHealGain = Math.max(0, (nextPlayer.health || 0) - (prevPlayer.health || 0));');
    expect(playJs).toContain('if (playerBlockGain > 0) {');
    expect(playJs).toContain('window.AnimEngine.onDefenseGain(pp.x, pp.y, "block", playerBlockGain);');
    expect(playJs).toContain('if (playerHealGain > 0) {');
    expect(playJs).toContain('floatText(playerPanel, `+${playerHealGain} HP`, "heal");');
    expect(playJs).toContain('window.AnimEngine.onDefenseGain(pp.x, pp.y, "heal", playerHealGain);');
    expect(playJs).toContain('if (energyDelta > 0) floatText(playerPanel, `+${energyDelta} Energy`, "energy");');
    expect(playJs).toContain('if (energyDelta < 0) floatText(playerPanel, `${energyDelta} Energy`, "energy");');
    expect(playJs).toContain('if (cardsDrawn > 0) {');
    expect(playJs).toContain('floatText(playerPanel, `Draw ${cardsDrawn}`, "draw-gain");');
    expect(playJs).toContain('floatText(enemyPanel, `Vulnerable +${(nextEnemy.vulnerable || 0) - (prevEnemy.vulnerable || 0)}`, "status-gain");');
    expect(playJs).toContain('floatText(enemyPanel, `Weak +${(nextEnemy.weak || 0) - (prevEnemy.weak || 0)}`, "status-gain");');
    expect(playJs).toContain('floatText(enemyPanel, `Hex +${(nextEnemy.hex || 0) - (prevEnemy.hex || 0)}`, "status-gain");');
    expect(playJs).toContain('floatText(playerPanel, "Charged", "status-gain");');
    expect(playJs).toContain('setCombatStateMessage(`Relics answered ${playedCard.name}`, "relic")');
    expect(playJs).toContain('showCombatDeltaFeedback({');
    expect(playJs).toContain('treatNextHandAsFreshDraw: true');
  });

  it("keeps hand-card activation working for plain click and keyboard shortcut flows", () => {
    expect(playJs).toContain('let suppressNextClick = false;');
    expect(playJs).toContain('cardEl.addEventListener("click", async () => {');
    expect(playJs).toContain('if (suppressNextClick) {');
    expect(playJs).toContain('await activateCard();');
    expect(playJs).toContain('div.dataset.cardType = cardType;');
    expect(playJs).toContain('function handleCombatShortcutCard(playableIndex) {');
    expect(playJs).toContain('handleCombatShortcutCard(num - 1);');
  });

  it("routes advanced combat VFX hooks through targeting, defense, relic, and result flows", () => {
    expect(playJs).toContain('let lastTargetingFxKey = null;');
    expect(playJs).toContain('window.AnimEngine.onTargetingStart(ep.x, ep.y, selectedCard?.type || "attack");');
    expect(playJs).toContain('window.AnimEngine.onRelicTrigger(playerPos.x, playerPos.y, triggeredNames[0]);');
    expect(playJs).toContain('window.AnimEngine.onDefenseGain(pp.x, pp.y, "block", playerBlockGain);');
    expect(playJs).toContain('window.AnimEngine.onDefenseGain(pp.x, pp.y, "heal", playerHealGain);');
    expect(playJs).toContain('window.AnimEngine.onVictory(epVic.x, epVic.y);');
    expect(playJs).toContain('window.AnimEngine?.onDefeat();');
  });

  it("keeps presentation delays optional so combat rules do not depend on VFX timing", () => {
    expect(playJs).toContain('const QUERY_PARAMS = new URLSearchParams(window.location.search);');
    expect(playJs).toContain('function arePresentationEffectsEnabled() {');
    expect(playJs).toContain('if (QUERY_PARAMS.get("fx") === "off") return false;');
    expect(playJs).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;');
    expect(playJs).toContain('async function waitForPresentationBeat(durationMs) {');
    expect(playJs).toContain('const effectiveDelay = arePresentationEffectsEnabled() ? durationMs : 0;');
    expect(playJs).toContain('await waitForPresentationBeat(700);');
    expect(playJs).toContain('await waitForPresentationBeat(nodeType === "boss" ? 900 : 500);');
  });

  it("keeps presentation-only safety hooks separate from server-backed combat rules", () => {
    expect(playJs).toContain('window.AnimEngine?.onDefeat();');
    expect(playJs).toContain('if (nextCombat.reshuffled) {');
    expect(playJs).toContain('window.AnimEngine.onShuffle(pp.x, pp.y);');
    expect(playJs).toContain('const effectiveDelay = arePresentationEffectsEnabled() ? durationMs : 0;');
    expect(playJs).toContain('const updated = await api("/run/play-card.json", { run: currentRun, handIndex });');
    expect(playJs).toContain('currentRun = await api("/run/end-turn.json", { run: currentRun });');
    expect(playJs).toContain('currentRun = await api("/run/claim-card.json", { run: currentRun, cardId: card.id });');
  });

  it("issues presentation-only hooks for draw, discard, reshuffle, exhaust, and enemy intent updates", () => {
    expect(playJs).toContain('const discardDelta = Math.max(0, (nextCombat.discardPile || []).length - (prevCombat.discardPile || []).length);');
    expect(playJs).toContain('const exhaustDelta = Math.max(0, (nextCombat.exhaustPile || []).length - (prevCombat.exhaustPile || []).length);');
    expect(playJs).toContain('window.AnimEngine.onDraw(pp.x, pp.y, cardsDrawn);');
    expect(playJs).toContain('window.AnimEngine.onDiscard(pp.x, pp.y, discardDelta);');
    expect(playJs).toContain('if (nextCombat.reshuffled) {');
    expect(playJs).toContain('window.AnimEngine.onShuffle(pp.x, pp.y);');
    expect(playJs).toContain('window.AnimEngine.onExhaust(pp.x, pp.y, exhaustDelta);');
    expect(playJs).toContain('let lastEnemyIntentFxKey = null;');
    expect(playJs).toContain('const enemyIntentKey = combat.enemyIntent ? `${combat.enemyIntent.type || "unknown"}:${combat.enemyIntent.value || combat.enemyIntent.label || ""}` : null;');
    expect(playJs).toContain('window.AnimEngine.onEnemyIntent(ep.x, ep.y, combat.enemyIntent.type || "attack");');
  });

  it("staggers reward card reveals with dealDelay and animates relic reveals with relic-cascade-in", () => {
    // Cards: staggered dealDelay
    expect(playJs).toContain("dealDelay: i * 80");
    // Relics: cascade-in class applied via setTimeout
    expect(playJs).toContain("relic-cascade-in");
    // Reward reveal fires sound
    expect(playJs).toContain("window.SoundEngine?.onRewardReveal()");
    // CSS: relic-cascade keyframe defined
    expect(playCss).toContain("relic-cascade");
    expect(playCss).toContain("relic-cascade-in");
    // CSS: reward-actions-row fades in with delay
    expect(playCss).toContain("animation-delay: 0.38s");
  });

  it("wires AnimEngine.freeze() hitstop on enemy hit and player damage for impact feel", () => {
    expect(playJs).toContain("window.AnimEngine?.freeze(");
    // Both paths: player attacking enemy (on dmg > 0) and enemy attacking player (on dmgTaken)
    const freezeCount = (playJs.match(/AnimEngine[?.]*.freeze\(/g) || []).length;
    expect(freezeCount).toBeGreaterThanOrEqual(2);
  });

  it("wires SoundEngine hooks at card play, enemy hit, player hit, defense gain, victory, defeat, relic trigger, turn start, and map move", () => {
    expect(playJs).toContain("window.SoundEngine?.onCardPlay(");
    expect(playJs).toContain("window.SoundEngine?.onEnemyHit(");
    expect(playJs).toContain("window.SoundEngine?.onPlayerHit(");
    expect(playJs).toContain("window.SoundEngine?.onDefenseGain(");
    expect(playJs).toContain("window.SoundEngine?.onVictory()");
    expect(playJs).toContain("window.SoundEngine?.onDefeat()");
    expect(playJs).toContain("window.SoundEngine?.onRelicTrigger()");
    expect(playJs).toContain("window.SoundEngine?.onPlayerTurnStart()");
    expect(playJs).toContain("window.SoundEngine?.onRewardReveal()");
    expect(playJs).toContain("window.SoundEngine?.onMapMove()");
  });

  it("re-enables end-turn button on API failure so combat cannot dead-end", () => {
    expect(playJs).toContain("currentRun = await api(\"/run/end-turn.json\", { run: currentRun });");
    // try/finally wrapping the end-turn API call
    const endTurnIndex = playJs.indexOf('currentRun = await api("/run/end-turn.json"');
    const tryIndex = playJs.lastIndexOf('try {', endTurnIndex);
    const catchIndex = playJs.indexOf('} catch {', endTurnIndex);
    expect(tryIndex).toBeGreaterThan(-1);
    expect(catchIndex).toBeGreaterThan(endTurnIndex);
    expect(playJs).toContain("recoveryBtn.disabled = false;");
    expect(playJs).toContain('recoveryBtn.textContent = "End Turn";');
  });
});

describe("play.css mobile viewport coverage", () => {
  it("includes a max-width 480px media query for phone-sized screens", () => {
    expect(playCss).toContain("@media (max-width: 480px)");
  });

  it("hides the combat log panel on mobile to reclaim space", () => {
    const mobileBlock = playCss.slice(playCss.indexOf("@media (max-width: 480px)"));
    expect(mobileBlock).toContain("#combat-log-panel");
    expect(mobileBlock).toContain("display: none");
  });

  it("hides the relic strip in topbars on mobile", () => {
    const mobileBlock = playCss.slice(playCss.indexOf("@media (max-width: 480px)"));
    expect(mobileBlock).toContain("#combat-topbar .relic-strip");
    expect(mobileBlock).toContain("#map-header .relic-strip");
  });

  it("reduces card dimensions on mobile via CSS variables", () => {
    const mobileBlock = playCss.slice(playCss.indexOf("@media (max-width: 480px)"));
    expect(mobileBlock).toContain("--card-w:");
    expect(mobileBlock).toContain("--card-h:");
    expect(mobileBlock).toContain("--card-lg-w:");
    expect(mobileBlock).toContain("--card-lg-h:");
  });

  it("makes archetype panels full-width on mobile", () => {
    const mobileBlock = playCss.slice(playCss.indexOf("@media (max-width: 480px)"));
    expect(mobileBlock).toContain(".archetype-panel");
    expect(mobileBlock).toContain("width: 100%");
  });

  it("slides deck and relic overlays in from the bottom on mobile", () => {
    const mobileBlock = playCss.slice(playCss.indexOf("@media (max-width: 480px)"));
    expect(mobileBlock).toContain("border-radius: 18px 18px 0 0");
  });
});

describe("soundEngine.js SFX synthesizer", () => {
  it("exposes SoundEngine as a window global", () => {
    expect(soundEngineJs).toContain("window.SoundEngine = SoundEngine");
  });

  it("respects fx=off query param via isEnabled()", () => {
    expect(soundEngineJs).toContain('QUERY_PARAMS.get("fx") === "off"');
  });

  it("persists volume in localStorage", () => {
    expect(soundEngineJs).toContain('localStorage.setItem("drawforge_sfx_volume"');
    expect(soundEngineJs).toContain('localStorage.getItem("drawforge_sfx_volume"');
  });

  it("exposes all 15 required sound event hook methods", () => {
    const requiredHooks = [
      "onCardPlay", "onCardExhaust", "onEnemyHit", "onPlayerHit",
      "onDefenseGain", "onVictory", "onDefeat", "onRelicTrigger",
      "onPlayerTurnStart", "onDraw", "onShuffle", "onStatusProc",
      "onEnemyDeath", "onRewardReveal", "onMapMove"
    ];
    requiredHooks.forEach((hook) => {
      expect(soundEngineJs).toContain(`${hook}(`);
    });
  });

  it("synthesizes all 15 sounds using Web Audio API primitives without audio files", () => {
    const soundNames = [
      "card_play", "card_exhaust", "hit_light", "hit_heavy", "block",
      "death_enemy", "death_player", "heal", "relic_trigger", "energy_restore",
      "draw_card", "shuffle", "reward_reveal", "map_move", "ui_click"
    ];
    soundNames.forEach((name) => {
      expect(soundEngineJs).toContain(`${name}(`);
    });
    // Uses Web Audio API — no audio file references
    expect(soundEngineJs).not.toContain(".mp3");
    expect(soundEngineJs).not.toContain(".ogg");
    expect(soundEngineJs).not.toContain(".wav");
    expect(soundEngineJs).toContain("AudioContext");
    expect(soundEngineJs).toContain("createOscillator");
  });

  it("lazily creates AudioContext to respect browser autoplay policy", () => {
    expect(soundEngineJs).toContain("function ensureCtx()");
    // AudioContext only created inside ensureCtx, not at module init
    const initSection = soundEngineJs.slice(0, soundEngineJs.indexOf("function ensureCtx()"));
    expect(initSection).not.toContain("new AudioContext");
    expect(initSection).not.toContain("new window.AudioContext");
  });
});
