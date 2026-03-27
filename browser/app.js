/* eslint-env browser */
(() => {
  const STORAGE_KEY = "drawforge.run";

  async function loadBundleMeta() {
    try {
      const response = await fetch('/meta.json', { cache: 'no-store' });
      if (!response.ok) return;
      const meta = await response.json();
      const versionEl = document.getElementById('app-version');
      if (versionEl) {
        versionEl.textContent = `${meta.version} • ${meta.shortSha}`;
        versionEl.title = `app.js sha256 ${meta.appJsSha256}`;
      }
    } catch (error) {
      // Ignore meta fetch errors; the app can still run.
    }
  }
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

  let cardCatalog = null;

  async function loadCardCatalog() {
    cardCatalog = await fetchJson("/cards.json");
  }

  function createEventLabel(option) {
    if (option.effect === "heal") return `Recover ${option.amount} health`;
    if (option.effect === "gold") return `Take ${option.amount} gold`;
    if (option.effect === "remove") return "Enter card removal";
    if (option.effect === "relic") return `Take ${option.relic.name}`;
    if (option.effect === "reward_cards") return "Take a forged card reward";
    if (option.effect === "add_card") return `Add ${option.card.name} to your deck`;
    return option.id;
  }

  function hydrateEventOption(option) {
    const nextOption = { ...option };
    if (nextOption.card && nextOption.card.id) {
      nextOption.card = createCardFromId(nextOption.card.id);
    }
    if (Array.isArray(nextOption.cards)) {
      nextOption.cards = nextOption.cards.map((card) => createCardFromId(card.id));
    }
    nextOption.label = createEventLabel(nextOption);
    return nextOption;
  }

  function createCardFromId(cardId) {
    const card = cardCatalog && cardCatalog[cardId];
    if (!card) {
      throw new Error(`Unknown card id: ${cardId}`);
    }
    return { ...card };
  }

  async function startNewRun() {
    return fetchJson("/run/new.json");
  }

  function validateRun(run) {
    if (!run || typeof run !== "object") throw new Error("Saved run must be an object");
    if (!run.player || !Array.isArray(run.player.deck)) throw new Error("Saved run player deck is invalid");
    if (!run.map || !Array.isArray(run.map.nodes)) throw new Error("Saved run map data is invalid");
    return run;
  }

  function saveRun(run) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  }

  function loadRun() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No saved run found");
    return validateRun(JSON.parse(raw));
  }

  function getStartingNodes(map) {
    return map.nodes.filter((node) => node.row === 0);
  }

  function listAvailableNodes(run) {
    if (run.pendingRewards || run.event || (run.combat && run.combat.state === "active")) return [];
    if (run.map.currentNodeId === null) return getStartingNodes(run.map);
    const currentNode = run.map.nodes.find((node) => node.id === run.map.currentNodeId);
    if (!currentNode) return [];
    return run.map.nodes.filter((node) => currentNode.next.includes(node.id));
  }

  async function enterNode(run, nodeId) {
    const result = await fetchJson("/run/enter-node.json", {
      method: "POST",
      body: JSON.stringify({ run, nodeId })
    });
    const nextRun = result.run;

    if (["combat", "elite", "boss"].includes(result.node.type)) {
      nextRun.event = null;
      return nextRun;
    }

    if (nextRun.event) {
      nextRun.event = {
        ...nextRun.event,
        options: nextRun.event.options.map((option) => hydrateEventOption(option))
      };
    }

    return nextRun;
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
    if (card.energyPerExhausted) parts.push("+1 energy per exhausted this turn");
    if (card.hex) parts.push(`Hex ${card.hex}`);
    if (card.bonusVsHex) parts.push(`+${card.bonusVsHex} vs Hex`);
    if (card.bonusVsExhaust) parts.push(`+${card.bonusVsExhaust} vs Exhaust`);
    if (card.bonusVsHexedOrExhausted) parts.push(`+${card.bonusVsHexedOrExhausted} if Hexed, +${card.bonusVsHexedOrExhausted} if Exhausted this turn`);
    if (card.bonusBlockIfHighEnergy) parts.push(`+${card.bonusBlockIfHighEnergy} block if 2+ energy`);
    if (card.bonusBlockIfHexed) parts.push(`+${card.bonusBlockIfHexed} block vs Hexed`);
    if (card.setCharged) parts.push("Become Charged");
    if (card.drawIfCharged) parts.push(`Draw ${card.drawIfCharged} if Charged`);
    if (card.selfDamage) parts.push(`Lose ${card.selfDamage} HP`);
    if (card.exhaustFromHand) parts.push("Exhaust a random card from hand");
    if (card.exhaust) parts.push("Exhaust");
    return parts.join(" • ");
  }

  function renderCardMarkup(card, actionText = "") {
    const description = describeCard(card);
    return [card.name, description, actionText].filter(Boolean).join("<br />");
  }

  function createCardActionButton(card, actionText, onClick) {
    const button = document.createElement("button");
    button.className = "node-button";
    button.innerHTML = renderCardMarkup(card, actionText);
    button.addEventListener("click", onClick);
    return button;
  }


  async function playCardAction(run, handIndex) {
    return fetchJson("/run/play-card.json", {
      method: "POST",
      body: JSON.stringify({ run, handIndex })
    });
  }

  async function endTurnAction(run) {
    return fetchJson("/run/end-turn.json", {
      method: "POST",
      body: JSON.stringify({ run })
    });
  }

  async function applyVictory(run, combat) {
    return fetchJson("/run/apply-victory.json", {
      method: "POST",
      body: JSON.stringify({ run, combat })
    });
  }

  async function claimCardReward(run, card) {
    return fetchJson("/run/claim-card.json", {
      method: "POST",
      body: JSON.stringify({ run, cardId: card.id })
    });
  }

  async function claimRelicFromChoices(run, relic) {
    return fetchJson("/run/claim-choice-relic.json", {
      method: "POST",
      body: JSON.stringify({ run, relicId: relic.id })
    });
  }

  async function claimRelicReward(run, relic) {
    return fetchJson("/run/claim-relic.json", {
      method: "POST",
      body: JSON.stringify({ run, relicId: relic.id })
    });
  }

  async function skipRewards(run) {
    return fetchJson("/run/skip-rewards.json", {
      method: "POST",
      body: JSON.stringify({ run })
    });
  }

  async function claimEventOption(run, option) {
    return fetchJson("/run/claim-event-option.json", {
      method: "POST",
      body: JSON.stringify({ run, optionId: option.id })
    });
  }

  async function removeCardFromDeck(run, cardId) {
    return fetchJson("/run/remove-card.json", {
      method: "POST",
      body: JSON.stringify({ run, cardId })
    });
  }

  async function finishNode(run) {
    return fetchJson("/run/finish-node.json", {
      method: "POST",
      body: JSON.stringify({ run })
    });
  }

  const elements = {
    status: document.getElementById("status"),
    runState: document.getElementById("run-state"),
    playerHealth: document.getElementById("player-health"),
    playerGold: document.getElementById("player-gold"),
    deckCount: document.getElementById("deck-count"),
    currentNode: document.getElementById("current-node"),
    combatState: document.getElementById("combat-state"),
    relicCount: document.getElementById("relic-count"),
    relicList: document.getElementById("relic-list"),
    deckList: document.getElementById("deck-list"),
    rawState: document.getElementById("raw-state"),
    mapActions: document.getElementById("map-actions"),
    handActions: document.getElementById("hand-actions"),
    rewardActions: document.getElementById("reward-actions"),
    rewardSummary: document.getElementById("reward-summary"),
    removalActions: document.getElementById("removal-actions"),
    combatPlayerHealth: document.getElementById("combat-player-health"),
    combatPlayerBlock: document.getElementById("combat-player-block"),
    combatPlayerEnergy: document.getElementById("combat-player-energy"),
    combatEnemyHealth: document.getElementById("combat-enemy-health"),
    combatEnemyBlock: document.getElementById("combat-enemy-block"),
    combatEnemyHex: document.getElementById("combat-enemy-hex"),
    combatEnemyIntent: document.getElementById("combat-enemy-intent"),
    drawPileCount: document.getElementById("draw-pile-count"),
    discardPileCount: document.getElementById("discard-pile-count"),
    exhaustPileCount: document.getElementById("exhaust-pile-count"),
    combatTurn: document.getElementById("combat-turn"),
    endStateCard: document.getElementById("end-state-card"),
    endStateText: document.getElementById("end-state-text"),
    combatSection: document.querySelector("section.combat"),
    rewardsSection: document.querySelector("section.rewards")
  };

  let currentRun = null;
  let removalModeOpen = false;

  function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.style.color = isError ? "#fca5a5" : "#93c5fd";
  }

  function renderMap() {
    elements.mapActions.innerHTML = "";
    const availableNodes = listAvailableNodes(currentRun);
    if (availableNodes.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = currentRun.pendingRewards || currentRun.event ? "Resolve the current reward/event to continue." : "No available map moves.";
      elements.mapActions.appendChild(empty);
      return;
    }

    availableNodes.forEach((node) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `Node ${node.id}<br />${node.type.toUpperCase()}<br />Row ${node.row}, Col ${node.col}`;
      button.addEventListener("click", async () => {
        try {
          currentRun = await enterNode(currentRun, node.id);
          render();
          setStatus(`Entered ${node.id} (${node.type}).`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      elements.mapActions.appendChild(button);
    });
  }

  function renderCombat() {
    const combat = currentRun.combat;
    elements.handActions.innerHTML = "";
    if (!combat) {
      elements.combatPlayerHealth.textContent = "-";
      elements.combatPlayerBlock.textContent = "-";
      elements.combatPlayerEnergy.textContent = "-";
      elements.combatEnemyHealth.textContent = "-";
      elements.combatEnemyBlock.textContent = "-";
      elements.combatEnemyHex.textContent = "-";
      elements.combatEnemyIntent.textContent = "-";
      elements.drawPileCount.textContent = "-";
      elements.discardPileCount.textContent = "-";
      elements.exhaustPileCount.textContent = "-";
      elements.combatTurn.textContent = "-";
      return;
    }

    elements.combatPlayerHealth.textContent = String(combat.player.health);
    elements.combatPlayerBlock.textContent = String(combat.player.block);
    elements.combatPlayerEnergy.textContent = String(combat.player.energy);
    elements.combatEnemyHealth.textContent = `${combat.enemy.name} (${combat.enemy.health})`;
    elements.combatEnemyBlock.textContent = String(combat.enemy.block || 0);
    elements.combatEnemyHex.textContent = String(combat.enemy.hex || 0);
    elements.combatEnemyIntent.textContent = combat.state === "active"
      ? (combat.enemyIntent ? combat.enemyIntent.label : `Attack for ${combat.enemy.damage}`)
      : combat.state;
    elements.drawPileCount.textContent = String(combat.drawPile.length);
    elements.discardPileCount.textContent = String(combat.discardPile.length);
    elements.exhaustPileCount.textContent = String((combat.exhaustPile || []).length);
    elements.combatTurn.textContent = combat.turn || combat.state;

    combat.hand.forEach((card, index) => {
      const button = createCardActionButton(card, "", async () => {
        try {
          currentRun = await playCardAction(currentRun, index);
          const updatedCombat = currentRun.combat;
          if (updatedCombat.state === "victory") {
            currentRun = await applyVictory(currentRun, updatedCombat);
          }
          render();
          setStatus(updatedCombat.state === "victory"
            ? `Won the ${updatedCombat.enemy.name} fight.`
            : `${card.name} played. Draw: ${updatedCombat.drawPile.length}, discard: ${updatedCombat.discardPile.length}.`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      button.disabled = combat.turn !== "player" || combat.state !== "active";
      elements.handActions.appendChild(button);
    });

    if (combat.state === "active") {
      const debugButton = document.createElement("button");
      debugButton.className = "node-button";
      debugButton.textContent = "[debug] Skip combat";
      debugButton.addEventListener("click", async () => {
        const wonCombat = { ...currentRun.combat, state: "victory", enemy: { ...currentRun.combat.enemy, health: 0 } };
        currentRun = await applyVictory(currentRun, wonCombat);
        render();
        setStatus(`[debug] Skipped combat against ${wonCombat.enemy.name}.`);
      });
      elements.handActions.appendChild(debugButton);
    }
  }

  function renderRewards() {
    elements.rewardActions.innerHTML = "";

    if (currentRun.event) {
      elements.rewardSummary.textContent = `[${currentRun.event.kind}] ${currentRun.event.text}`;
      currentRun.event.options.forEach((option) => {
        const button = document.createElement("button");
        button.className = "node-button";

        if (option.card) {
          button.innerHTML = renderCardMarkup(option.card, option.label);
        }
        else if (option.cards) {
          button.innerHTML = `${option.label}<br />${option.cards
            .map((card) => `${card.name} (${describeCard(card)})`)
            .join('<br />')}`;
        }
        else if (option.relic) {
          button.innerHTML = `${option.label}<br />${option.relic.description}`;
        }
        else {
          button.textContent = option.label;
        }

        button.addEventListener("click", async () => {
          currentRun = await claimEventOption(currentRun, option);
          render();
          setStatus(`Resolved event: ${option.label}.`);
        });
        elements.rewardActions.appendChild(button);
      });
      return;
    }

    if (!currentRun.pendingRewards) {
      elements.rewardSummary.textContent = "No pending rewards.";
      return;
    }

    const { cards, gold, relic, relics = [], removeCard } = currentRun.pendingRewards;
    const inRemovalPhase = removeCard && cards.length === 0 && !relic && relics.length === 0;

    if (inRemovalPhase) {
      elements.rewardSummary.textContent = "Elite bonus: remove a card from your deck below, or skip removal.";
      return;
    }

    // Elite phase 2: pick one of 3 relics after the card reward
    if (relics.length > 0) {
      elements.rewardSummary.textContent = `Elite rewards: +${gold} gold. Choose a relic, then remove a card below.`;
      relics.forEach((r) => {
        const button = document.createElement("button");
        button.className = "node-button";
        button.innerHTML = `${r.name}<br />${r.description}<br />Claim relic`;
        button.addEventListener("click", async () => {
          currentRun = await claimRelicFromChoices(currentRun, r);
          render();
          setStatus(`Claimed relic ${r.name}.`);
        });
        elements.rewardActions.appendChild(button);
      });
      return;
    }

    elements.rewardSummary.textContent = removeCard
      ? `Elite rewards: remove a card from your deck below, or skip removal.`
      : `Victory rewards: +${gold} gold${relic ? ` and optional relic ${relic.name}` : ""}. Pick exactly one card reward or skip.`;

    cards.forEach((card) => {
      const button = createCardActionButton(card, "Add to deck", async () => {
        currentRun = await claimCardReward(currentRun, card);
        render();
        setStatus(`Added ${card.name} to deck.`);
      });
      elements.rewardActions.appendChild(button);
    });

    if (relic) {
      const relicButton = document.createElement("button");
      relicButton.className = "node-button";
      relicButton.innerHTML = `${relic.name}<br />${relic.description}<br />Claim relic`;
      relicButton.addEventListener("click", async () => {
        currentRun = await claimRelicReward(currentRun, relic);
        render();
        setStatus(`Claimed relic ${relic.name}.`);
      });
      elements.rewardActions.appendChild(relicButton);
    }

    const skipButton = document.createElement("button");
    skipButton.className = "node-button";
    skipButton.textContent = "Skip rewards";
    skipButton.addEventListener("click", async () => {
      currentRun = await skipRewards(currentRun);
      render();
      setStatus("Skipped reward selection.");
    });
    elements.rewardActions.appendChild(skipButton);
  }

  function renderRemoval() {
    elements.removalActions.innerHTML = "";
    if (!(removalModeOpen || (currentRun.pendingRewards && currentRun.pendingRewards.removeCard))) return;

    [...new Set(currentRun.player.deck)].forEach((cardId) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.textContent = `Remove ${cardId}`;
      button.addEventListener("click", async () => {
        currentRun = await removeCardFromDeck(currentRun, cardId);
        removalModeOpen = false;
        render();
        setStatus(`Removed ${cardId} from the deck.`);
      });
      elements.removalActions.appendChild(button);
    });

    const skipRemovalButton = document.createElement("button");
    skipRemovalButton.className = "node-button";
    skipRemovalButton.textContent = "Skip removal";
    skipRemovalButton.addEventListener("click", async () => {
      currentRun = await finishNode(currentRun);
      removalModeOpen = false;
      render();
      setStatus("Skipped card removal.");
    });
    elements.removalActions.appendChild(skipRemovalButton);
  }

  function renderEndState() {
    elements.endStateCard.classList.remove("win", "loss");
    if (currentRun.state === "won") {
      elements.endStateCard.classList.add("win");
      elements.endStateText.textContent = "Victory. You cleared the boss and finished the run.";
      return;
    }
    if (currentRun.state === "lost") {
      elements.endStateCard.classList.add("loss");
      elements.endStateText.textContent = "Defeat. The run has ended, but you can start a new one immediately.";
      return;
    }
    elements.endStateText.textContent = "Your run is still in progress.";
  }

  function render() {
    elements.runState.textContent = currentRun.state;
    elements.playerHealth.textContent = String(currentRun.player.health);
    elements.playerGold.textContent = String(currentRun.player.gold);
    elements.deckCount.textContent = String(currentRun.player.deck.length);
    elements.currentNode.textContent = currentRun.map.currentNodeId || "none";
    elements.combatState.textContent = currentRun.combat ? currentRun.combat.state : "not in combat";
    elements.relicCount.textContent = String((currentRun.relics || []).length);
    elements.deckList.innerHTML = "";
    elements.relicList.innerHTML = "";

    currentRun.player.deck.forEach((cardId) => {
      const item = document.createElement("li");
      item.textContent = cardId;
      elements.deckList.appendChild(item);
    });

    (currentRun.relics || []).forEach((relic) => {
      const item = document.createElement("li");
      item.textContent = `${relic.name} — ${relic.description}`;
      elements.relicList.appendChild(item);
    });

    const hasCombat = !!(currentRun.combat && currentRun.combat.state === "active");
    const hasRewards = !!(currentRun.pendingRewards || currentRun.event);
    elements.combatSection.classList.toggle("hidden", !hasCombat);
    elements.rewardsSection.classList.toggle("hidden", !hasRewards);

    renderMap();
    renderCombat();
    renderRewards();
    renderRemoval();
    renderEndState();
    elements.rawState.textContent = JSON.stringify(currentRun, null, 2);
  }

  document.getElementById("new-run-button").addEventListener("click", async () => {
    try {
      currentRun = await startNewRun();
      removalModeOpen = false;
      render();
      setStatus("Started a fresh run with varied map content.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("save-run-button").addEventListener("click", () => {
    saveRun(currentRun);
    setStatus("Run saved to localStorage.");
  });

  document.getElementById("toggle-removal-button").addEventListener("click", () => {
    removalModeOpen = !removalModeOpen;
    render();
    setStatus(removalModeOpen ? "Card removal view opened." : "Card removal view closed.");
  });

  document.getElementById("load-run-button").addEventListener("click", () => {
    try {
      currentRun = loadRun();
      render();
      setStatus("Run loaded from localStorage.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("clear-save-button").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    setStatus("Saved run cleared.");
  });

  document.getElementById("end-turn-button").addEventListener("click", async () => {
    if (!currentRun.combat) {
      setStatus("No active combat.", true);
      return;
    }
    const resolvedIntentLabel = currentRun.combat.enemyIntent?.label || "Enemy acted.";
    currentRun = await endTurnAction(currentRun);
    const nextCombat = currentRun.combat;
    render();
    setStatus(nextCombat.state === "defeat"
      ? `${resolvedIntentLabel} You were defeated. Start a new run to try again.`
      : nextCombat.reshuffled
        ? `${resolvedIntentLabel} Then the discard pile was reshuffled into the draw pile.`
        : resolvedIntentLabel);
  });

  async function initializeApp() {
    try {
      await loadCardCatalog();
      currentRun = await startNewRun();
      render();
      setStatus("Started a fresh run with varied map content.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  loadBundleMeta();
  initializeApp();
})();
