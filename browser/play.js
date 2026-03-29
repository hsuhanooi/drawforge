/* eslint-env browser */
(() => {
  // ─── Globals ──────────────────────────────────────────────────────
  const SAVE_KEY = "drawforge.v1";
  let cardCatalog = null;
  let currentRun = null;

  // ─── Network ──────────────────────────────────────────────────────
  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || `Request failed: ${url}`);
    return payload;
  }

  async function api(endpoint, body) {
    return fetchJson(endpoint, { method: "POST", body: JSON.stringify(body) });
  }

  async function loadSharedCatalogs() {
    const [cards] = await Promise.all([
      fetchJson("/cards.json"),
      fetchJson("/relics.json") // loaded for catalog completeness; relic display uses embedded run data
    ]);
    cardCatalog = cards;
  }

  // ─── Persistence ──────────────────────────────────────────────────
  function saveRun(run) { localStorage.setItem(SAVE_KEY, JSON.stringify(run)); }
  function loadRun() {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  function hasSave() { return !!localStorage.getItem(SAVE_KEY); }

  // ─── DOM Helpers ──────────────────────────────────────────────────
  function $id(id) { return document.getElementById(id); }
  function clearEl(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function show(...ids) {
    ids.forEach((id) => { const e = $id(id); if (e) e.classList.remove("hidden"); });
  }
  function hide(...ids) {
    ids.forEach((id) => { const e = $id(id); if (e) e.classList.add("hidden"); });
  }

  const ALL_SCREENS = [
    "screen-start", "screen-map", "screen-combat", "screen-reward",
    "screen-deck-choice", "screen-shop", "screen-rest", "screen-end"
  ];
  function showOnly(screenId) {
    ALL_SCREENS.forEach((s) => (s === screenId ? show(s) : hide(s)));
    hide("deck-overlay");
  }

  // ─── Card Description ─────────────────────────────────────────────
  function describeCard(card) {
    const parts = [];
    if (card.cost !== undefined) parts.push(`Cost ${card.cost}`);
    if (card.costReduceIfHexed) parts.push(`(−${card.costReduceIfHexed} if Hexed)`);
    if (card.damage) parts.push(`Dmg ${card.damage}`);
    if (card.block) parts.push(`Block ${card.block}`);
    if (card.draw) parts.push(`Draw ${card.draw}`);
    if (card.energyGain) parts.push(`+${card.energyGain} energy`);
    if (card.energyPerExhausted) parts.push(`+1 energy/exhausted`);
    if (card.hex) parts.push(`Hex ${card.hex}`);
    if (card.bonusVsHex) parts.push(`+${card.bonusVsHex} vs Hex`);
    if (card.bonusVsExhaust) parts.push(`+${card.bonusVsExhaust} vs Exhaust`);
    if (card.bonusVsHexedOrExhausted) parts.push(`repeat on Hex/Exhaust`);
    if (card.bonusBlockIfHighEnergy) parts.push(`+${card.bonusBlockIfHighEnergy} block if 2+ energy`);
    if (card.bonusBlockIfHexed) parts.push(`+${card.bonusBlockIfHexed} block vs Hex`);
    if (card.setCharged) parts.push(`Become Charged`);
    if (card.drawIfCharged) parts.push(`Draw ${card.drawIfCharged} if Charged`);
    if (card.selfDamage) parts.push(`Lose ${card.selfDamage} HP`);
    if (card.exhaustFromHand) parts.push(`Exhaust a card`);
    if (card.exhaust) parts.push(`Exhaust`);
    if (parts.length <= 1 && card.effectText) parts.push(card.effectText);
    return parts.join(" · ");
  }

  // ─── Card Art (canvas) ────────────────────────────────────────────
  function drawCardArt(canvas, card) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (card.type === "attack") {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#1c0606");
      bg.addColorStop(1, "#0a0202");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "#c0392b";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.88);
      ctx.lineTo(w * 0.78, h * 0.1);
      ctx.stroke();
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.9);
      ctx.lineTo(w * 0.68, h * 0.14);
      ctx.stroke();
      const grd = ctx.createRadialGradient(w * 0.76, h * 0.12, 0, w * 0.76, h * 0.12, 10);
      grd.addColorStop(0, "rgba(231,76,60,0.85)");
      grd.addColorStop(1, "rgba(231,76,60,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#05101c");
      bg.addColorStop(1, "#020508");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.28;
      const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      orb.addColorStop(0, "rgba(79,142,247,0.55)");
      orb.addColorStop(0.6, "rgba(79,142,247,0.18)");
      orb.addColorStop(1, "rgba(79,142,247,0)");
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(79,142,247,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ─── Card Component ───────────────────────────────────────────────
  function makeCard(card, opts = {}) {
    const { large = false, unplayable = false, onClick = null, dealDelay = 0 } = opts;
    const div = document.createElement("div");
    div.className = [
      "card-component",
      `rarity-${card.rarity || "common"}`,
      `type-${card.type || "skill"}`,
      large ? "large" : "",
      unplayable ? "unplayable" : ""
    ].filter(Boolean).join(" ");

    // Cost gem
    const costDiv = document.createElement("div");
    const costVal = card.cost !== undefined ? card.cost : 0;
    costDiv.className = `card-cost cost-${costVal}`;
    costDiv.textContent = costVal;
    div.appendChild(costDiv);

    // Art canvas
    const canvas = document.createElement("canvas");
    canvas.className = "card-art-canvas";
    canvas.width = large ? 136 : 108;
    canvas.height = large ? 72 : 58;
    div.appendChild(canvas);
    drawCardArt(canvas, card);

    // Type stripe
    const stripe = document.createElement("div");
    stripe.className = "card-type-stripe";
    div.appendChild(stripe);

    // Name
    const nameDiv = document.createElement("div");
    nameDiv.className = "card-name";
    nameDiv.textContent = card.name || card.id || "?";
    div.appendChild(nameDiv);

    // Description
    const descDiv = document.createElement("div");
    descDiv.className = "card-desc";
    descDiv.textContent = describeCard(card);
    div.appendChild(descDiv);

    if (onClick && !unplayable) {
      div.addEventListener("click", onClick);
    }

    if (dealDelay >= 0) {
      setTimeout(() => div.classList.add("dealing"), dealDelay);
      setTimeout(() => div.classList.remove("dealing"), dealDelay + 400);
    }

    return div;
  }

  // ─── Relic Helpers ────────────────────────────────────────────────
  function relicIcon(relic) {
    const icons = {
      iron_core: "⚙️", ember_ring: "🔥", rusted_buckler: "🛡️",
      quickened_loop: "⚡", worn_grimoire: "📖", coal_pendant: "🪨",
      hex_nail: "🔩", cinder_box: "📦", volt_shard: "⚡", sigil_engine: "⚙️",
      time_locked_seal: "🔒", phoenix_ash: "🕊️", bone_token: "🦴",
      merchants_ledger: "📋", feather_charm: "🪶", lucky_coin: "🪙",
      pilgrims_map: "🗺️", golden_brand: "🏷️", crown_of_cinders: "👑"
    };
    return icons[relic.id] || relic.name.slice(0, 2).toUpperCase();
  }

  function makeRelicBadge(relic) {
    const badge = document.createElement("div");
    badge.className = `relic-badge rarity-${relic.rarity || "common"}`;
    badge.textContent = relicIcon(relic);
    const tip = document.createElement("div");
    tip.className = "relic-tooltip";
    tip.innerHTML = `<div class="relic-name">${relic.name}</div>${relic.description || ""}`;
    badge.appendChild(tip);
    return badge;
  }

  function makeRelicCard(relic, onClick = null) {
    const div = document.createElement("div");
    div.className = `relic-card rarity-${relic.rarity || "common"} reward-item`;
    const icon = document.createElement("div");
    icon.className = "relic-icon";
    icon.textContent = relicIcon(relic);
    const name = document.createElement("div");
    name.className = "relic-card-name";
    name.textContent = relic.name;
    const desc = document.createElement("div");
    desc.className = "relic-card-desc";
    desc.textContent = relic.description || "";
    div.appendChild(icon);
    div.appendChild(name);
    div.appendChild(desc);
    if (onClick) div.addEventListener("click", onClick);
    return div;
  }

  function renderRelicStrip(stripId, relics) {
    const strip = $id(stripId);
    if (!strip) return;
    clearEl(strip);
    (relics || []).forEach((r) => strip.appendChild(makeRelicBadge(r)));
  }

  // ─── Animations ───────────────────────────────────────────────────
  function floatNum(anchorEl, value, type) {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const div = document.createElement("div");
    div.className = `float-dmg ${type}`;
    const prefix = type === "damage" ? "-" : type === "heal" ? "+" : "";
    div.textContent = `${prefix}${value}`;
    div.style.left = `${rect.left + rect.width / 2 - 16}px`;
    div.style.top = `${rect.top - 10}px`;
    document.body.appendChild(div);
    div.addEventListener("animationend", () => div.remove());
  }

  function showTurnBanner(text, isEnemy) {
    const banner = $id("turn-banner");
    const bannerText = $id("turn-banner-text");
    if (!banner || !bannerText) return;
    bannerText.textContent = text;
    banner.className = isEnemy ? "enemy-banner" : "player-banner";
    banner.classList.add("show");
    banner.addEventListener("animationend", () => {
      banner.classList.remove("show");
    }, { once: true });
  }

  function spawnConfetti() {
    const colors = ["#f0c040", "#4f8ef7", "#44c068", "#9b59b6", "#e07830"];
    for (let i = 0; i < 55; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.top = `-8px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      document.body.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  function spawnDeathSparks() {
    for (let i = 0; i < 30; i++) {
      const spark = document.createElement("div");
      spark.className = "defeat-spark";
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      spark.style.left = `${cx}px`;
      spark.style.top = `${cy}px`;
      spark.style.background = "#e05050";
      const angle = (Math.random() * Math.PI * 2);
      const dist = 80 + Math.random() * 200;
      spark.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      spark.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      spark.style.animationDuration = `${0.5 + Math.random() * 0.8}s`;
      document.body.appendChild(spark);
      spark.addEventListener("animationend", () => spark.remove());
    }
  }

  // ─── HP Bar ───────────────────────────────────────────────────────
  function updateHPBar(barFillId, currentHp, maxHp) {
    const fill = $id(barFillId);
    if (!fill) return;
    const pct = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;
    fill.style.width = `${pct}%`;
    fill.classList.remove("low", "mid");
    if (pct < 25) fill.classList.add("low");
    else if (pct < 55) fill.classList.add("mid");
  }

  // ─── Energy Pips ─────────────────────────────────────────────────
  function renderEnergyPips(current, max) {
    const pipsEl = $id("energy-pips");
    if (!pipsEl) return;
    clearEl(pipsEl);
    for (let i = 0; i < max; i++) {
      const pip = document.createElement("div");
      pip.className = `energy-pip${i < current ? " filled" : ""}`;
      pipsEl.appendChild(pip);
    }
  }

  // ─── Status Badges ────────────────────────────────────────────────
  function renderBadges(badgesId, stats) {
    const el = $id(badgesId);
    if (!el) return;
    clearEl(el);
    stats.forEach(({ label, cls, value }) => {
      if (!value) return;
      const badge = document.createElement("div");
      badge.className = `badge ${cls}`;
      badge.textContent = `${label} ${value}`;
      el.appendChild(badge);
    });
  }

  // ─── Deck helpers ─────────────────────────────────────────────────
  function getDeckCards() {
    const deck = currentRun?.player?.deck || [];
    return deck.map((id) => {
      const card = cardCatalog && cardCatalog[id];
      return card ? { ...card } : { id, name: id, cost: 0, type: "skill", rarity: "common" };
    });
  }

  // ─── Deck Overlay ─────────────────────────────────────────────────
  function openDeckOverlay() {
    const container = $id("deck-panel-cards");
    if (!container) return;
    clearEl(container);
    const cards = getDeckCards();
    const countLabel = $id("deck-panel-title");
    if (countLabel) countLabel.textContent = `Your Deck (${cards.length})`;
    cards.forEach((card) => container.appendChild(makeCard(card, { dealDelay: -1 })));
    show("deck-overlay");
  }

  // ─── Screen: Start ────────────────────────────────────────────────
  function renderStart() {
    showOnly("screen-start");
    if (!hasSave()) {
      hide("start-load-run-btn");
    } else {
      show("start-load-run-btn");
    }
  }

  // ─── Screen: Map ─────────────────────────────────────────────────
  const NODE_ICONS = {
    combat: "⚔️", elite: "⭐", boss: "👑", event: "❓", rest: "🔥", shop: "🛒"
  };

  function getNodeState(node) {
    const map = currentRun.map;
    if (!map) return "locked";
    if (node.id === map.currentNodeId) return "current";
    const currentNode = map.nodes.find((n) => n.id === map.currentNodeId);
    if (!currentNode) {
      return node.row === 0 ? "available" : "locked";
    }
    if (node.row < currentNode.row) return "visited";
    if ((currentNode.next || []).includes(node.id)) return "available";
    return "locked";
  }

  function renderMap() {
    if (!currentRun?.map) return;
    showOnly("screen-map");

    const maxHp = currentRun.player.maxHealth || 80;
    $id("map-hp").textContent = `${currentRun.player.health}/${maxHp}`;
    $id("map-gold").textContent = currentRun.player.gold;
    $id("map-deck-count").textContent = (currentRun.player.deck || []).length;
    renderRelicStrip("map-relic-strip", currentRun.relics || []);

    const canvas = $id("map-canvas");
    const svg = $id("map-svg");
    if (!canvas || !svg) return;

    // Remove row divs, keep SVG
    Array.from(canvas.children).forEach((child) => {
      if (child !== svg) canvas.removeChild(child);
    });
    clearEl(svg);

    const { nodes } = currentRun.map;
    const totalRows = currentRun.map.rows || 5;

    // Build rows top-to-bottom (boss row first = top of screen)
    for (let displayRow = 0; displayRow < totalRows; displayRow++) {
      const dataRow = totalRows - 1 - displayRow;
      const rowNodes = nodes.filter((n) => n.row === dataRow);
      if (!rowNodes.length) continue;

      const rowEl = document.createElement("div");
      rowEl.className = "map-row";

      const sortedNodes = rowNodes.slice().sort((a, b) => a.col - b.col);
      sortedNodes.forEach((node) => {
        const nodeEl = document.createElement("div");
        const state = getNodeState(node);
        nodeEl.className = [
          "map-node",
          `type-${node.type}`,
          state
        ].join(" ");
        nodeEl.dataset.nodeId = node.id;

        const iconEl = document.createElement("span");
        iconEl.textContent = NODE_ICONS[node.type] || "·";
        nodeEl.appendChild(iconEl);

        const labelEl = document.createElement("div");
        labelEl.className = "node-label";
        labelEl.textContent = node.type.toUpperCase();
        nodeEl.appendChild(labelEl);

        if (state === "available") {
          nodeEl.addEventListener("click", () => enterNode(node));
        }

        rowEl.appendChild(nodeEl);
      });

      canvas.insertBefore(rowEl, svg);
    }

    // Draw SVG paths after layout
    requestAnimationFrame(() => drawMapPaths(canvas, svg, nodes));
  }

  function drawMapPaths(canvas, svg, nodes) {
    clearEl(svg);
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width === 0) return;

    const nodeCenters = {};
    canvas.querySelectorAll(".map-node").forEach((el) => {
      const id = el.dataset.nodeId;
      if (!id) return;
      const rect = el.getBoundingClientRect();
      nodeCenters[id] = {
        x: rect.left - canvasRect.left + rect.width / 2,
        y: rect.top - canvasRect.top + rect.height / 2
      };
    });

    svg.setAttribute("viewBox", `0 0 ${canvasRect.width} ${canvasRect.height}`);

    nodes.forEach((node) => {
      if (!nodeCenters[node.id]) return;
      (node.next || []).forEach((nextId) => {
        if (!nodeCenters[nextId]) return;
        const start = nodeCenters[node.id];
        const end = nodeCenters[nextId];
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", start.x);
        line.setAttribute("y1", start.y);
        line.setAttribute("x2", end.x);
        line.setAttribute("y2", end.y);
        line.setAttribute("stroke", "#252e4a");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-linecap", "round");
        svg.appendChild(line);
      });
    });
  }

  async function enterNode(node) {
    const result = await api("/run/enter-node.json", { run: currentRun, nodeId: node.id });
    currentRun = result.run;

    if (node.type === "rest" || node.type === "event") {
      currentRun.event = await fetchJson(
        `/play/event.json?nodeType=${encodeURIComponent(node.type)}&row=${node.row || 0}&col=${node.col || 0}`
      );
    }
    if (node.type === "shop") {
      currentRun.shop = await api("/play/shop.json", { run: currentRun });
    }

    saveRun(currentRun);
    render();
  }

  // ─── Screen: Combat ───────────────────────────────────────────────
  function renderCombat() {
    if (!currentRun?.combat) return;
    showOnly("screen-combat");

    const { combat } = currentRun;
    const maxHp = currentRun.player.maxHealth || 80;
    const enemyMaxHp = combat.enemy.maxHp || combat.enemy.health;

    // Topbar
    const nodeType = combat.nodeType || "combat";
    $id("combat-floor-label").textContent = nodeType.toUpperCase();
    renderRelicStrip("combat-relic-strip", currentRun.relics || []);

    // Player panel
    $id("player-hp-current").textContent = combat.player.health;
    $id("player-hp-max").textContent = maxHp;
    updateHPBar("player-hp-bar", combat.player.health, maxHp);
    renderEnergyPips(combat.player.energy, 3 + ((currentRun.relics || []).some((r) => r.id === "ember_ring") ? 1 : 0));
    renderBadges("player-badges", [
      { label: "🛡️", cls: "block", value: combat.player.block || 0 },
      { label: "⚡", cls: "charged", value: combat.player.charged ? 1 : 0 },
      { label: "💪", cls: "strength", value: combat.player.strength || 0 },
      { label: "🦶", cls: "dexterity", value: combat.player.dexterity || 0 },
      { label: "😵", cls: "weak", value: combat.player.weak || 0 }
    ]);

    // Enemy panel
    $id("enemy-name").textContent = combat.enemy.name || "Enemy";
    $id("enemy-hp-current").textContent = Math.max(0, combat.enemy.health);
    $id("enemy-hp-max").textContent = enemyMaxHp;
    updateHPBar("enemy-hp-bar", combat.enemy.health, enemyMaxHp);
    renderBadges("enemy-badges", [
      { label: "🛡️", cls: "block", value: combat.enemy.block || 0 },
      { label: "☠️", cls: "hex", value: combat.enemy.hex || 0 },
      { label: "🎯", cls: "vulnerable", value: combat.enemy.vulnerable || 0 },
      { label: "😵", cls: "weak", value: combat.enemy.weak || 0 }
    ]);

    // Intent
    const intent = combat.enemyIntent;
    $id("intent-action").textContent = intent ? intent.label : "—";

    // Pile counters
    $id("draw-count").textContent = (combat.drawPile || []).length;
    $id("discard-count").textContent = (combat.discardPile || []).length;
    $id("exhaust-count").textContent = (combat.exhaustPile || []).length;

    // Hand
    const handArea = $id("hand-area");
    if (handArea) {
      clearEl(handArea);
      (combat.hand || []).forEach((card, idx) => {
        const canAfford = combat.player.energy >= (card.cost || 0);
        const cardEl = makeCard(card, {
          unplayable: !canAfford,
          dealDelay: idx * 55,
          onClick: () => playCard(idx, cardEl)
        });
        handArea.appendChild(cardEl);
      });
    }

    // End turn button state
    const endBtn = $id("end-turn-btn");
    if (endBtn) endBtn.disabled = false;
  }

  async function playCard(handIndex, cardEl) {
    // Fly animation
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      const fly = cardEl.cloneNode(true);
      fly.className = "card-flying";
      fly.style.left = `${rect.left}px`;
      fly.style.top = `${rect.top}px`;
      fly.style.width = `${rect.width}px`;
      fly.style.height = `${rect.height}px`;
      document.body.appendChild(fly);
      fly.addEventListener("animationend", () => fly.remove());
    }

    const prevEnemyHp = currentRun.combat?.enemy?.health || 0;
    const updated = await api("/run/play-card.json", { run: currentRun, handIndex });

    currentRun = updated;

    // Floating numbers for enemy damage
    if (updated.combat) {
      const dmg = prevEnemyHp - updated.combat.enemy.health;
      if (dmg > 0) {
        floatNum($id("enemy-panel"), dmg, dmg >= 8 ? "damage big" : "damage");
        const avatarEl = $id("enemy-avatar");
        if (avatarEl) {
          avatarEl.classList.add("shake");
          avatarEl.addEventListener("animationend", () => avatarEl.classList.remove("shake"), { once: true });
        }
      }
    }

    if (updated.combat?.state === "victory") {
      currentRun = await api("/run/apply-victory.json", { run: currentRun, combat: updated.combat });
    }

    saveRun(currentRun);
    render();
  }

  // ─── Screen: Reward ───────────────────────────────────────────────
  function renderReward() {
    if (!currentRun?.pendingRewards) return;
    showOnly("screen-reward");

    const rewards = currentRun.pendingRewards;

    hide("reward-content", "event-panel", "relic-choice-panel", "removal-panel");

    if (rewards.removeCard && !rewards.cards?.length && !rewards.relics?.length && !rewards.relic) {
      // Removal phase
      show("removal-panel");
      const removalCards = $id("removal-cards");
      if (removalCards) {
        clearEl(removalCards);
        getDeckCards().forEach((card) => {
          const el = makeCard(card, {
            large: false,
            dealDelay: -1,
            onClick: async () => {
              currentRun = await api("/run/remove-card.json", { run: currentRun, cardId: card.id });
              saveRun(currentRun);
              render();
            }
          });
          el.classList.add("reward-item");
          removalCards.appendChild(el);
        });
      }
      return;
    }

    if (rewards.cards?.length) {
      // Card reward phase
      show("reward-content");
      const isElite = rewards.relics?.length > 0;
      const isBoss = !!rewards.relic;
      $id("reward-header").textContent = isBoss ? "BOSS VICTORY" : isElite ? "ELITE VICTORY" : "COMBAT VICTORY";
      $id("reward-subtitle").textContent = "Choose a card to add to your deck";

      const cardRow = $id("reward-cards-row");
      if (cardRow) {
        clearEl(cardRow);
        rewards.cards.forEach((card, i) => {
          const el = makeCard(card, {
            large: true,
            dealDelay: i * 80,
            onClick: async () => {
              currentRun = await api("/run/claim-card.json", { run: currentRun, cardId: card.id });
              saveRun(currentRun);
              render();
            }
          });
          el.classList.add("reward-item");
          cardRow.appendChild(el);
        });
      }
      return;
    }

    if (rewards.relics?.length) {
      // Elite relic choice phase
      show("relic-choice-panel");
      $id("relic-choice-label").textContent = "Choose a Relic";
      const relicRow = $id("reward-cards-row-relics");
      if (relicRow) {
        clearEl(relicRow);
        rewards.relics.forEach((relic) => {
          const el = makeRelicCard(relic, async () => {
            currentRun = await api("/run/claim-choice-relic.json", { run: currentRun, relicId: relic.id });
            saveRun(currentRun);
            render();
          });
          relicRow.appendChild(el);
        });
      }
      hide("reward-skip-btn");
      return;
    }

    if (rewards.relic) {
      // Boss relic claim phase
      show("relic-choice-panel");
      $id("relic-choice-label").textContent = "Boss Relic";
      const relicRow = $id("reward-cards-row-relics");
      if (relicRow) {
        clearEl(relicRow);
        const el = makeRelicCard(rewards.relic, async () => {
          currentRun = await api("/run/claim-relic.json", { run: currentRun, relicId: rewards.relic.id });
          saveRun(currentRun);
          render();
        });
        relicRow.appendChild(el);
      }
      hide("reward-skip-btn");
      return;
    }

    // Nothing left — finish node
    api("/run/finish-node.json", { run: currentRun }).then((run) => {
      currentRun = run;
      saveRun(run);
      render();
    });
  }

  // ─── Screen: Event ────────────────────────────────────────────────
  function renderEvent() {
    if (!currentRun?.event) return;
    showOnly("screen-reward");

    hide("reward-content", "relic-choice-panel", "removal-panel");
    show("event-panel");

    const evt = currentRun.event;
    $id("event-title").textContent = evt.title || "Event";
    $id("event-text").textContent = evt.description || "";

    const choicesEl = $id("event-choices");
    if (!choicesEl) return;
    clearEl(choicesEl);

    (evt.options || []).forEach((option) => {
      const wrap = document.createElement("div");
      wrap.className = "event-choice-wrap";

      // Card preview row (if option includes cards)
      if (option.cards?.length) {
        const previewRow = document.createElement("div");
        previewRow.className = "event-card-preview-row";
        option.cards.forEach((card) => {
          previewRow.appendChild(makeCard(card, { dealDelay: -1 }));
        });
        wrap.appendChild(previewRow);
      } else if (option.card) {
        const previewRow = document.createElement("div");
        previewRow.className = "event-card-preview-row";
        previewRow.appendChild(makeCard(option.card, { dealDelay: -1 }));
        wrap.appendChild(previewRow);
      }

      const btn = document.createElement("button");
      btn.className = "event-choice-btn";
      btn.textContent = option.label;
      btn.addEventListener("click", async () => {
        currentRun = await api("/run/claim-event-option.json", { run: currentRun, optionId: option.id });
        saveRun(currentRun);
        render();
      });
      wrap.appendChild(btn);
      choicesEl.appendChild(wrap);
    });
  }

  // ─── Screen: Rest (Campfire) ──────────────────────────────────────
  function renderRest() {
    if (!currentRun?.event) return;
    showOnly("screen-rest");
    hide("upgrade-panel");

    const optionsRow = $id("rest-options-row");
    if (!optionsRow) return;
    clearEl(optionsRow);

    (currentRun.event.options || []).forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = option.label;
      btn.addEventListener("click", async () => {
        if (option.effect === "smith") {
          showSmithPanel();
          return;
        }
        currentRun = await api("/run/claim-event-option.json", { run: currentRun, optionId: option.id });
        saveRun(currentRun);
        render();
      });
      optionsRow.appendChild(btn);
    });

    const cancelBtn = $id("upgrade-cancel-btn");
    if (cancelBtn) cancelBtn.onclick = () => { hide("upgrade-panel"); show("rest-options-row"); };
  }

  function showSmithPanel() {
    hide("rest-options-row");
    show("upgrade-panel");
    const cardsEl = $id("upgrade-cards");
    if (!cardsEl) return;
    clearEl(cardsEl);

    const deck = currentRun.player.deck || [];
    deck.forEach((cardId, deckIndex) => {
      const card = (cardCatalog || {})[cardId] || { id: cardId, name: cardId, cost: 0, type: "skill", rarity: "common" };
      const upgradeable = !cardId.endsWith("_plus");
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px;";
      const cardEl = makeCard(card, { unplayable: !upgradeable, dealDelay: -1 });
      const upgradeBtn = document.createElement("button");
      upgradeBtn.className = "btn";
      upgradeBtn.textContent = upgradeable ? "Upgrade" : "Max";
      upgradeBtn.disabled = !upgradeable;
      upgradeBtn.style.fontSize = "12px";
      if (upgradeable) {
        upgradeBtn.addEventListener("click", async () => {
          currentRun = await api("/run/upgrade-card.json", { run: currentRun, deckIndex });
          saveRun(currentRun);
          render();
        });
      }
      wrap.appendChild(cardEl);
      wrap.appendChild(upgradeBtn);
      cardsEl.appendChild(wrap);
    });

  }

  // ─── Screen: Shop ─────────────────────────────────────────────────
  function renderShop() {
    if (!currentRun?.shop) return;
    showOnly("screen-shop");

    const shop = currentRun.shop;
    $id("shop-gold").textContent = currentRun.player.gold;

    // Cards
    const cardsRow = $id("shop-cards-row");
    if (cardsRow) {
      clearEl(cardsRow);
      shop.cards.forEach((card) => {
        const wrap = document.createElement("div");
        wrap.style.display = "flex";
        wrap.style.flexDirection = "column";
        wrap.style.alignItems = "center";
        wrap.style.gap = "8px";
        const canAfford = currentRun.player.gold >= card.price;
        const el = makeCard(card, {
          unplayable: !canAfford,
          dealDelay: -1,
          onClick: canAfford ? async () => {
            try {
              currentRun = await api("/run/buy-shop-item.json", { run: currentRun, type: "card", itemId: card.id, price: card.price });
              saveRun(currentRun);
              render();
            } catch (e) { /* not enough gold */ }
          } : null
        });
        const priceTag = document.createElement("div");
        priceTag.style.color = canAfford ? "var(--gold)" : "var(--text-dim)";
        priceTag.style.fontWeight = "700";
        priceTag.textContent = `${card.price}g`;
        wrap.appendChild(el);
        wrap.appendChild(priceTag);
        cardsRow.appendChild(wrap);
      });
    }

    // Services
    const servicesRow = $id("shop-services-row");
    if (servicesRow) {
      clearEl(servicesRow);
      (shop.services || []).forEach((svc) => {
        const btn = document.createElement("button");
        btn.className = "btn";
        const canAfford = currentRun.player.gold >= svc.price;
        if (!canAfford) btn.style.opacity = "0.45";
        btn.innerHTML = `${svc.label} <span style="color:var(--gold)">${svc.price}g</span>`;
        btn.addEventListener("click", async () => {
          if (!canAfford) return;
          try {
            currentRun = await api("/run/buy-shop-item.json", { run: currentRun, type: "service", itemId: svc.id, price: svc.price });
            saveRun(currentRun);
            render();
          } catch (e) { /* not enough gold */ }
        });
        servicesRow.appendChild(btn);
      });
    }

    // Relics
    const relicSection = $id("shop-relic-section");
    const relicRow = $id("shop-relic-row");
    if (relicRow && relicSection) {
      clearEl(relicRow);
      if (shop.relics?.length) {
        show("shop-relic-section");
        shop.relics.forEach((relic) => {
          const wrap = document.createElement("div");
          wrap.style.display = "flex";
          wrap.style.flexDirection = "column";
          wrap.style.alignItems = "center";
          wrap.style.gap = "8px";
          const canAfford = currentRun.player.gold >= relic.price;
          const el = makeRelicCard(relic, canAfford ? async () => {
            try {
              currentRun = await api("/run/buy-shop-item.json", { run: currentRun, type: "relic", itemId: relic.id, price: relic.price });
              saveRun(currentRun);
              render();
            } catch (e) { /* not enough gold */ }
          } : null);
          if (!canAfford) el.style.opacity = "0.45";
          const priceTag = document.createElement("div");
          priceTag.style.color = canAfford ? "var(--gold)" : "var(--text-dim)";
          priceTag.style.fontWeight = "700";
          priceTag.textContent = `${relic.price}g`;
          wrap.appendChild(el);
          wrap.appendChild(priceTag);
          relicRow.appendChild(wrap);
        });
      } else {
        hide("shop-relic-section");
      }
    }
  }

  // ─── Screen: End State ────────────────────────────────────────────
  function renderEndState() {
    const win = currentRun.state === "won";
    const screen = $id("screen-end");
    showOnly("screen-end");
    if (screen) {
      screen.classList.remove("win", "loss");
      screen.classList.add(win ? "win" : "loss");
    }
    $id("end-icon").textContent = win ? "🏆" : "💀";
    $id("end-title").textContent = win ? "VICTORY" : "DEFEAT";

    const stats = $id("end-stats");
    if (stats) {
      const currentNode = currentRun.map?.nodes?.find((n) => n.id === currentRun.map.currentNodeId);
      const floorReached = currentNode ? currentNode.row + 1 : "?";
      const relicCount = (currentRun.relics || []).length;
      const deckSize = (currentRun.player?.deck || []).length;
      stats.innerHTML = [
        `Floor reached: <strong>${floorReached}</strong>`,
        `Gold: <strong>${currentRun.player?.gold || 0}</strong>`,
        `Deck size: <strong>${deckSize}</strong>`,
        `Relics: <strong>${relicCount}</strong>`
      ].join("<br />");
    }

    if (win) {
      setTimeout(spawnConfetti, 200);
    } else {
      setTimeout(spawnDeathSparks, 100);
    }
  }

  // ─── Main Render Dispatch ─────────────────────────────────────────
  function render() {
    if (!currentRun) return renderStart();
    if (currentRun.state === "won" || currentRun.state === "lost") return renderEndState();
    if (currentRun.pendingRewards) return renderReward();
    if (currentRun.shop) return renderShop();
    if (currentRun.event) {
      return currentRun.event.kind === "campfire" ? renderRest() : renderEvent();
    }
    if (currentRun.combat) return renderCombat();
    return renderMap();
  }

  // ─── Button Listeners ─────────────────────────────────────────────
  function initListeners() {
    // Start screen
    $id("start-new-run-btn")?.addEventListener("click", async () => {
      currentRun = await fetchJson("/run/new.json");
      saveRun(currentRun);
      render();
    });

    $id("start-load-run-btn")?.addEventListener("click", () => {
      currentRun = loadRun();
      if (currentRun) render();
    });

    // End turn
    $id("end-turn-btn")?.addEventListener("click", async () => {
      if (!currentRun?.combat) return;
      const btn = $id("end-turn-btn");
      if (btn) btn.disabled = true;

      const prevPlayerHp = currentRun.combat.player.health;
      currentRun = await api("/run/end-turn.json", { run: currentRun });

      // Animate enemy lunge + player recoil if enemy attacked
      const newPlayerHp = currentRun.combat?.player?.health ?? currentRun.player?.health ?? prevPlayerHp;
      const dmgTaken = prevPlayerHp - newPlayerHp;
      if (dmgTaken > 0) {
        const enemyPanel = $id("enemy-panel");
        const playerPanel = $id("player-panel");
        if (enemyPanel) {
          enemyPanel.classList.add("lunging");
          enemyPanel.addEventListener("animationend", () => enemyPanel.classList.remove("lunging"), { once: true });
        }
        if (playerPanel) {
          playerPanel.classList.add("taking-hit");
          playerPanel.addEventListener("animationend", () => playerPanel.classList.remove("taking-hit"), { once: true });
        }
        floatNum($id("player-panel"), dmgTaken, dmgTaken >= 8 ? "damage big" : "damage");
      }

      if (currentRun.state === "lost") {
        saveRun(currentRun);
        render();
        return;
      }

      showTurnBanner("YOUR TURN", false);
      saveRun(currentRun);
      render();
    });

    // Deck overlay
    $id("map-deck-btn")?.addEventListener("click", () => openDeckOverlay());
    $id("combat-deck-btn")?.addEventListener("click", () => openDeckOverlay());
    $id("deck-close-btn")?.addEventListener("click", () => hide("deck-overlay"));

    // Reward skip (card selection)
    $id("reward-skip-btn")?.addEventListener("click", async () => {
      currentRun = await api("/run/skip-rewards.json", { run: currentRun });
      saveRun(currentRun);
      render();
    });

    // Removal skip → finish node
    $id("removal-skip-btn")?.addEventListener("click", async () => {
      currentRun = await api("/run/finish-node.json", { run: currentRun });
      saveRun(currentRun);
      render();
    });

    // Shop leave
    $id("shop-leave-btn")?.addEventListener("click", async () => {
      currentRun = { ...currentRun, shop: null };
      currentRun = await api("/run/finish-node.json", { run: currentRun });
      saveRun(currentRun);
      render();
    });

    // End state new run
    $id("end-new-run-btn")?.addEventListener("click", async () => {
      localStorage.removeItem(SAVE_KEY);
      currentRun = await fetchJson("/run/new.json");
      saveRun(currentRun);
      render();
    });
  }

  // ─── Boot ─────────────────────────────────────────────────────────
  async function initializeApp() {
    try {
      await loadSharedCatalogs();
    } catch (e) {
      // catalogs unavailable — still boot
    }
    const saved = loadRun();
    if (saved) currentRun = saved;
    renderStart();
  }

  initListeners();
  initializeApp();
})();
