/* eslint-env browser */
(() => {
  const SAVE_KEY = "drawforge.v1";
  let cardCatalog = null;
  let relicCatalog = null;
  let currentRun = null;

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `Request failed for ${url}`);
    }
    return payload;
  }

  async function loadSharedCatalogs() {
    const [cards, relics] = await Promise.all([
      fetchJson("/cards.json"),
      fetchJson("/relics.json")
    ]);
    cardCatalog = cards;
    relicCatalog = relics;
  }

  function show(...ids) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = false;
    });
  }

  function hide(...ids) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }

  function saveRun(run) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(run));
  }

  function loadRun() {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function clearNode(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function createCardFromId(id) {
    const card = cardCatalog && cardCatalog[id];
    if (!card) throw new Error(`Unknown card id: ${id}`);
    return { ...card };
  }

  function describeCard(card) {
    const parts = [];
    if (card.rarity) parts.push(`[${card.rarity}]`);
    if (card.cost !== undefined) parts.push(`Cost ${card.cost}`);
    if (card.costReduceIfHexed) parts.push(`(costs ${card.costReduceIfHexed} less if Hexed)`);
    if (card.damage) parts.push(`Dmg ${card.damage}`);
    if (card.block) parts.push(`Block ${card.block}`);
    if (card.draw) parts.push(`Draw ${card.draw}`);
    if (card.energyGain) parts.push(`+${card.energyGain} energy`);
    if (card.energyPerExhausted) parts.push(`+1 energy per exhausted`);
    if (card.hex) parts.push(`Hex ${card.hex}`);
    if (card.bonusVsHex) parts.push(`+${card.bonusVsHex} vs Hex`);
    if (card.bonusVsExhaust) parts.push(`+${card.bonusVsExhaust} vs Exhaust`);
    if (card.bonusVsHexedOrExhausted) parts.push(`repeat on Hexed / Exhausted`);
    if (card.bonusBlockIfHighEnergy) parts.push(`+${card.bonusBlockIfHighEnergy} block if 2+ energy`);
    if (card.bonusBlockIfHexed) parts.push(`+${card.bonusBlockIfHexed} block vs Hexed`);
    if (card.setCharged) parts.push(`Become Charged`);
    if (card.drawIfCharged) parts.push(`Draw ${card.drawIfCharged} if Charged`);
    if (card.selfDamage) parts.push(`Lose ${card.selfDamage} HP`);
    if (card.exhaustFromHand) parts.push(`Exhaust a card in hand`);
    if (card.exhaust) parts.push(`Exhaust`);
    if (parts.length <= 2 && card.effectText) parts.push(card.effectText);
    return parts.join(" • ");
  }

  async function createRewardCardOptions(count = 3) {
    return fetchJson(`/play/reward-options.json?count=${count}`);
  }

  async function createEventState(node) {
    return fetchJson(`/play/event.json?nodeType=${encodeURIComponent(node.type)}&row=${node.row || 0}&col=${node.col || 0}`);
  }

  async function createShopState(run) {
    return fetchJson("/play/shop.json", {
      method: "POST",
      body: JSON.stringify({ run })
    });
  }

  function renderStart() {
    show("screen-start");
    hide("screen-map", "screen-combat", "screen-reward", "screen-end", "screen-deck-choice", "screen-shop", "screen-rest", "deck-overlay");
  }

  function renderMap() {
    const mapPanel = document.getElementById("map-actions");
    clearNode(mapPanel);
    if (!currentRun || !currentRun.map) return;
    const currentRow = currentRun.map.currentNodeId
      ? (currentRun.map.nodes.find((n) => n.id === currentRun.map.currentNodeId)?.row ?? -1)
      : -1;
    currentRun.map.nodes
      .filter((n) => n.row === currentRow + 1)
      .forEach((node) => {
        const nodeEl = document.createElement("button");
        nodeEl.className = "node-button";
        nodeEl.textContent = `${node.id.toUpperCase()} • ${node.type.toUpperCase()}`;
        nodeEl.addEventListener("click", async () => {
          currentRun = await fetchJson("/run/enter-node.json", {
            method: "POST",
            body: JSON.stringify({ run: currentRun, nodeId: node.id })
          }).then((result) => result.run);
          if (node.type === "event" || node.type === "rest") currentRun.event = await createEventState(node);
          if (node.type === "shop") currentRun.shop = await createShopState(currentRun);
          saveRun(currentRun);
          render();
        });
        mapPanel.appendChild(nodeEl);
      });
    show("screen-map");
    hide("screen-start", "screen-combat", "screen-reward", "screen-end", "screen-deck-choice", "screen-shop", "screen-rest");
  }

  function renderCombat() {
    const handPanel = document.getElementById("hand-actions");
    clearNode(handPanel);
    if (!currentRun?.combat) return;
    currentRun.combat.hand.forEach((card, idx) => {
      const el = document.createElement("button");
      el.className = "node-button";
      el.innerHTML = `${card.name}<br />${describeCard(card)}`;
      el.onclick = async () => {
        const updated = await fetchJson("/run/play-card.json", {
          method: "POST",
          body: JSON.stringify({ run: currentRun, handIndex: idx })
        });
        currentRun = updated;
        if (updated.combat?.state === "victory") {
          currentRun = await fetchJson("/run/apply-victory.json", {
            method: "POST",
            body: JSON.stringify({ run: currentRun, combat: updated.combat })
          });
        }
        saveRun(currentRun);
        render();
      };
      handPanel.appendChild(el);
    });
    show("screen-combat");
    hide("screen-start", "screen-map", "screen-reward", "screen-end", "screen-deck-choice", "screen-shop", "screen-rest");
  }

  function renderReward() {
    const panel = document.getElementById("reward-actions");
    clearNode(panel);
    if (!currentRun?.pendingRewards) return;
    (currentRun.pendingRewards.cards || []).forEach((card) => {
      const el = document.createElement("button");
      el.className = "node-button";
      el.innerHTML = `${card.name}<br />${describeCard(card)}<br />Add to deck`;
      el.onclick = async () => {
        currentRun = await fetchJson("/run/claim-card.json", {
          method: "POST",
          body: JSON.stringify({ run: currentRun, cardId: card.id })
        });
        saveRun(currentRun);
        render();
      };
      panel.appendChild(el);
    });
    ((currentRun.pendingRewards.relics) || []).forEach((relic) => {
      const el = document.createElement("button");
      el.className = "node-button";
      el.innerHTML = `${relic.name}<br />${relic.description}`;
      el.onclick = async () => {
        currentRun = await fetchJson("/run/claim-choice-relic.json", {
          method: "POST",
          body: JSON.stringify({ run: currentRun, relicId: relic.id })
        });
        saveRun(currentRun);
        render();
      };
      panel.appendChild(el);
    });
    show("screen-reward");
    hide("screen-start", "screen-map", "screen-combat", "screen-end", "screen-deck-choice", "screen-shop", "screen-rest");
  }

  function renderShop() {
    const panel = document.getElementById("shop-actions");
    if (!panel) return;
    clearNode(panel);
    if (!currentRun?.shop) return;
    currentRun.shop.cards.forEach((card) => {
      const el = document.createElement("button");
      el.className = "node-button";
      el.innerHTML = `${card.name}<br />${describeCard(card)}<br />${card.price}g`;
      panel.appendChild(el);
    });
    currentRun.shop.relics.forEach((relic) => {
      const el = document.createElement("button");
      el.className = "node-button";
      el.innerHTML = `${relic.name}<br />${relic.description}<br />${relic.price}g`;
      panel.appendChild(el);
    });
    show("screen-shop");
    hide("screen-start", "screen-map", "screen-combat", "screen-reward", "screen-end", "screen-deck-choice", "screen-rest");
  }

  function renderEvent() {
    const panel = document.getElementById("rest-actions") || document.getElementById("event-actions") || document.getElementById("reward-actions");
    if (!panel || !currentRun?.event) return;
    clearNode(panel);
    currentRun.event.options.forEach((option) => {
      const el = document.createElement("button");
      el.className = "node-button";
      if (option.card) el.innerHTML = `${option.label}<br />${describeCard(option.card)}`;
      else if (option.cards) el.innerHTML = `${option.label}<br />${option.cards.map((c) => c.name).join(", ")}`;
      else el.innerHTML = option.label;
      el.onclick = async () => {
        currentRun = await fetchJson("/run/claim-event-option.json", {
          method: "POST",
          body: JSON.stringify({ run: currentRun, optionId: option.id })
        });
        saveRun(currentRun);
        render();
      };
      panel.appendChild(el);
    });
    if (currentRun.event.kind === "campfire") {
      show("screen-rest");
      hide("screen-start", "screen-map", "screen-combat", "screen-reward", "screen-end", "screen-deck-choice", "screen-shop");
    } else {
      show("screen-reward");
      hide("screen-start", "screen-map", "screen-combat", "screen-end", "screen-deck-choice", "screen-shop", "screen-rest");
    }
  }

  function render() {
    if (!currentRun) return renderStart();
    const raw = document.getElementById("raw-state");
    if (raw) raw.textContent = JSON.stringify(currentRun, null, 2);
    if (currentRun.state === "won" || currentRun.state === "lost") {
      show("screen-end");
      hide("screen-start", "screen-map", "screen-combat", "screen-reward", "screen-deck-choice", "screen-shop", "screen-rest");
      return;
    }
    if (currentRun.pendingRewards) return renderReward();
    if (currentRun.shop) return renderShop();
    if (currentRun.event) return renderEvent();
    if (currentRun.combat) return renderCombat();
    return renderMap();
  }

  document.getElementById("start-new-run-btn")?.addEventListener("click", async () => {
    currentRun = await fetchJson("/run/new.json");
    saveRun(currentRun);
    render();
  });

  document.getElementById("start-load-run-btn")?.addEventListener("click", () => {
    currentRun = loadRun();
    render();
  });

  document.getElementById("end-turn-button")?.addEventListener("click", async () => {
    if (!currentRun?.combat) return;
    currentRun = await fetchJson("/run/end-turn.json", {
      method: "POST",
      body: JSON.stringify({ run: currentRun })
    });
    saveRun(currentRun);
    render();
  });

  async function initializeApp() {
    try {
      await loadSharedCatalogs();
      const saved = loadRun();
      if (saved) {
        currentRun = saved;
        const hasSave = !!localStorage.getItem(SAVE_KEY);
        if (!hasSave) hide("start-load-run-btn");
      }
    } catch (e) {
      hide("start-load-run-btn");
    }
    renderStart();
  }

  initializeApp();
})();
