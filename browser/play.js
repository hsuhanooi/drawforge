/* eslint-env browser */
(() => {
  // ─── Globals ──────────────────────────────────────────────────────
  const SAVE_KEY = "drawforge.v1";
  let cardCatalog = null;
  let currentRun = null;
  let prevMapHp   = -1;
  let prevMapGold = -1;
  let prevShopGold = -1;
  let deckSortMode = "type"; // "type" | "cost"
  let isCardPlaying = false;
  let selectedHandCardIndex = null;
  let dragHandState = null;

  const ARCHETYPES = [
    {
      id: "hex_witch",
      name: "Hex Witch",
      icon: "🔮",
      color: "#b06ad4",
      description: "Curse your enemies and drain their power. Stack Hex to empower devastating finisher attacks.",
      starterCards: ["mark_of_ruin", "hexblade", "feast_on_weakness", "deep_hex", "black_seal"]
    },
    {
      id: "ashen_knight",
      name: "Ashen Knight",
      icon: "🔥",
      color: "#e07830",
      description: "Sacrifice cards for explosive bursts of power. Exhaust your hand to fuel massive attacks.",
      starterCards: ["overclock", "fire_sale", "scorch_nerves", "cinder_rush", "hollow_ward"]
    },
    {
      id: "static_duelist",
      name: "Static Duelist",
      icon: "⚡",
      color: "#4f8ef7",
      description: "Build electrical charge and release it in powerful surges. Defend until the moment is right.",
      starterCards: ["charge_up", "arc_lash", "static_guard", "capacitor", "guarded_pulse"]
    }
  ];

  function calcRunScore(run) {
    const s = run.stats || {};
    return Math.max(0,
      (run.act || 1) * 1000 +
      (s.enemiesKilled || 0) * 75 +
      (s.highestSingleHit || 0) * 10 -
      (s.damageTaken || 0) * 2
    );
  }

  function calcRunGrade(score) {
    if (score >= 3000) return "S";
    if (score >= 2000) return "A";
    if (score >= 1200) return "B";
    if (score >= 600)  return "C";
    return "D";
  }

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
    if (screenId === "screen-combat") {
      window.AnimEngine?.show();
    } else {
      window.AnimEngine?.hide();
      window.AnimEngine?.hidePlayer();
    }
  }

  // ─── Screen Transitions (Task 4) ─────────────────────────────────
  function flashTransition(type = "flash") {
    const ov = $id("transition-overlay");
    if (!ov) return;
    ov.className = type;
    ov.addEventListener("animationend", () => { ov.className = ""; }, { once: true });
  }

  function showActTransition(actNum) {
    return new Promise((resolve) => {
      let el = $id("act-transition-overlay");
      if (!el) {
        el = document.createElement("div");
        el.id = "act-transition-overlay";
        const t = document.createElement("div");
        t.className = "act-text";
        el.appendChild(t);
        document.body.appendChild(el);
      }
      el.querySelector(".act-text").textContent = `ACT ${actNum}`;
      flashTransition("flash-white");
      el.className = "show";
      el.addEventListener("animationend", () => { el.className = ""; resolve(); }, { once: true });
    });
  }

  // ─── Card Hover Preview (Task 1) ─────────────────────────────────
  let previewHideTimer = null;

  function showCardPreview(card, anchorEl) {
    clearTimeout(previewHideTimer);
    let popup = $id("card-preview-popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "card-preview-popup";
      document.body.appendChild(popup);
    }
    clearEl(popup);
    popup.className = `rarity-${card.rarity || "common"}`;

    const canvas = document.createElement("canvas");
    canvas.className = "preview-art-canvas";
    canvas.width = 420; canvas.height = 180;
    popup.appendChild(canvas);
    drawCardArt(canvas, card);

    const stripe = document.createElement("div");
    stripe.className = `preview-type-stripe type-${card.type || "skill"}`;
    popup.appendChild(stripe);

    const body = document.createElement("div");
    body.className = "preview-body";

    const header = document.createElement("div");
    header.className = "preview-header";
    const costEl = document.createElement("div");
    const cv = card.cost !== undefined ? card.cost : 0;
    costEl.className = `preview-cost cost-${cv}`;
    costEl.textContent = cv;
    const nameEl = document.createElement("div");
    nameEl.className = "preview-name";
    nameEl.textContent = card.name || card.id;
    header.appendChild(costEl);
    header.appendChild(nameEl);
    body.appendChild(header);

    const effEl = document.createElement("div");
    effEl.className = "preview-effect";
    renderRulesText(effEl, card.effectText || describeCard(card));
    body.appendChild(effEl);

    if (card.archetype) {
      const archEl = document.createElement("div");
      archEl.className = "preview-archetype";
      archEl.textContent = card.archetype;
      body.appendChild(archEl);
    }
    popup.appendChild(body);

    // Smart positioning
    const rect = anchorEl.getBoundingClientRect();
    const pw = 210; const ph = 240;
    let left = rect.left + rect.width / 2 - pw / 2;
    let top = rect.top - ph - 14;
    if (top < 8) top = rect.bottom + 10;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    top  = Math.max(8, Math.min(top,  window.innerHeight - ph - 8));
    popup.style.left = `${left}px`;
    popup.style.top  = `${top}px`;
    popup.style.display = "block";
    // Restart animation
    popup.style.animation = "none";
    popup.offsetHeight;
    popup.style.animation = "";
  }

  function hideCardPreview() {
    previewHideTimer = setTimeout(() => {
      const popup = $id("card-preview-popup");
      if (popup) popup.style.display = "none";
    }, 60);
  }

  // ─── Option icon helper ───────────────────────────────────────────
  function getOptionIcon(option) {
    const label  = (option.label  || "").toLowerCase();
    const effect = (option.effect || option.id || "").toLowerCase();
    if (effect === "heal"   || label.includes("heal") || label.includes("rest"))    return "❤️";
    if (effect === "smith"  || label.includes("upgrade") || label.includes("forge")) return "⚒️";
    if (effect === "remove" || label.includes("remove"))                             return "🗑️";
    if (label.includes("gold") || label.includes("coin"))                           return "💰";
    if (label.includes("card") || label.includes("deck"))                           return "🃏";
    if (label.includes("relic"))                                                     return "✨";
    if (label.includes("curse") || label.includes("lose") || label.includes("pain")) return "💀";
    if (label.includes("skip") || label.includes("leave") || label.includes("pass")) return "➡️";
    return "❓";
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

  const KEYWORD_GLOSSARY = {
    Hex: "A stacking curse on the enemy. Some cards deal extra damage or trigger bonuses against Hexed targets.",
    Charged: "A temporary empowered state that enables card bonuses and energy effects until it is spent or the turn ends.",
    Exhaust: "The card leaves combat for the rest of the fight instead of going to the discard pile.",
    Draw: "Take cards from your draw pile into your hand.",
    Block: "Prevents incoming damage until the end of the turn unless a rule says otherwise.",
    Weak: "Reduces attack damage dealt while it lasts.",
    Vulnerable: "Makes the target take increased damage while it lasts.",
    Strength: "Increases outgoing attack damage.",
    Dexterity: "Increases block gained from defensive cards and effects.",
    Energy: "Your per-turn resource for playing cards.",
    Cost: "How much energy you must spend to play the card."
  };

  function buildKeywordNodes(text) {
    const fragment = document.createDocumentFragment();
    const keywordPattern = /\b(Hex|Hexed|Charged|Exhaust|Draw|Block|Weak|Vulnerable|Strength|Dexterity|energy|Cost)\b/g;
    let lastIndex = 0;
    let match;

    while ((match = keywordPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const rawKeyword = match[0];
      const glossaryKey = rawKeyword === "Hexed" ? "Hex" : (rawKeyword === "energy" ? "Energy" : rawKeyword);
      const keywordEl = document.createElement("span");
      keywordEl.className = "keyword-term";
      keywordEl.tabIndex = 0;
      keywordEl.textContent = rawKeyword;

      const tooltip = document.createElement("span");
      tooltip.className = "keyword-tooltip";
      tooltip.textContent = KEYWORD_GLOSSARY[glossaryKey] || rawKeyword;
      keywordEl.appendChild(tooltip);
      fragment.appendChild(keywordEl);
      lastIndex = match.index + rawKeyword.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    return fragment;
  }

  function renderRulesText(targetEl, text) {
    clearEl(targetEl);
    targetEl.appendChild(buildKeywordNodes(text || ""));
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
    canvas.width = large ? 150 : 122;
    canvas.height = large ? 92 : 76;
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
    renderRulesText(descDiv, describeCard(card));
    div.appendChild(descDiv);

    // Shine overlay (mouse-tilt highlight)
    const shine = document.createElement("div");
    shine.className = "card-shine";
    div.appendChild(shine);

    if (onClick && !unplayable) {
      div.tabIndex = 0;
      div.setAttribute("role", "button");
      div.addEventListener("click", onClick);
      div.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      });
    }

    if (dealDelay >= 0) {
      setTimeout(() => div.classList.add("dealing"), dealDelay);
      setTimeout(() => div.classList.remove("dealing"), dealDelay + 400);
    }

    // Hover preview
    div.addEventListener("mouseenter", () => showCardPreview(card, div));
    div.addEventListener("mouseleave", hideCardPreview);

    // Mouse tilt (outside hand-arc; hand-arc overrides via its own handlers)
    if (!unplayable) {
      div.addEventListener("mousemove", (e) => {
        const r = div.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width - 0.5;
        const cy = (e.clientY - r.top) / r.height - 0.5;
        shine.style.setProperty("--sx", `${(cx + 0.5) * 100}%`);
        shine.style.setProperty("--sy", `${(cy + 0.5) * 100}%`);
      });
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

  function flashTriggeredRelics(triggeredRelics) {
    if (!triggeredRelics?.length) return;
    const relics = currentRun?.relics || [];
    const triggeredNames = triggeredRelics
      .map((relicId) => relics.find((r) => r.id === relicId)?.name)
      .filter(Boolean);
    if (triggeredNames.length > 0) {
      setCombatStateMessage(`Relic triggered · ${triggeredNames.join(", ")}`, "relic");
    }
    ["combat-relic-strip", "map-relic-strip"].forEach((stripId) => {
      const strip = $id(stripId);
      if (!strip) return;
      const badges = Array.from(strip.querySelectorAll(".relic-badge"));
      triggeredRelics.forEach((relicId) => {
        const idx = relics.findIndex((r) => r.id === relicId);
        if (idx >= 0 && badges[idx]) {
          badges[idx].classList.add("relic-triggered");
          badges[idx].addEventListener("animationend", () => badges[idx].classList.remove("relic-triggered"), { once: true });
        }
      });
    });
  }

  const POTION_ICONS = { healing_potion: "🧪", strength_potion: "💪", hex_vial: "☠️" };

  function renderPotionStrip(potions) {
    let strip = $id("potion-strip");
    if (!strip) {
      strip = document.createElement("div");
      strip.id = "potion-strip";
      strip.className = "potion-strip";
      const combatTop = $id("combat-topbar") || $id("combat-relic-strip")?.parentElement;
      if (combatTop) combatTop.appendChild(strip);
    }
    clearEl(strip);
    potions.forEach((potion) => {
      const btn = document.createElement("button");
      btn.className = "potion-btn";
      btn.title = `${potion.name}: ${potion.description}`;
      const icon = document.createElement("span");
      icon.textContent = POTION_ICONS[potion.id] || "🫧";
      btn.appendChild(icon);
      const label = document.createElement("span");
      label.className = "potion-name";
      label.textContent = potion.name;
      btn.appendChild(label);
      btn.addEventListener("click", async () => {
        currentRun = await api("/run/use-potion.json", { run: currentRun, potionId: potion.id });
        saveRun(currentRun);
        render();
      });
      btn.addEventListener("contextmenu", async (e) => {
        e.preventDefault();
        currentRun = await api("/run/discard-potion.json", { run: currentRun, potionId: potion.id });
        saveRun(currentRun);
        render();
      });
      strip.appendChild(btn);
    });
  }

  // ─── Enemy Avatar Art (Task 3) ────────────────────────────────────
  let enemyIdleRaf = null;

  function drawEnemyArt(canvas, enemy) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const id = (enemy.id || enemy.name || "").toLowerCase();
    const isPhase2 = enemy.phase === 2;

    if (id.includes("slime") || id.includes("ooze")) {
      // Green blob
      const g = ctx.createRadialGradient(w*0.5, h*0.6, 0, w*0.5, h*0.6, w*0.42);
      g.addColorStop(0, isPhase2 ? "#80ff80" : "#44cc44");
      g.addColorStop(0.7, isPhase2 ? "#208820" : "#156015");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(w*0.5, h*0.62, w*0.38, h*0.35, 0, 0, Math.PI*2);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(w*0.38, h*0.5, 6, 7, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.62, h*0.5, 6, 7, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.ellipse(w*0.38, h*0.51, 3, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.62, h*0.51, 3, 4, 0, 0, Math.PI*2); ctx.fill();

    } else if (id.includes("cultist") || id.includes("captain")) {
      // Hooded figure
      const bgG = ctx.createRadialGradient(w*0.5, h*0.4, 0, w*0.5, h*0.5, w*0.5);
      bgG.addColorStop(0, isPhase2 ? "rgba(100,0,0,0.4)" : "rgba(60,0,80,0.3)");
      bgG.addColorStop(1, "transparent");
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, w, h);
      // robe
      ctx.fillStyle = isPhase2 ? "#440000" : "#1a0028";
      ctx.beginPath();
      ctx.moveTo(w*0.22, h*0.95); ctx.lineTo(w*0.28, h*0.45);
      ctx.lineTo(w*0.5, h*0.3); ctx.lineTo(w*0.72, h*0.45);
      ctx.lineTo(w*0.78, h*0.95); ctx.closePath(); ctx.fill();
      // hood
      ctx.fillStyle = isPhase2 ? "#660000" : "#2d0040";
      ctx.beginPath(); ctx.ellipse(w*0.5, h*0.3, w*0.18, h*0.2, 0, 0, Math.PI*2); ctx.fill();
      // glowing eyes
      const eyeColor = isPhase2 ? "#ff2020" : "#cc44ff";
      ctx.fillStyle = eyeColor;
      ctx.shadowColor = eyeColor; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(w*0.43, h*0.28, 3, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.57, h*0.28, 3, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else if (id.includes("sentinel") || id.includes("stone") || id.includes("golem")) {
      // Rocky mass
      ctx.fillStyle = isPhase2 ? "#888" : "#556";
      ctx.beginPath();
      ctx.moveTo(w*0.2, h*0.9); ctx.lineTo(w*0.15, h*0.55);
      ctx.lineTo(w*0.25, h*0.35); ctx.lineTo(w*0.4, h*0.2);
      ctx.lineTo(w*0.6, h*0.2); ctx.lineTo(w*0.75, h*0.35);
      ctx.lineTo(w*0.85, h*0.55); ctx.lineTo(w*0.8, h*0.9);
      ctx.closePath(); ctx.fill();
      // cracks
      ctx.strokeStyle = isPhase2 ? "#aaa" : "#334";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w*0.45, h*0.25); ctx.lineTo(w*0.42, h*0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w*0.6, h*0.3); ctx.lineTo(w*0.65, h*0.6); ctx.stroke();
      // eyes glow
      const stoneEye = isPhase2 ? "#88ffff" : "#ff8844";
      ctx.fillStyle = stoneEye; ctx.shadowColor = stoneEye; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(w*0.38, h*0.44, 5, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.62, h*0.44, 5, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else if (id.includes("hex") || id.includes("fiend")) {
      // Jagged dark figure with purple glow
      const aura = ctx.createRadialGradient(w*0.5, h*0.5, 0, w*0.5, h*0.5, w*0.48);
      aura.addColorStop(0, "rgba(120,40,180,0.35)");
      aura.addColorStop(1, "transparent");
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = isPhase2 ? "#300050" : "#1a0030";
      // jagged body
      ctx.beginPath();
      ctx.moveTo(w*0.5, h*0.1);
      ctx.lineTo(w*0.65, h*0.25); ctx.lineTo(w*0.8, h*0.2);
      ctx.lineTo(w*0.75, h*0.4); ctx.lineTo(w*0.85, h*0.6);
      ctx.lineTo(w*0.65, h*0.55); ctx.lineTo(w*0.6, h*0.85);
      ctx.lineTo(w*0.5, h*0.7);  ctx.lineTo(w*0.4, h*0.85);
      ctx.lineTo(w*0.35, h*0.55); ctx.lineTo(w*0.15, h*0.6);
      ctx.lineTo(w*0.25, h*0.4);  ctx.lineTo(w*0.2, h*0.2);
      ctx.lineTo(w*0.35, h*0.25); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = isPhase2 ? "#aa44ff" : "#8833dd";
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#dd88ff"; ctx.shadowColor = "#aa44ff"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(w*0.4, h*0.35, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.6, h*0.35, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else if (id.includes("specter") || id.includes("spirit") || id.includes("void") && !id.includes("sovereign")) {
      // Wispy translucent form
      for (let i = 0; i < 4; i++) {
        const g2 = ctx.createRadialGradient(w*(0.3+i*0.12), h*(0.3+i*0.1), 0, w*(0.3+i*0.12), h*(0.3+i*0.1), 30+i*8);
        g2.addColorStop(0, isPhase2 ? "rgba(180,60,255,0.4)" : "rgba(80,80,200,0.3)");
        g2.addColorStop(1, "transparent");
        ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
      }
      ctx.strokeStyle = isPhase2 ? "rgba(200,100,255,0.6)" : "rgba(100,100,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(w*0.3, h*0.8); ctx.bezierCurveTo(w*0.2,h*0.5, w*0.4,h*0.2, w*0.5,h*0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w*0.7, h*0.8); ctx.bezierCurveTo(w*0.8,h*0.5, w*0.6,h*0.2, w*0.5,h*0.15); ctx.stroke();
      ctx.fillStyle = isPhase2 ? "#ff88ff" : "#8888ff";
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.ellipse(w*0.42, h*0.3, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.58, h*0.3, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else if (id.includes("colossus") || id.includes("bone")) {
      // Stacked bone shapes
      ctx.strokeStyle = isPhase2 ? "#eee" : "#ccc";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      // spine
      ctx.beginPath(); ctx.moveTo(w*0.5, h*0.15); ctx.lineTo(w*0.5, h*0.85); ctx.stroke();
      // ribs
      for (let r = 0; r < 5; r++) {
        const y = h*(0.28 + r*0.11);
        ctx.beginPath(); ctx.moveTo(w*0.5, y); ctx.lineTo(w*(0.18+r*0.03), y+10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w*0.5, y); ctx.lineTo(w*(0.82-r*0.03), y+10); ctx.stroke();
      }
      // skull
      ctx.fillStyle = isPhase2 ? "#fff" : "#ddd";
      ctx.beginPath(); ctx.ellipse(w*0.5, h*0.18, 16, 14, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath(); ctx.ellipse(w*0.43, h*0.17, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.57, h*0.17, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      if (isPhase2) {
        ctx.fillStyle = "#ff4444"; ctx.shadowColor = "#ff2222"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(w*0.43, h*0.17, 4, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w*0.57, h*0.17, 4, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }

    } else if (id.includes("sovereign") || id.includes("boss")) {
      // Layered boss: large imposing form
      const c1 = isPhase2 ? "#300030" : "#0d001a";
      const c2 = isPhase2 ? "#800080" : "#440066";
      const crown = isPhase2 ? "#ff44ff" : "#aa44ff";
      const bgG2 = ctx.createRadialGradient(w*0.5, h*0.5, 0, w*0.5, h*0.5, w*0.6);
      bgG2.addColorStop(0, isPhase2 ? "rgba(150,0,150,0.4)" : "rgba(80,0,120,0.3)");
      bgG2.addColorStop(1, "transparent");
      ctx.fillStyle = bgG2; ctx.fillRect(0, 0, w, h);
      // core body
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.ellipse(w*0.5, h*0.55, w*0.3, h*0.38, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.ellipse(w*0.5, h*0.5, w*0.22, h*0.3, 0, 0, Math.PI*2); ctx.fill();
      // crown spikes
      ctx.fillStyle = crown; ctx.shadowColor = crown; ctx.shadowBlur = 15;
      for (let s = 0; s < 5; s++) {
        const angle = (Math.PI * 1.3) + s * (Math.PI * 0.85 / 4);
        const bx = w*0.5 + Math.cos(angle)*w*0.2;
        const by = h*0.22 + Math.sin(angle)*h*0.18;
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.lineTo(w*0.5 + Math.cos(angle)*w*0.35, h*0.22 + Math.sin(angle)*h*0.35);
        ctx.lineWidth = 2; ctx.strokeStyle = crown; ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // eyes
      const eyeC = isPhase2 ? "#ff00ff" : "#cc88ff";
      ctx.fillStyle = eyeC; ctx.shadowColor = eyeC; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.ellipse(w*0.38, h*0.42, 7, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.62, h*0.42, 7, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else {
      // Generic fallback enemy
      const fg = ctx.createRadialGradient(w*0.5, h*0.45, 0, w*0.5, h*0.45, w*0.38);
      fg.addColorStop(0, "#554466"); fg.addColorStop(1, "#221133");
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(w*0.5, h*0.45, w*0.3, h*0.35, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ff8844"; ctx.shadowColor = "#ff6622"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(w*0.4, h*0.38, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.6, h*0.38, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function startEnemyIdle() {
    if (enemyIdleRaf) cancelAnimationFrame(enemyIdleRaf);
    const canvas = $id("enemy-canvas");
    if (!canvas) return;
    function tick(ts) {
      const offset = Math.sin(ts / 900) * 3;
      canvas.style.transform = `translateY(${offset}px)`;
      enemyIdleRaf = requestAnimationFrame(tick);
    }
    enemyIdleRaf = requestAnimationFrame(tick);
  }

  function stopEnemyIdle() {
    if (enemyIdleRaf) { cancelAnimationFrame(enemyIdleRaf); enemyIdleRaf = null; }
    const canvas = $id("enemy-canvas");
    if (canvas) canvas.style.transform = "";
  }

  function flashEnemyHit() {
    const canvas = $id("enemy-canvas");
    if (!canvas) return;
    canvas.classList.add("hit-flash");
    canvas.addEventListener("animationend", () => canvas.classList.remove("hit-flash"), { once: true });
  }

  // ─── AnimEngine position helpers ─────────────────────────────────
  function getPlayerAnimPos() {
    const pp = $id("player-panel");
    if (!pp) return null;
    const r = pp.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.38 };
  }

  function getEnemyAnimPos() {
    const ec = $id("enemy-canvas");
    if (!ec) return null;
    const r = ec.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.46 };
  }

  function syncAnimBattleState() {
    if (!currentRun?.combat || !window.AnimEngine) return;
    const c = currentRun.combat;
    const maxHp = currentRun.player?.maxHealth || 80;
    window.AnimEngine.setBattleState(
      c.player.health / maxHp,
      !!c.player.charged,
      c.enemy.hex || 0
    );
  }

  // ─── Ambient Particles ────────────────────────────────────────────
  let ambientParticleTimer = null;
  function startAmbientParticles(nodeType) {
    if (ambientParticleTimer) return;
    const moteTypes = nodeType === "boss"
      ? ["mote-red", "mote-gold", "mote-purple"]
      : nodeType === "elite"
        ? ["mote-red", "mote-purple"]
        : ["mote-blue", "mote-purple"];
    ambientParticleTimer = setInterval(() => {
      const sc = $id("screen-combat");
      if (!sc || sc.classList.contains("hidden")) { stopAmbientParticles(); return; }
      const p = document.createElement("div");
      const cls = moteTypes[Math.floor(Math.random() * moteTypes.length)];
      p.className = `ambient-particle ${cls}`;
      p.style.left = `${5 + Math.random() * 90}%`;
      p.style.bottom = `${15 + Math.random() * 10}%`;
      const dy = -(120 + Math.random() * 160);
      const dx = (Math.random() - 0.5) * 80;
      p.style.setProperty("--rise-dy", `${dy}px`);
      p.style.setProperty("--rise-dx", `${dx}px`);
      const dur = 3 + Math.random() * 3.5;
      p.style.animationDuration = `${dur}s`;
      sc.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }, 340);
  }

  function stopAmbientParticles() {
    if (ambientParticleTimer) { clearInterval(ambientParticleTimer); ambientParticleTimer = null; }
  }

  // ─── Combat Atmosphere (Task 5) ───────────────────────────────────
  function renderCombatBg(nodeType) {
    const bg = $id("combat-bg");
    if (!bg) return;
    clearEl(bg);

    if (nodeType === "elite") {
      const glow = document.createElement("div");
      glow.className = "ember-glow";
      bg.appendChild(glow);
      for (let i = 0; i < 5; i++) {
        const spark = document.createElement("div");
        spark.className = "ember-spark";
        spark.style.left = `${15 + Math.random() * 70}%`;
        spark.style.bottom = `${Math.random() * 20}%`;
        const dy = -(80 + Math.random() * 120);
        const dx = (Math.random() - 0.5) * 60;
        spark.style.setProperty("--ember-dy", `${dy}px`);
        spark.style.setProperty("--ember-dx", `${dx}px`);
        spark.style.animationDuration = `${1.5 + Math.random() * 2}s`;
        spark.style.animationDelay = `${Math.random() * 2}s`;
        bg.appendChild(spark);
      }
    } else if (nodeType === "boss") {
      const vig = document.createElement("div");
      vig.className = "boss-vignette";
      bg.appendChild(vig);
      for (let i = 0; i < 3; i++) {
        const bolt = document.createElement("div");
        bolt.className = "boss-lightning";
        bolt.style.left = `${20 + i * 30}%`;
        bolt.style.height = `${40 + Math.random() * 40}%`;
        bolt.style.animationDuration = `${3 + Math.random() * 4}s`;
        bolt.style.animationDelay = `${Math.random() * 4}s`;
        bg.appendChild(bolt);
      }
    } else {
      // Normal: smoke orbs
      const colors = ["#2a3060", "#1a2040", "#302040", "#202840"];
      for (let i = 0; i < 6; i++) {
        const orb = document.createElement("div");
        orb.className = "smoke-orb";
        const size = 80 + Math.random() * 120;
        orb.style.width = orb.style.height = `${size}px`;
        orb.style.left = `${Math.random() * 90}%`;
        orb.style.top  = `${Math.random() * 80}%`;
        orb.style.background = colors[Math.floor(Math.random() * colors.length)];
        orb.style.setProperty("--smoke-dy", `${-30 - Math.random() * 50}px`);
        orb.style.setProperty("--smoke-dx", `${(Math.random() - 0.5) * 40}px`);
        orb.style.animationDuration = `${8 + Math.random() * 6}s`;
        orb.style.animationDelay = `${Math.random() * 4}s`;
        bg.appendChild(orb);
      }
    }
  }

  // ─── Victory Fanfare (Task 9) ─────────────────────────────────────
  function screenShake() {
    const sc = $id("screen-combat");
    if (!sc) return;
    sc.classList.add("shaking");
    sc.addEventListener("animationend", () => sc.classList.remove("shaking"), { once: true });
  }

  function spawnKillConfetti(anchorEl, count = 22) {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#f0c040", "#ff8c40", "#ff4444", "#cc44ff", "#44ccff"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "kill-confetti";
      piece.style.left = `${cx}px`;
      piece.style.top  = `${cy}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist  = 40 + Math.random() * 110;
      piece.style.setProperty("--kx", `${Math.cos(angle) * dist}px`);
      piece.style.setProperty("--ky", `${Math.sin(angle) * dist}px`);
      piece.style.animationDuration = `${0.45 + Math.random() * 0.5}s`;
      document.body.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  function showKillTextOverlay(text, color) {
    const el = document.createElement("div");
    el.className = "kill-text-overlay";
    el.style.color = color;
    el.textContent = text;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function showKillFlash() {
    const el = document.createElement("div");
    el.className = "kill-flash-overlay";
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  // ─── Hand Arc ─────────────────────────────────────────────────────
  function applyHandArc(handArea) {
    const cards = Array.from(handArea.querySelectorAll(".card-component"));
    const n = cards.length;
    if (n === 0) return;

    const center = (n - 1) / 2;
    const width = handArea.clientWidth || 900;
    const compact = n >= 8 || width < 980;
    const rotStep = Math.min(compact ? 4.2 : 5.2, (compact ? 26 : 30) / n);
    const liftStep = compact ? 4 : 5;
    const overlapPx = n <= 4 ? 0 : Math.min(44, 8 + (n - 4) * 6);

    handArea.style.setProperty("--hand-count", String(n));
    handArea.style.setProperty("--hand-overlap", `${overlapPx}px`);
    handArea.classList.toggle("hand-dense", compact);

    cards.forEach((card, i) => {
      const offset = i - center;
      const rot = offset * rotStep;
      const ty = Math.abs(offset) * liftStep;
      const isEdge = i === 0 || i === n - 1;
      card.style.transform = `rotate(${rot}deg) translateY(${ty}px)`;
      card.style.setProperty("--arc-rot", `${rot}deg`);
      card.style.setProperty("--arc-lift", `${ty}px`);
      card.style.marginLeft = i === 0 ? "0px" : `-${overlapPx}px`;
      card.style.marginRight = isEdge ? "0px" : "";
      card.style.zIndex = String(20 + i);
      card.style.transition = "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s, z-index 0s";

      card.onmouseenter = () => {
        card.style.zIndex = "60";
        card.style.transition = "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s";
      };

      card.onmousemove = (e) => {
        if (card.classList.contains("unplayable")) return;
        const r = card.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width - 0.5;
        const cy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-34px) scale(1.12) rotateX(${-cy * 14}deg) rotateY(${cx * 14}deg)`;
        const shine = card.querySelector(".card-shine");
        if (shine) {
          shine.style.setProperty("--sx", `${(cx + 0.5) * 100}%`);
          shine.style.setProperty("--sy", `${(cy + 0.5) * 100}%`);
        }
      };

      card.onmouseleave = () => {
        card.style.transform = `rotate(${rot}deg) translateY(${ty}px)`;
        card.style.zIndex = String(20 + i);
      };
    });
  }

  // ─── Intent Icon System (Task 10) ─────────────────────────────────
  function renderIntent(intent) {
    const box = $id("intent-box");
    const actionEl = $id("intent-action");
    if (!box || !actionEl) return;

    const ICONS = {
      attack:       "⚔️",
      multi_attack: "⚔️⚔️",
      block:        "🛡️",
      buff:         "💪",
      debuff_weak:  "💀",
      debuff_hex:   "☠️",
      debuff_curse: "👁️",
      unknown:      "❓"
    };

    if (!intent) {
      actionEl.innerHTML = '<span class="intent-value-lg neutral">—</span>';
      box.classList.remove("danger");
      return;
    }

    const icon = ICONS[intent.type] || "❓";
    const isAttack = intent.type === "attack" || intent.type === "multi_attack";
    const isDanger = isAttack && (intent.value || 0) >= 10;

    let valueHtml;
    if (isAttack) {
      const hits = intent.hits ? ` ×${intent.hits}` : "";
      valueHtml = `<span class="intent-value-lg">${intent.value || "?"}${hits}</span>`;
    } else if (intent.value) {
      valueHtml = `<span class="intent-value-lg neutral">${intent.label || intent.type}</span>`;
    } else {
      valueHtml = `<span class="intent-value-lg neutral">${intent.label || intent.type}</span>`;
    }

    actionEl.innerHTML = `<span class="intent-icon-lg">${icon}</span>${valueHtml}`;
    box.classList.toggle("danger", isDanger);
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

  function floatText(anchorEl, text, cls) {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const div = document.createElement("div");
    div.className = `float-dmg ${cls || "block-gain"}`;
    div.textContent = text;
    div.style.left = `${rect.left + rect.width / 2 - 24}px`;
    div.style.top = `${rect.top - 10}px`;
    document.body.appendChild(div);
    div.addEventListener("animationend", () => div.remove());
  }

  let bossPhaseWarned = false;
  function checkBossPhaseWarning(combat) {
    if (!combat || combat.nodeType !== "boss") { bossPhaseWarned = false; return; }
    if (bossPhaseWarned) return;
    const maxHp = combat.enemy.maxHp || combat.enemy.health;
    const pct = combat.enemy.health / maxHp;
    if (pct < 0.6 && pct > 0 && !combat.phaseTransition && combat.enemy.phase !== 2) {
      bossPhaseWarned = true;
      const overlay = document.createElement("div");
      overlay.className = "boss-phase-warning";
      overlay.textContent = "⚡ PHASE 2 APPROACHING";
      document.body.appendChild(overlay);
      overlay.addEventListener("animationend", () => overlay.remove());
    }
  }

  function checkCurseDrawn(prevHand, nextHand) {
    const prevCurseIds = new Set((prevHand || []).filter((c) => c.type === "curse").map((c) => c.id));
    const newCurses = (nextHand || []).filter((c) => c.type === "curse" && !prevCurseIds.has(c.id));
    if (newCurses.length === 0) return;
    newCurses.forEach((c) => {
      const toast = document.createElement("div");
      toast.className = "curse-toast";
      toast.textContent = `☠ ${c.name} drawn`;
      document.body.appendChild(toast);
      toast.addEventListener("animationend", () => toast.remove());
    });
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

  function setCombatStateMessage(message, tone = "player") {
    const chip = $id("turn-state-chip");
    if (!chip) return;
    chip.textContent = message;
    chip.dataset.tone = tone;
  }

  function clearSelectedHandCard() {
    selectedHandCardIndex = null;
    dragHandState = null;
  }

  function getSelectedCombatCard() {
    return selectedHandCardIndex === null ? null : currentRun?.combat?.hand?.[selectedHandCardIndex] || null;
  }

  function setSelectedHandCard(handArea, handIndex, cardEl, card) {
    selectedHandCardIndex = handIndex;
    dragHandState = null;
    setActiveHandCard(handArea, cardEl);
    Array.from(handArea.querySelectorAll(".card-component")).forEach((el, idx) => {
      el.classList.toggle("is-selected", idx === handIndex);
    });
    const mode = card?.type === "attack" ? "click the enemy to confirm" : "click again or drag upward to play";
    setCombatStateMessage(`Card ready · ${mode}`, "player");
  }

  function buildCardPreviewSummary(card, combat) {
    if (!card || !combat) return null;
    const parts = [];
    let totalDamage = card.damage || 0;
    if (card.type === "attack") {
      totalDamage += combat.player.strength || 0;
      if ((combat.enemy.hex || 0) > 0) totalDamage += card.bonusVsHex || 0;
      if ((combat.enemy.vulnerable || 0) > 0) totalDamage += card.bonusVsVulnerable || 0;
      if ((combat.player.weak || 0) > 0) totalDamage = Math.floor(totalDamage * 0.75);
      if ((combat.enemy.vulnerable || 0) > 0) totalDamage = Math.floor(totalDamage * 1.5);
      if (totalDamage > 0) parts.push(`Deal ${totalDamage}`);
    }
    let blockGain = card.block || 0;
    if (blockGain > 0) {
      blockGain += combat.player.dexterity || 0;
      if (card.bonusBlockIfHexed && (combat.enemy.hex || 0) > 0) blockGain += card.bonusBlockIfHexed;
      if (card.bonusBlockIfCharged && combat.player.charged) blockGain += card.bonusBlockIfCharged;
      parts.push(`Gain ${blockGain} block`);
    }
    if (card.draw) parts.push(`Draw ${card.draw}`);
    if (card.energyGain) parts.push(`Gain ${card.energyGain} energy`);
    if (card.hex) parts.push(`Apply ${card.hex} Hex`);
    if (card.vulnerable) parts.push(`Apply ${card.vulnerable} Vulnerable`);
    if (card.weak) parts.push(`Apply ${card.weak} Weak`);
    return parts.length ? parts.join(" · ") : describeCard(card);
  }

  function renderCardSelectionPreview(card, combat) {
    ["player-preview-chip", "enemy-preview-chip"].forEach((id) => {
      let chip = $id(id);
      if (!chip) {
        chip = document.createElement("div");
        chip.id = id;
        chip.className = "combat-preview-chip hidden";
        const parentId = id === "player-preview-chip" ? "player-panel" : "enemy-panel";
        $id(parentId)?.appendChild(chip);
      }
    });

    const playerChip = $id("player-preview-chip");
    const enemyChip = $id("enemy-preview-chip");
    if (!playerChip || !enemyChip) return;

    if (!card || !combat || combat.turn !== "player" || combat.state !== "active") {
      playerChip.classList.add("hidden");
      enemyChip.classList.add("hidden");
      return;
    }

    const summary = buildCardPreviewSummary(card, combat);
    playerChip.textContent = card.block || card.energyGain || card.draw ? summary : "";
    enemyChip.textContent = card.type === "attack" || card.hex || card.vulnerable || card.weak ? summary : "";
    playerChip.classList.toggle("hidden", !playerChip.textContent);
    enemyChip.classList.toggle("hidden", !enemyChip.textContent);
  }

  function bindHandCardInteraction({ handArea, cardEl, card, idx, canAfford }) {
    if (!handArea || !cardEl || !canAfford) return;

    const resetDragVisual = () => {
      cardEl.classList.remove("is-dragging");
      cardEl.style.removeProperty("--drag-x");
      cardEl.style.removeProperty("--drag-y");
    };

    const finishDrag = async (event) => {
      if (!dragHandState || dragHandState.handIndex !== idx) return;
      const deltaX = event.clientX - dragHandState.startX;
      const deltaY = event.clientY - dragHandState.startY;
      const draggedFarEnough = Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10;
      const shouldPlay = draggedFarEnough && deltaY <= -90 && card.type !== "attack";
      dragHandState = null;
      resetDragVisual();
      if (shouldPlay) {
        setCombatStateMessage(card.type === "attack" ? "Attack launched" : "Card released", "player");
        await playCard(idx, cardEl);
        return;
      }
      if (!draggedFarEnough) {
        if (selectedHandCardIndex === idx) {
          if (card.type === "attack") {
            setCombatStateMessage("Target locked · click the enemy to strike", "player");
          } else {
            await playCard(idx, cardEl);
          }
        } else {
          setSelectedHandCard(handArea, idx, cardEl, card);
        }
        return;
      }
      setSelectedHandCard(handArea, idx, cardEl, card);
    };

    cardEl.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || isCardPlaying) return;
      dragHandState = {
        handIndex: idx,
        startX: event.clientX,
        startY: event.clientY
      };
      cardEl.setPointerCapture?.(event.pointerId);
      setSelectedHandCard(handArea, idx, cardEl, card);
    });

    cardEl.addEventListener("pointermove", (event) => {
      if (!dragHandState || dragHandState.handIndex !== idx) return;
      const deltaX = event.clientX - dragHandState.startX;
      const deltaY = event.clientY - dragHandState.startY;
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        cardEl.classList.add("is-dragging");
        cardEl.style.setProperty("--drag-x", `${deltaX}px`);
        cardEl.style.setProperty("--drag-y", `${deltaY}px`);
      }
    });

    cardEl.addEventListener("pointerup", finishDrag);
    cardEl.addEventListener("pointercancel", () => {
      dragHandState = null;
      resetDragVisual();
    });
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
  let prevEnergy = 0;

  function renderEnergyPips(current, max) {
    const pipsEl = $id("energy-pips");
    if (!pipsEl) return;
    const isRefill = current > prevEnergy;
    clearEl(pipsEl);
    for (let i = 0; i < max; i++) {
      const pip = document.createElement("div");
      if (i < current) {
        pip.className = "energy-pip filled";
        if (isRefill) {
          pip.style.animationDelay = `${i * 60}ms`;
          pip.classList.add("cascade-fill");
          pip.addEventListener("animationend", () => pip.classList.remove("cascade-fill"), { once: true });
        }
      } else {
        pip.className = "energy-pip";
      }
      pipsEl.appendChild(pip);
    }
    prevEnergy = current;
  }

  // ─── Status Badges ────────────────────────────────────────────────
  const STATUS_TIPS = {
    block:      "Block: absorbs damage before HP; resets each turn",
    charged:    "Charged: unlocks charge-scaling card bonuses",
    strength:   "Strength: +1 damage on every attack",
    dexterity:  "Dexterity: +1 block from every block-granting card",
    weak:       "Weak: deal 25% less damage on attacks",
    hex:        "Hex: empowers hex-scaling cards; some cards consume it for bonus damage",
    vulnerable: "Vulnerable: take 50% more damage from all attacks"
  };

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

    const cards = getDeckCards();
    const countLabel = $id("deck-panel-title");
    if (countLabel) countLabel.textContent = `Your Deck (${cards.length})`;

    // Controls row (sort + summary) — create once, reuse
    let controls = $id("deck-overlay-controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.id = "deck-overlay-controls";
      container.parentElement?.insertBefore(controls, container);
    }
    clearEl(controls);

    const sortBtn = document.createElement("button");
    sortBtn.id = "deck-sort-btn";
    sortBtn.textContent = deckSortMode === "type" ? "Sort: Type" : "Sort: Cost";
    sortBtn.addEventListener("click", () => {
      deckSortMode = deckSortMode === "type" ? "cost" : "type";
      openDeckOverlay();
    });

    const typeCounts = { attack: 0, skill: 0, power: 0, curse: 0 };
    cards.forEach((c) => { if (typeCounts[c.type] !== undefined) typeCounts[c.type]++; });
    const parts = [
      typeCounts.attack && `${typeCounts.attack}A`,
      typeCounts.skill  && `${typeCounts.skill}S`,
      typeCounts.power  && `${typeCounts.power}P`,
      typeCounts.curse  && `${typeCounts.curse}✗`
    ].filter(Boolean);
    const summary = document.createElement("span");
    summary.id = "deck-summary";
    summary.textContent = `${cards.length} cards · ${parts.join(" ")}`;

    controls.appendChild(sortBtn);
    controls.appendChild(summary);

    // Render sorted cards
    clearEl(container);
    const sorted = [...cards];
    if (deckSortMode === "type") {
      const typeOrder = { attack: 0, skill: 1, power: 2, curse: 3 };
      sorted.sort((a, b) => (typeOrder[a.type] ?? 4) - (typeOrder[b.type] ?? 4) || a.name.localeCompare(b.name));
      let lastType = null;
      sorted.forEach((card) => {
        if (card.type !== lastType) {
          const divider = document.createElement("div");
          divider.className = "deck-type-header";
          divider.textContent = card.type.toUpperCase();
          container.appendChild(divider);
          lastType = card.type;
        }
        container.appendChild(makeCard(card, { dealDelay: -1 }));
      });
    } else {
      sorted.sort((a, b) => (a.cost || 0) - (b.cost || 0) || a.name.localeCompare(b.name));
      sorted.forEach((card) => container.appendChild(makeCard(card, { dealDelay: -1 })));
    }

    show("deck-overlay");
  }

  // ─── Screen: Deck Choice (Archetype) ─────────────────────────────
  function renderDeckChoice() {
    if (lastScreen !== "deck-choice") flashTransition("flash");
    lastScreen = "deck-choice";
    showOnly("screen-deck-choice");

    const row = $id("deck-choice-row");
    if (!row) return;
    clearEl(row);

    ARCHETYPES.forEach((arch) => {
      const panel = document.createElement("div");
      panel.className = "archetype-panel";
      panel.style.setProperty("--arch-color", arch.color);

      const header = document.createElement("div");
      header.className = "archetype-header";
      const iconEl = document.createElement("span");
      iconEl.className = "archetype-icon";
      iconEl.textContent = arch.icon;
      const nameEl = document.createElement("span");
      nameEl.className = "archetype-name";
      nameEl.textContent = arch.name;
      header.appendChild(iconEl);
      header.appendChild(nameEl);

      const desc = document.createElement("div");
      desc.className = "archetype-desc";
      desc.textContent = arch.description;

      const cardsLabel = document.createElement("div");
      cardsLabel.className = "archetype-cards-label";
      cardsLabel.textContent = "Signature Cards";

      const cardsRow = document.createElement("div");
      cardsRow.className = "archetype-cards-row";
      arch.starterCards.forEach((cardId) => {
        const card = cardCatalog?.[cardId];
        if (card) cardsRow.appendChild(makeCard(card, { dealDelay: -1 }));
      });

      const selectBtn = document.createElement("button");
      selectBtn.className = "btn archetype-select-btn";
      selectBtn.textContent = `Play as ${arch.name}`;
      selectBtn.addEventListener("click", async () => {
        selectBtn.disabled = true;
        currentRun = await api("/run/choose-archetype.json", { run: currentRun, archetypeId: arch.id });
        saveRun(currentRun);
        render();
      });

      panel.appendChild(header);
      panel.appendChild(desc);
      panel.appendChild(cardsLabel);
      panel.appendChild(cardsRow);
      panel.appendChild(selectBtn);
      row.appendChild(panel);
    });
  }

  // ─── Screen: Start ────────────────────────────────────────────────
  function renderStart() {
    showOnly("screen-start");
    if (!hasSave()) {
      hide("start-load-run-btn");
    } else {
      show("start-load-run-btn");
    }

    // Run history panel
    const startScreen = $id("screen-start");
    let summaryEl = $id("last-run-summary");
    const rawHistory = localStorage.getItem("drawforge.runHistory");
    const rawLast = localStorage.getItem("drawforge.lastRun");
    let runs = [];
    if (rawHistory) {
      runs = JSON.parse(rawHistory).filter(Boolean);
    } else if (rawLast) {
      runs = [JSON.parse(rawLast)].filter(Boolean);
    }
    if (runs.length > 0 && startScreen) {
      if (!summaryEl) {
        summaryEl = document.createElement("div");
        summaryEl.id = "last-run-summary";
        startScreen.appendChild(summaryEl);
      }
      summaryEl.innerHTML = `<div class="last-run-label">Run History</div>`;
      runs.forEach((lr) => {
        const arch = ARCHETYPES.find((a) => a.id === lr.archetype);
        const grade = calcRunGrade(lr.score || 0);
        const outcome = lr.state === "won" ? "🏆" : "💀";
        const row = document.createElement("div");
        row.className = "run-history-row";
        row.innerHTML = `
          <span class="run-history-outcome ${lr.state === "won" ? "win" : "loss"}">${outcome}</span>
          <span class="run-history-arch">${arch ? arch.icon : "?"}</span>
          <span class="run-history-info">Act ${lr.act || 1} · F${lr.floorReached || "?"}</span>
          <span class="run-history-score">${(lr.score || 0).toLocaleString()} <span class="run-grade grade-${grade}">${grade}</span></span>`;
        summaryEl.appendChild(row);
      });
      summaryEl.style.display = "";
    } else if (summaryEl) {
      summaryEl.style.display = "none";
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

  let lastScreen = null;

  function renderMap() {
    if (!currentRun?.map) return;
    if (lastScreen !== "map") flashTransition("flash");
    lastScreen = "map";
    showOnly("screen-map");
    $id("screen-map")?.classList.toggle("act-2", (currentRun.act || 1) >= 2);

    const maxHp  = currentRun.player.maxHealth || 80;
    const newHp   = currentRun.player.health;
    const newGold = currentRun.player.gold;

    const hpEl   = $id("map-hp");
    const goldEl = $id("map-gold");
    if (hpEl)   hpEl.textContent   = `${newHp}/${maxHp}`;
    if (goldEl) goldEl.textContent = newGold;
    $id("map-deck-count").textContent = (currentRun.player.deck || []).length;
    renderRelicStrip("map-relic-strip", currentRun.relics || []);

    // Flash stats on change
    const flashStat = (el, prev, cur) => {
      if (prev >= 0 && cur !== prev && el) {
        el.classList.remove("flashing");
        requestAnimationFrame(() => {
          el.classList.add("flashing");
          el.addEventListener("animationend", () => el.classList.remove("flashing"), { once: true });
        });
      }
    };
    flashStat(hpEl,   prevMapHp,   newHp);
    flashStat(goldEl, prevMapGold, newGold);
    prevMapHp   = newHp;
    prevMapGold = newGold;

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

      const rowWrap = document.createElement("div");
      rowWrap.className = "map-row-wrap";

      const rowLabel = document.createElement("div");
      rowLabel.className = "map-row-label";
      rowLabel.textContent = dataRow === totalRows - 1 ? "BOSS" : `F${dataRow + 1}`;
      rowWrap.appendChild(rowLabel);

      const rowEl = document.createElement("div");
      rowEl.className = "map-row";
      rowWrap.appendChild(rowEl);

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

        // Pulse ring for current node
        if (state === "current") {
          const ring = document.createElement("div");
          ring.className = "node-pulse-ring";
          nodeEl.appendChild(ring);
        }

        // Hover tooltip
        const tip = document.createElement("div");
        tip.className = "node-tooltip";
        tip.textContent = node.enemyName
          ? `${node.type.toUpperCase()} — ${node.enemyName}`
          : node.type.toUpperCase();
        nodeEl.appendChild(tip);

        if (state === "available") {
          nodeEl.addEventListener("click", () => enterNode(node));
        }

        rowEl.appendChild(nodeEl);
      });

      canvas.insertBefore(rowWrap, svg);
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

    const visitedIds = new Set(
      (currentRun.map?.nodes || [])
        .filter((n) => {
          const s = getNodeState(n);
          return s === "visited" || s === "current";
        })
        .map((n) => n.id)
    );

    nodes.forEach((node) => {
      if (!nodeCenters[node.id]) return;
      (node.next || []).forEach((nextId) => {
        if (!nodeCenters[nextId]) return;
        const start = nodeCenters[node.id];
        const end   = nodeCenters[nextId];
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        const curve = 18;
        const cx = mx + (Math.random() > 0.5 ? curve : -curve);
        const cy = my;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
        const isVisited = visitedIds.has(node.id);
        path.setAttribute("stroke", isVisited ? "#1e2840" : "#3a4a7a");
        path.setAttribute("stroke-width", isVisited ? "1.5" : "2");
        path.setAttribute("stroke-dasharray", isVisited ? "6 4" : "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("fill", "none");
        if (!isVisited) {
          path.setAttribute("filter", "url(#path-glow)");
        }
        svg.appendChild(path);
      });
    });

    // Add glow filter for available paths
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.insertBefore(defs, svg.firstChild);
  }

  async function enterNode(node) {
    flashTransition(node.type === "boss" ? "flash-slow" : "flash");
    const result = await api("/run/enter-node.json", { run: currentRun, nodeId: node.id });
    currentRun = result.run;

    if (node.type === "rest") {
      currentRun.event = await fetchJson(
        `/play/event.json?nodeType=rest&row=${node.row || 0}&col=${node.col || 0}`
      );
    }
    if (node.type === "shop") {
      currentRun.shop = await api("/play/shop.json", { run: currentRun });
    }

    saveRun(currentRun);
    render();
  }

  // ─── Badge tracking for animations ───────────────────────────────
  let prevBadgeValues = {};

  function renderBadgesAnimated(badgesId, stats) {
    const el = $id(badgesId);
    if (!el) return;
    clearEl(el);
    stats.forEach(({ label, cls, value, key }) => {
      const trackKey = `${badgesId}.${key || cls}`;
      const prev = prevBadgeValues[trackKey] || 0;

      // Status expired — show a brief fading ghost badge
      if (!value && prev > 0) {
        const ghost = document.createElement("div");
        ghost.className = `badge ${cls} badge-expiring`;
        ghost.textContent = `${label} ${prev}`;
        el.appendChild(ghost);
        ghost.addEventListener("animationend", () => ghost.remove(), { once: true });
        prevBadgeValues[trackKey] = 0;
        return;
      }

      if (!value) return;

      const badge = document.createElement("div");
      badge.className = `badge ${cls}`;
      badge.textContent = `${label} ${value}`;

      if (value > prev) {
        setTimeout(() => {
          badge.classList.add("badge-pop");
          badge.addEventListener("animationend", () => badge.classList.remove("badge-pop"), { once: true });
        }, 10);
      } else if (value < prev) {
        setTimeout(() => {
          badge.classList.add("badge-decay");
          badge.addEventListener("animationend", () => badge.classList.remove("badge-decay"), { once: true });
        }, 10);
      }

      prevBadgeValues[trackKey] = value;
      const tipText = STATUS_TIPS[key || cls];
      if (tipText) {
        const tipEl = document.createElement("div");
        tipEl.className = "status-tooltip";
        tipEl.textContent = tipText;
        badge.appendChild(tipEl);
      }
      el.appendChild(badge);
    });
  }

  // ─── Pile Modal ───────────────────────────────────────────────────
  function hidePileModal() {
    $id("pile-modal")?.classList.add("hidden");
  }

  function showPileModal(title, cards) {
    let modal = $id("pile-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "pile-modal";
      modal.className = "pile-modal";
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => { if (e.target === modal) hidePileModal(); });
    }
    modal.classList.remove("hidden");
    clearEl(modal);

    const box = document.createElement("div");
    box.className = "pile-modal-box";

    const hdr = document.createElement("div");
    hdr.className = "pile-modal-header";
    const titleWrap = document.createElement("div");
    const titleEl = document.createElement("span");
    titleEl.textContent = `${title} (${cards.length})`;
    const subtitleEl = document.createElement("div");
    subtitleEl.className = "pile-modal-subtitle";
    subtitleEl.textContent = cards.length === 0
      ? "No cards are in this pile right now."
      : "Click outside the panel or press Escape to return to combat.";
    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(subtitleEl);
    const closeBtn = document.createElement("button");
    closeBtn.className = "pile-modal-close";
    closeBtn.type = "button";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", hidePileModal);
    hdr.appendChild(titleWrap);
    hdr.appendChild(closeBtn);

    const grid = document.createElement("div");
    grid.className = "pile-modal-grid";
    if (cards.length === 0) {
      const empty = document.createElement("div");
      empty.className = "pile-modal-empty";
      empty.textContent = "Empty";
      grid.appendChild(empty);
    } else {
      cards.forEach((card) => grid.appendChild(makeCard(card, { dealDelay: -1 })));
    }

    box.appendChild(hdr);
    box.appendChild(grid);
    modal.appendChild(box);
    closeBtn.focus();
  }

  // ─── Powers Strip ─────────────────────────────────────────────────
  function renderPowersStrip(powers) {
    const strip = $id("powers-strip");
    if (!strip) return;
    clearEl(strip);
    if (!powers || powers.length === 0) {
      strip.style.display = "none";
      return;
    }
    strip.style.display = "flex";
    powers.forEach((power) => {
      const chip = document.createElement("div");
      chip.className = "power-chip";
      chip.title = power.effectText || power.name || power.id;

      const iconEl = document.createElement("span");
      iconEl.className = "power-chip-icon";
      iconEl.textContent = getPowerIcon(power.id);

      const nameEl = document.createElement("span");
      nameEl.className = "power-chip-name";
      nameEl.textContent = power.name || power.id;

      chip.appendChild(iconEl);
      chip.appendChild(nameEl);
      chip.addEventListener("mouseenter", () => showCardPreview(power, chip));
      chip.addEventListener("mouseleave", hideCardPreview);
      strip.appendChild(chip);
    });
  }

  function getPowerIcon(id) {
    const icons = {
      iron_will: "🛡️", burning_aura: "🔥", hex_resonance: "☠️",
      storm_call: "⛈️", exhaust_engine: "⚙️", weak_field: "😵",
      dark_pact: "🩸", vampiric_aura: "🧛"
    };
    return icons[id] || "✨";
  }

  // ─── Screen: Combat ───────────────────────────────────────────────
  function setActiveHandCard(handArea, activeEl = null) {
    if (!handArea) return;
    Array.from(handArea.querySelectorAll(".card-component")).forEach((el) => {
      el.classList.toggle("is-active", el === activeEl);
    });
  }

  function renderCombat() {
    if (!currentRun?.combat) return;
    const enteringCombat = lastScreen !== "combat";
    if (enteringCombat) flashTransition("flash-slow");
    lastScreen = "combat";
    showOnly("screen-combat");
    $id("screen-combat")?.classList.toggle("act-2", (currentRun.act || 1) >= 2);

    const { combat } = currentRun;
    const maxHp = currentRun.player.maxHealth || 80;
    const enemyMaxHp = combat.enemy.maxHp || combat.enemy.health;
    const isCombatResolved = combat.state === "victory" || combat.state === "defeat";

    // Topbar
    const nodeType = combat.nodeType || "combat";
    $id("combat-floor-label").textContent = nodeType.toUpperCase();
    const turnEl = $id("combat-turn-label");
    if (turnEl) turnEl.textContent = combat.turn ?? 1;
    const turnLabelEl = $id("turn-label");
    if (turnLabelEl) turnLabelEl.textContent = isCombatResolved ? "Result" : `Turn ${combat.turn ?? 1}`;
    const turnIconEl = $id("turn-icon");
    if (turnIconEl) {
      turnIconEl.textContent = combat.state === "victory" ? "🏆" : combat.state === "defeat" ? "💀" : "⚔️";
    }
    if (combat.state === "victory") {
      setCombatStateMessage("Victory secured · claim your spoils", "victory");
    } else if (combat.state === "defeat") {
      setCombatStateMessage("Defeat · the run is over", "defeat");
    } else if (combat.turn === "player" && selectedHandCardIndex !== null && combat.hand?.[selectedHandCardIndex]) {
      const selectedCard = combat.hand[selectedHandCardIndex];
      const mode = selectedCard?.type === "attack" ? "click the enemy to confirm" : "click again or drag upward to play";
      setCombatStateMessage(`Card ready · ${mode}`, "player");
    } else {
      setCombatStateMessage("Your turn · play cards or end turn", "player");
    }
    renderRelicStrip("combat-relic-strip", currentRun.relics || []);
    // Only re-render background and start particles when entering combat
    if (enteringCombat) {
      renderCombatBg(nodeType);
      startAmbientParticles(nodeType);
      // Position player character on AnimEngine canvas after layout settles
      requestAnimationFrame(() => {
        const pp = getPlayerAnimPos();
        const ep = getEnemyAnimPos();
        if (pp && window.AnimEngine) {
          window.AnimEngine.setPlayer(pp.x, pp.y, currentRun.archetypeId || "static_duelist");
          window.AnimEngine.onPlayerTurnStart(pp.x, pp.y);
        }
        if (ep && window.AnimEngine) window.AnimEngine.setEnemyPos(ep.x, ep.y);
        syncAnimBattleState();
      });
    }

    // Player panel
    $id("player-hp-current").textContent = combat.player.health;
    $id("player-hp-max").textContent = maxHp;
    updateHPBar("player-hp-bar", combat.player.health, maxHp);
    renderEnergyPips(combat.player.energy, 3 + ((currentRun.relics || []).some((r) => r.id === "ember_ring") ? 1 : 0));
    renderBadgesAnimated("player-badges", [
      { label: "🛡️", cls: "block",     value: combat.player.block || 0,         key: "block" },
      { label: "⚡",  cls: "charged",   value: combat.player.charged ? 1 : 0,    key: "charged" },
      { label: "💪",  cls: "strength",  value: combat.player.strength || 0,      key: "strength" },
      { label: "🦶",  cls: "dexterity", value: combat.player.dexterity || 0,     key: "dexterity" },
      { label: "😵",  cls: "weak",      value: combat.player.weak || 0,          key: "weak" }
    ]);

    // Enemy panel
    $id("enemy-name").textContent = combat.enemy.name || "Enemy";
    $id("enemy-hp-current").textContent = Math.max(0, combat.enemy.health);
    $id("enemy-hp-max").textContent = enemyMaxHp;
    updateHPBar("enemy-hp-bar", combat.enemy.health, enemyMaxHp);
    renderBadgesAnimated("enemy-badges", [
      { label: "🛡️", cls: "block",      value: combat.enemy.block || 0,      key: "block" },
      { label: "☠️",  cls: "hex",        value: combat.enemy.hex || 0,        key: "hex" },
      { label: "🎯",  cls: "vulnerable", value: combat.enemy.vulnerable || 0, key: "vulnerable" },
      { label: "😵",  cls: "weak",       value: combat.enemy.weak || 0,       key: "weak" }
    ]);

    // Enemy avatar art
    const enemyCanvas = $id("enemy-canvas");
    if (enemyCanvas) {
      drawEnemyArt(enemyCanvas, combat.enemy);
      startEnemyIdle();
    }

    // Intent with icon system
    renderIntent(combat.enemyIntent);

    const enemyPanel = $id("enemy-panel");
    const selectedCard = getSelectedCombatCard();
    renderCardSelectionPreview(selectedCard, combat);
    const enemyTargetingActive = combat.turn === "player" && selectedCard?.type === "attack" && combat.state === "active";
    if (enemyPanel) {
      enemyPanel.classList.toggle("targetable", enemyTargetingActive);
      enemyPanel.classList.toggle("target-selected", enemyTargetingActive);
      enemyPanel.onclick = enemyTargetingActive
        ? () => {
            const targetIndex = selectedHandCardIndex;
            const targetCardEl = $id("hand-area")?.querySelectorAll(".card-component")?.[targetIndex];
            playCard(targetIndex, targetCardEl || null);
          }
        : null;
    }

    // Pile counters (clickable to view contents)
    const pileSetup = (buttonId, countId, pile, label) => {
      const countEl = $id(countId);
      if (!countEl) return;
      countEl.textContent = pile.length;
      const buttonEl = $id(buttonId);
      if (!buttonEl) return;
      buttonEl.title = `Open ${label}`;
      buttonEl.setAttribute("aria-label", `Open ${label}, ${pile.length} cards`);
      buttonEl.onclick = () => showPileModal(label, pile);
    };
    pileSetup("draw-pile-btn", "draw-count", combat.drawPile || [], "Draw Pile");
    pileSetup("discard-pile-btn", "discard-count", combat.discardPile || [], "Discard Pile");
    pileSetup("exhaust-pile-btn", "exhaust-count", combat.exhaustPile || [], "Exhaust Pile");

    // Potion slots
    renderPotionStrip(currentRun.potions || []);

    // Powers strip
    renderPowersStrip(combat.powers || []);

    // Curse count on deck button
    const curseCount = (currentRun.player.deck || []).filter((id) => {
      const catalogCard = cardCatalog && cardCatalog[id];
      return catalogCard ? catalogCard.type === "curse" : ["wound", "decay", "parasite"].includes(id);
    }).length;
    const deckBtn = $id("combat-deck-btn");
    if (deckBtn) {
      const existingBadge = deckBtn.querySelector(".curse-count");
      if (existingBadge) existingBadge.remove();
      if (curseCount > 0) {
        const badge = document.createElement("span");
        badge.className = "curse-count";
        badge.textContent = `☠ ${curseCount}`;
        deckBtn.appendChild(badge);
      }
    }

    // Hand with arc layout
    const handArea = $id("hand-area");
    if (handArea) {
      clearEl(handArea);
      (combat.hand || []).forEach((card, idx) => {
        const canAfford = combat.player.energy >= (card.cost || 0);
        const cardEl = makeCard(card, {
          unplayable: !canAfford,
          dealDelay: -1
        });
        cardEl.addEventListener("mouseenter", () => setActiveHandCard(handArea, cardEl));
        cardEl.addEventListener("focus", () => setActiveHandCard(handArea, cardEl));
        cardEl.addEventListener("mouseleave", () => setActiveHandCard(handArea));
        cardEl.addEventListener("blur", () => setActiveHandCard(handArea));
        if (selectedHandCardIndex === idx) {
          cardEl.classList.add("is-selected");
          setActiveHandCard(handArea, cardEl);
        }
        bindHandCardInteraction({ handArea, cardEl, card, idx, canAfford });
        handArea.appendChild(cardEl);
      });
      // Apply arc after layout
      requestAnimationFrame(() => applyHandArc(handArea));
    }

    // End turn button state
    const endBtn = $id("end-turn-btn");
    if (enemyPanel && enemyTargetingActive) {
      enemyPanel.setAttribute("aria-label", `Target ${combat.enemy.name || "enemy"}`);
    }

    if (endBtn) {
      endBtn.disabled = isCombatResolved;
      if (isCombatResolved || combat.turn !== "player") {
        clearSelectedHandCard();
      }
      endBtn.textContent = combat.state === "victory"
        ? "Victory"
        : combat.state === "defeat"
          ? "Defeat"
          : "End Turn";
      endBtn.setAttribute("aria-label", endBtn.textContent);
    }
  }

  async function playCard(handIndex, cardEl) {
    if (isCardPlaying) return;
    clearSelectedHandCard();
    isCardPlaying = true;
    try {
    const card = currentRun.combat?.hand?.[handIndex];
    const isAttack = card?.type === "attack";

    // Directional fly animation
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      const fly = cardEl.cloneNode(true);
      if (isAttack) {
        fly.className = "card-flying-attack";
        const enemyPanel = $id("enemy-panel");
        if (enemyPanel) {
          const er = enemyPanel.getBoundingClientRect();
          const tx = (er.left + er.width / 2) - (rect.left + rect.width / 2);
          const ty = (er.top + er.height / 2) - (rect.top + rect.height / 2);
          fly.style.setProperty("--tx", `${tx}px`);
          fly.style.setProperty("--ty", `${ty}px`);
        }
      } else {
        fly.className = "card-flying-skill";
      }
      fly.style.left = `${rect.left}px`;
      fly.style.top  = `${rect.top}px`;
      fly.style.width  = `${rect.width}px`;
      fly.style.height = `${rect.height}px`;
      document.body.appendChild(fly);
      fly.addEventListener("animationend", () => fly.remove());
    }

    // AnimEngine: trail + player animation
    if (window.AnimEngine && card) {
      const pp = getPlayerAnimPos();
      const ep = getEnemyAnimPos();
      if (pp && ep) {
        window.AnimEngine.onCardPlay(card.type || "skill", pp.x, pp.y, ep.x, ep.y);
      }
    }

    const prevEnemyHp    = currentRun.combat?.enemy?.health    || 0;
    const prevEnemyBlock = currentRun.combat?.enemy?.block     || 0;
    const prevVuln       = currentRun.combat?.enemy?.vulnerable || 0;
    const prevWeak       = currentRun.combat?.enemy?.weak       || 0;
    const prevHex        = currentRun.combat?.enemy?.hex        || 0;
    const prevCharged    = !!currentRun.combat?.player?.charged;
    const prevHand = currentRun.combat?.hand || [];
    const updated = await api("/run/play-card.json", { run: currentRun, handIndex });
    currentRun = updated;
    flashTriggeredRelics(updated.combat?.triggeredRelics);

    if (updated.combat) {
      const dmg = prevEnemyHp - (updated.combat.enemy?.health ?? prevEnemyHp);
      const blockGained = (updated.combat.enemy?.block || 0) - prevEnemyBlock;
      if (dmg > 0 || blockGained > 0) {
        const ep = getEnemyAnimPos();
        if (ep && window.AnimEngine) {
          window.AnimEngine.onEnemyHit(ep.x, ep.y, dmg > 0 ? dmg : blockGained, dmg === 0 && blockGained > 0);
        } else {
          // DOM fallback
          if (dmg > 0) floatNum($id("enemy-panel"), dmg, dmg >= 8 ? "damage big" : "damage");
          if (blockGained > 0) floatText($id("enemy-panel"), `+${blockGained} Block`, "block-gain");
        }
        if (dmg > 0) {
          flashEnemyHit();
          const enemyCanvas = $id("enemy-canvas");
          if (enemyCanvas) {
            enemyCanvas.classList.add("shake");
            enemyCanvas.addEventListener("animationend", () => enemyCanvas.classList.remove("shake"), { once: true });
          }
        }
      }
      // Status application — show floating word + puff
      if (window.AnimEngine) {
        const ep = getEnemyAnimPos();
        const pp = getPlayerAnimPos();
        if (ep) {
          if ((updated.combat.enemy?.vulnerable || 0) > prevVuln) window.AnimEngine.onStatusApplied(ep.x, ep.y, "vulnerable");
          if ((updated.combat.enemy?.weak       || 0) > prevWeak)  window.AnimEngine.onStatusApplied(ep.x, ep.y, "weak");
          if ((updated.combat.enemy?.hex        || 0) > prevHex)   window.AnimEngine.onStatusApplied(ep.x, ep.y, "hex");
        }
        if (pp && !prevCharged && !!updated.combat.player?.charged) {
          window.AnimEngine.onStatusApplied(pp.x, pp.y - 30, "charged");
        }
      }
      checkBossPhaseWarning(updated.combat);
      checkCurseDrawn(prevHand, updated.combat?.hand);
      syncAnimBattleState();
      // Phase 2 transition visual
      if (updated.combat.phaseTransition) {
        showKillTextOverlay("⚡ PHASE 2", "#cc44cc");
        screenShake();
        await new Promise((r) => setTimeout(r, 700));
        // Clear the flag so it doesn't re-trigger on next render
        currentRun = { ...currentRun, combat: { ...currentRun.combat, phaseTransition: false } };
      }
    }

    if (updated.combat?.state === "victory") {
      // Victory fanfare before transitioning
      const nodeType = updated.combat.nodeType || "combat";
      showKillFlash();
      screenShake();
      spawnKillConfetti($id("enemy-panel"), nodeType === "boss" ? 55 : nodeType === "elite" ? 35 : 20);
      if (nodeType === "boss") {
        showKillTextOverlay("BOSS DEFEATED", "#f0c040");
        spawnConfetti();
      } else if (nodeType === "elite") {
        showKillTextOverlay("ELITE DEFEATED", "#e07830");
      }
      stopEnemyIdle();
      stopAmbientParticles();
      const epVic = getEnemyAnimPos();
      if (epVic && window.AnimEngine) window.AnimEngine.onVictory(epVic.x, epVic.y);
      // Brief pause for fanfare before reward
      await new Promise((r) => setTimeout(r, nodeType === "boss" ? 900 : 500));
      currentRun = await api("/run/apply-victory.json", { run: currentRun, combat: updated.combat });
    }

    saveRun(currentRun);
    render();
    } finally {
      if (!currentRun?.combat || currentRun.combat.turn !== "player") {
        clearSelectedHandCard();
      }
      isCardPlaying = false;
    }
  }

  // ─── Screen: Reward ───────────────────────────────────────────────
  function renderReward() {
    if (!currentRun?.pendingRewards) return;
    const enteringReward = lastScreen !== "reward";
    showOnly("screen-reward");
    lastScreen = "reward";

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
      if (enteringReward) {
        setTimeout(() => spawnConfetti(), 150);
        // Float gold earned
        if ((rewards.gold || 0) > 0) {
          const anchor = $id("reward-header") || document.body;
          const div = document.createElement("div");
          div.className = "float-dmg gold-gain";
          div.textContent = `+${rewards.gold}g`;
          const rect = anchor.getBoundingClientRect();
          div.style.left = `${rect.left + rect.width / 2 - 20}px`;
          div.style.top = `${rect.top + 10}px`;
          document.body.appendChild(div);
          div.addEventListener("animationend", () => div.remove());
        }
      }
      const isElite = rewards.relics?.length > 0;
      const isBoss = !!rewards.relic;
      $id("reward-header").textContent = isBoss ? "BOSS VICTORY" : isElite ? "ELITE VICTORY" : "COMBAT VICTORY";
      const potionNotice = rewards.potion ? ` · ${POTION_ICONS[rewards.potion.id] || "🫧"} ${rewards.potion.name} added` : "";
      $id("reward-subtitle").textContent = `Choose a card to add to your deck${potionNotice}`;

      const cardRow = $id("reward-cards-row");
      if (cardRow) {
        clearEl(cardRow);
        rewards.cards.forEach((card, i) => {
          const el = makeCard(card, {
            large: true,
            dealDelay: i * 80,
            onClick: async () => {
              el.classList.add("card-picked");
              await new Promise((r) => setTimeout(r, 260));
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
    const titleEl = $id("event-title");
    const textEl  = $id("event-text");
    if (titleEl) { titleEl.style.animation = "none"; titleEl.textContent = evt.title || "Event"; requestAnimationFrame(() => { titleEl.style.animation = ""; }); }
    if (textEl)  { textEl.style.animation  = "none"; textEl.textContent  = evt.description || ""; requestAnimationFrame(() => { textEl.style.animation  = ""; }); }

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

      const iconEl = document.createElement("span");
      iconEl.className = "event-choice-icon";
      iconEl.textContent = getOptionIcon(option);
      btn.appendChild(iconEl);
      btn.appendChild(document.createTextNode(option.label));

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

    // Campfire flame element
    let flames = $id("campfire-flames");
    if (!flames) {
      flames = document.createElement("div");
      flames.id = "campfire-flames";
      const restTitle = $id("rest-title");
      if (restTitle) restTitle.insertAdjacentElement("afterend", flames);
    }
    clearEl(flames);
    // Spawn 5 flame tongues with varied sizes and timings
    [
      { w: 10, h: 28, dur: "0.9s" },
      { w: 14, h: 40, dur: "1.1s" },
      { w: 18, h: 50, dur: "0.8s" },
      { w: 14, h: 38, dur: "1.2s" },
      { w: 10, h: 26, dur: "1.0s" }
    ].forEach(({ w, h, dur }) => {
      const f = document.createElement("div");
      f.className = "flame";
      f.style.cssText = `width:${w}px;height:${h}px;--dur:${dur}`;
      flames.appendChild(f);
    });

    const optionsRow = $id("rest-options-row");
    if (!optionsRow) return;
    clearEl(optionsRow);

    (currentRun.event.options || []).forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "rest-option-btn";

      const iconEl = document.createElement("div");
      iconEl.className = "rest-option-icon";
      iconEl.textContent = getOptionIcon(option);

      const nameEl = document.createElement("div");
      nameEl.className = "rest-option-name";
      const EFFECT_LABELS = { heal: "Rest & Heal", smith: "Upgrade a Card", remove: "Remove a Card" };
      nameEl.textContent = option.label || EFFECT_LABELS[option.effect] || option.effect || option.id || "Option";

      btn.appendChild(iconEl);
      btn.appendChild(nameEl);
      if (option.description) {
        const descEl = document.createElement("div");
        descEl.className = "rest-option-desc";
        descEl.textContent = option.description;
        btn.appendChild(descEl);
      }

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
      const upgradedCard = upgradeable ? (cardCatalog || {})[cardId + "_plus"] : null;

      const wrap = document.createElement("div");
      wrap.className = "smith-card-wrap";

      if (upgradeable && upgradedCard) {
        const previewRow = document.createElement("div");
        previewRow.className = "smith-preview-row";
        previewRow.appendChild(makeCard(card, { dealDelay: -1 }));
        const arrow = document.createElement("div");
        arrow.className = "smith-arrow";
        arrow.textContent = "→";
        previewRow.appendChild(arrow);
        const upgradeEl = makeCard(upgradedCard, { dealDelay: -1 });
        upgradeEl.classList.add("smith-upgraded");
        previewRow.appendChild(upgradeEl);
        wrap.appendChild(previewRow);
      } else {
        wrap.appendChild(makeCard(card, { unplayable: !upgradeable, dealDelay: -1 }));
      }

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
      wrap.appendChild(upgradeBtn);
      cardsEl.appendChild(wrap);
    });

  }

  // ─── Screen: Shop ─────────────────────────────────────────────────
  function renderShop() {
    if (!currentRun?.shop) return;
    showOnly("screen-shop");

    const shop = currentRun.shop;
    const newShopGold = currentRun.player.gold;
    $id("shop-gold").textContent = newShopGold;
    const goldDisplay = $id("shop-gold-display");
    if (goldDisplay && prevShopGold >= 0 && newShopGold !== prevShopGold) {
      goldDisplay.classList.remove("gold-flash");
      requestAnimationFrame(() => {
        goldDisplay.classList.add("gold-flash");
        goldDisplay.addEventListener("animationend", () => goldDisplay.classList.remove("gold-flash"), { once: true });
      });
    }
    prevShopGold = newShopGold;

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
        const canAfford = currentRun.player.gold >= svc.price;
        btn.className = "shop-service-btn";
        if (!canAfford) btn.disabled = true;

        const nameEl = document.createElement("div");
        nameEl.className = "shop-service-name";
        nameEl.textContent = svc.label;
        btn.appendChild(nameEl);

        if (svc.description) {
          const descEl = document.createElement("div");
          descEl.className = "shop-service-desc";
          descEl.textContent = svc.description;
          btn.appendChild(descEl);
        }

        const costEl = document.createElement("div");
        costEl.className = "shop-service-cost";
        costEl.textContent = `${svc.price}g`;
        btn.appendChild(costEl);

        btn.addEventListener("click", async () => {
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
    lastScreen = "end";
    const win = currentRun.state === "won";
    const screen = $id("screen-end");
    showOnly("screen-end");
    if (screen) {
      screen.classList.remove("win", "loss");
      screen.classList.add(win ? "win" : "loss");
    }
    $id("end-icon").textContent = win ? "🏆" : "💀";
    $id("end-title").textContent = win ? "VICTORY" : "DEFEAT";

    const currentNode = currentRun.map?.nodes?.find((n) => n.id === currentRun.map.currentNodeId);
    const floorReached = currentNode ? currentNode.row + 1 : "?";
    const score = calcRunScore(currentRun);
    const grade = calcRunGrade(score);

    // Score display (inject before end-stats if not present)
    let scoreEl = $id("end-score");
    let flavorEl = $id("end-run-flavor");
    if (!scoreEl && screen) {
      scoreEl = document.createElement("div");
      scoreEl.id = "end-score";
      flavorEl = document.createElement("div");
      flavorEl.id = "end-run-flavor";
      const statsEl = $id("end-stats");
      if (statsEl) { screen.insertBefore(flavorEl, statsEl); screen.insertBefore(scoreEl, flavorEl); }
    }
    if (scoreEl) scoreEl.innerHTML = `${score.toLocaleString()} <span class="run-grade grade-${grade}">${grade}</span>`;

    const arch = ARCHETYPES.find((a) => a.id === currentRun.archetype);
    if (flavorEl) {
      const flavors = win
        ? [`${arch?.icon || ""} ${arch?.name || "Unknown"} run complete`, "The spire falls silent", "Power unleashed"]
        : [`${arch?.icon || ""} ${arch?.name || "Unknown"} run ended`, "The dungeon claims another", "Try a different approach"];
      flavorEl.textContent = flavors[Math.floor(Math.random() * flavors.length)];
    }

    const stats = $id("end-stats");
    if (stats) {
      const relicCount = (currentRun.relics || []).length;
      const deckSize = (currentRun.player?.deck || []).length;
      const s = currentRun.stats || {};
      const mostPlayedName = s.mostPlayedCardId
        ? (cardCatalog?.[s.mostPlayedCardId]?.name || s.mostPlayedCardId)
        : "—";
      stats.innerHTML = [
        `Floor reached: <strong>${floorReached}</strong>`,
        `Act: <strong>${currentRun.act || 1}</strong>`,
        `Gold: <strong>${currentRun.player?.gold || 0}</strong>`,
        `Deck size: <strong>${deckSize}</strong>`,
        `Relics: <strong>${relicCount}</strong>`,
        `<hr style="border-color:#444;margin:6px 0">`,
        `Enemies killed: <strong>${s.enemiesKilled || 0}</strong>`,
        `Damage dealt: <strong>${s.damageDealt || 0}</strong>`,
        `Highest hit: <strong>${s.highestSingleHit || 0}</strong>`,
        `Damage taken: <strong>${s.damageTaken || 0}</strong>`,
        `Cards played: <strong>${s.cardsPlayed || 0}</strong>`,
        `Turns played: <strong>${s.turnsPlayed || 0}</strong>`,
        `Gold earned: <strong>${s.goldEarned || 0}</strong>`,
        `Most played: <strong>${mostPlayedName}</strong>`
      ].join("<br />");
    }

    // Save run to history (last 5)
    const runEntry = {
      state: currentRun.state,
      act: currentRun.act || 1,
      archetype: currentRun.archetype,
      archetypeName: currentRun.archetypeName,
      floorReached,
      score
    };
    const history = JSON.parse(localStorage.getItem("drawforge.runHistory") || "[]");
    history.unshift(runEntry);
    history.splice(5);
    localStorage.setItem("drawforge.runHistory", JSON.stringify(history));
    localStorage.setItem("drawforge.lastRun", JSON.stringify(runEntry));

    if (win) {
      setTimeout(spawnConfetti, 200);
    } else {
      setTimeout(spawnDeathSparks, 100);
    }
  }

  // ─── Main Render Dispatch ─────────────────────────────────────────
  let prevAct = 1;

  function render() {
    if (!currentRun) return renderStart();
    if (currentRun.state === "won" || currentRun.state === "lost") return renderEndState();
    if (currentRun.pendingDeckChoice) return renderDeckChoice();

    // Act transition banner
    const curAct = currentRun.act || 1;
    if (curAct > prevAct && !currentRun.combat && !currentRun.pendingRewards) {
      prevAct = curAct;
      showActTransition(curAct).then(() => renderMap());
      return;
    }
    prevAct = curAct;

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
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Enemy Turn...";
        btn.setAttribute("aria-label", "Enemy Turn...");
      }
      const enemyIntentLabel = currentRun.combat.enemyIntent?.label || "Enemy action";
      const turnIconEl = $id("turn-icon");
      const turnLabelEl = $id("turn-label");
      if (turnIconEl) turnIconEl.textContent = "☄️";
      if (turnLabelEl) turnLabelEl.textContent = "Enemy Turn";
      setCombatStateMessage(`Enemy turn · ${enemyIntentLabel}`, "enemy");
      showTurnBanner("ENEMY TURN", true);

      const prevPlayerHp = currentRun.combat.player.health;
      const prevPlayerBlock = currentRun.combat.player.block || 0;
      const prevHandEndTurn = currentRun.combat?.hand || [];
      currentRun = await api("/run/end-turn.json", { run: currentRun });
      flashTriggeredRelics(currentRun.combat?.triggeredRelics);

      // Animate enemy lunge + player recoil if enemy attacked
      const newPlayerHp = currentRun.combat?.player?.health ?? currentRun.player?.health ?? prevPlayerHp;
      const dmgTaken = prevPlayerHp - newPlayerHp;
      if (dmgTaken > 0) {
        const pp = getPlayerAnimPos();
        if (pp && window.AnimEngine) {
          window.AnimEngine.onPlayerHit(pp.x, pp.y, dmgTaken);
        } else {
          floatNum($id("player-panel"), dmgTaken, dmgTaken >= 8 ? "damage big" : "damage");
        }
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
        // Block shatter notification
        const newBlock = currentRun.combat?.player?.block ?? 0;
        if (prevPlayerBlock > 0 && newBlock === 0) {
          const ppPos = getPlayerAnimPos();
          if (ppPos && window.AnimEngine) {
            window.AnimEngine.onBlockShatter(ppPos.x, ppPos.y);
          } else {
            const ppEl = $id("player-panel");
            if (ppEl) {
              const rect = ppEl.getBoundingClientRect();
              const bt = document.createElement("div");
              bt.className = "block-broken-text";
              bt.textContent = "BLOCK BROKEN";
              bt.style.left = `${rect.left + rect.width / 2 - 60}px`;
              bt.style.top  = `${rect.top + 20}px`;
              document.body.appendChild(bt);
              bt.addEventListener("animationend", () => bt.remove());
            }
          }
        }
      }

      checkCurseDrawn(prevHandEndTurn, currentRun.combat?.hand);

      if (currentRun.state === "lost") {
        stopEnemyIdle();
        stopAmbientParticles();
        window.AnimEngine?.onDefeat();
        flashTransition("flash-red");
        saveRun(currentRun);
        render();
        return;
      }

      syncAnimBattleState();
      showTurnBanner("YOUR TURN", false);
      const ppTurn = getPlayerAnimPos();
      if (ppTurn && window.AnimEngine) window.AnimEngine.onPlayerTurnStart(ppTurn.x, ppTurn.y);
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

  // ─── Keyboard Shortcuts ───────────────────────────────────────────
  function initKeyboard() {
    document.addEventListener("keydown", (e) => {
      // Escape closes overlays
      if (e.key === "Escape") {
        hide("deck-overlay");
        hidePileModal();
        return;
      }

      // Reward: Enter skips
      if (e.key === "Enter") {
        const skipBtn = $id("reward-skip-btn");
        if (skipBtn && !skipBtn.closest(".hidden") && skipBtn.style.display !== "none") {
          skipBtn.click();
          return;
        }
      }

      // Combat-only shortcuts
      if (!currentRun?.combat) return;
      const deckOpen = !$id("deck-overlay")?.classList.contains("hidden");
      if (deckOpen) return;

      // E or Space = End Turn
      if (e.key === "e" || e.key === "E" || e.key === " ") {
        e.preventDefault();
        const btn = $id("end-turn-btn");
        if (btn && !btn.disabled) btn.click();
        return;
      }

      // Q = use first potion
      if (e.key === "q" || e.key === "Q") {
        const firstPotionBtn = document.querySelector(".potion-btn");
        if (firstPotionBtn) firstPotionBtn.click();
        return;
      }

      // 1–5 = play hand card by index
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        const handArea = $id("hand-area");
        if (!handArea) return;
        const playable = Array.from(handArea.querySelectorAll(".card-component")).filter(
          (c) => !c.classList.contains("unplayable")
        );
        if (playable[num - 1]) playable[num - 1].click();
      }
    });
  }

  // ─── Boot ─────────────────────────────────────────────────────────
  async function initializeApp() {
    // Boot animation engine
    const animCanvas = document.getElementById("anim-canvas");
    if (animCanvas && window.AnimEngine) {
      window.AnimEngine.init(animCanvas);
    }

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
  initKeyboard();
  initializeApp();
})();
