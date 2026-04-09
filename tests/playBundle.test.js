const fs = require("fs");
const path = require("path");

const playJs = fs.readFileSync(path.join(__dirname, "..", "browser", "play.js"), "utf8");

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
    expect(playJs).toContain('fetchJson("/run/new.json")');
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
    expect(playJs).toContain('`type-${cardType}`');
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

  it("renders post-combat reward cards with the shared large card component and claim interaction", () => {
    expect(playJs).toContain('const cardRow = $id("reward-cards-row");');
    expect(playJs).toContain('const el = makeCard(card, {');
    expect(playJs).toContain('large: true,');
    expect(playJs).toContain('dealDelay: i * 80,');
    expect(playJs).toContain('el.classList.add("card-picked");');
    expect(playJs).toContain('currentRun = await api("/run/claim-card.json", { run: currentRun, cardId: card.id });');
    expect(playJs).toContain('el.classList.add("reward-item");');
    expect(playJs).toContain('cardRow.appendChild(el);');
  });

  it("supports deck overlay filtering alongside shared card rendering", () => {
    expect(playJs).toContain('let deckFilterMode = "all";');
    expect(playJs).toContain('filterBar.id = "deck-filter-bar";');
    expect(playJs).toContain('["all", "attack", "skill", "power", "curse"].forEach((type) => {');
    expect(playJs).toContain('btn.className = "deck-filter-btn";');
    expect(playJs).toContain('deckFilterMode = type;');
    expect(playJs).toContain('const filteredCards = deckFilterMode === "all"');
    expect(playJs).toContain('const sorted = [...filteredCards];');
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
    expect(playJs).toContain('if (playerBlockGain > 0) floatText(playerPanel, `+${playerBlockGain} Block`, "block-gain");');
    expect(playJs).toContain('if (energyDelta > 0) floatText(playerPanel, `+${energyDelta} Energy`, "energy");');
    expect(playJs).toContain('if (energyDelta < 0) floatText(playerPanel, `${energyDelta} Energy`, "energy");');
    expect(playJs).toContain('if (cardsDrawn > 0) floatText(playerPanel, `Draw ${cardsDrawn}`, "draw-gain");');
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
});
