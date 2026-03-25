/* eslint-env browser */
(() => {
  const STORAGE_KEY = "drawforge.run";
  const DEFAULT_PLAYER_HEALTH = 80;
  const DEFAULT_PLAYER_GOLD = 99;
  const DEFAULT_PLAYER_ENERGY = 3;
  const DEFAULT_STARTER_DECK = [
    "strike", "strike", "strike", "strike", "strike",
    "defend", "defend", "defend", "defend", "defend"
  ];

  const CARD_LIBRARY = {
    strike: { id: "strike", name: "Strike", cost: 1, type: "attack", damage: 6 },
    defend: { id: "defend", name: "Defend", cost: 1, type: "skill", block: 5 }
  };

  const RELICS = [
    { id: "iron_core", name: "Iron Core", description: "+5 max health and heal 5 immediately" },
    { id: "feather_charm", name: "Feather Charm", description: "+15 gold immediately" },
    { id: "ember_ring", name: "Ember Ring", description: "Start each combat with +1 energy" }
  ];

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const createCardFromId = (cardId) => ({ ...CARD_LIBRARY[cardId] });
  const createRewardCardOptions = () => [createCardFromId("strike"), createCardFromId("defend"), createCardFromId("strike")];

  const getNodeType = (row, col, rows) => {
    if (row === rows - 1) return "boss";
    if (row === rows - 2) return "elite";
    if (row > 0 && row % 2 === 1 && col === 1) return "event";
    return "combat";
  };

  const createEnemyForNode = (node) => {
    if (node.type === "elite") {
      return { id: "cultist_captain", name: "Cultist Captain", health: 45, damage: 9, rewardGold: 25 };
    }
    if (node.type === "boss") {
      return { id: "spire_guardian", name: "Spire Guardian", health: 70, damage: 12, rewardGold: 50 };
    }
    const enemies = [
      { id: "slime", name: "Slime", health: 30, damage: 6, rewardGold: 12 },
      { id: "fangling", name: "Fangling", health: 26, damage: 7, rewardGold: 12 },
      { id: "mossling", name: "Mossling", health: 34, damage: 5, rewardGold: 12 }
    ];
    return enemies[(node.row + node.col) % enemies.length];
  };

  const generateMap = ({ rows = 5, columns = 3 } = {}) => {
    const nodes = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        nodes.push({ id: `r${row}c${col}`, row, col, type: getNodeType(row, col, rows), next: [] });
      }
    }
    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (let row = 0; row < rows - 1; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const nextCols = [col];
        if (col > 0) nextCols.push(col - 1);
        if (col < columns - 1) nextCols.push(col + 1);
        byId.get(`r${row}c${col}`).next = nextCols.map((nextCol) => `r${row + 1}c${nextCol}`);
      }
    }
    return { rows, columns, nodes, currentNodeId: null };
  };

  const startNewRun = () => ({
    state: "in_progress",
    player: { health: DEFAULT_PLAYER_HEALTH, gold: DEFAULT_PLAYER_GOLD, deck: [...DEFAULT_STARTER_DECK] },
    relics: [],
    combat: null,
    pendingRewards: null,
    event: null,
    map: generateMap()
  });

  const validateRun = (run) => {
    if (!run || typeof run !== "object") throw new Error("Saved run must be an object");
    if (!run.player || !Array.isArray(run.player.deck)) throw new Error("Saved run player deck is invalid");
    if (!run.map || !Array.isArray(run.map.nodes)) throw new Error("Saved run map data is invalid");
    return run;
  };

  const saveRun = (run) => localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  const loadRun = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No saved run found");
    return validateRun(JSON.parse(raw));
  };

  const getStartingNodes = (map) => map.nodes.filter((node) => node.row === 0);
  const listAvailableNodes = (run) => {
    if (run.pendingRewards || run.event || (run.combat && run.combat.state === "active")) return [];
    if (run.map.currentNodeId === null) return getStartingNodes(run.map);
    const currentNode = run.map.nodes.find((node) => node.id === run.map.currentNodeId);
    if (!currentNode) return [];
    return run.map.nodes.filter((node) => currentNode.next.includes(node.id));
  };

  const drawCards = (combat, count) => {
    const next = clone(combat);
    for (let i = 0; i < count; i += 1) {
      if (next.drawPile.length === 0 && next.discardPile.length > 0) {
        next.drawPile = [...next.discardPile];
        next.discardPile = [];
      }
      if (next.drawPile.length === 0) break;
      next.hand.push(next.drawPile.shift());
    }
    return next;
  };

  const getEnergyBonus = (run) => ((run.relics || []).some((relic) => relic.id === "ember_ring") ? 1 : 0);

  const startCombat = (run, node) => {
    const enemy = createEnemyForNode(node);
    return drawCards({
      state: "active",
      turn: "player",
      nodeType: node.type,
      player: { health: run.player.health, block: 0, energy: DEFAULT_PLAYER_ENERGY + getEnergyBonus(run) },
      hand: [],
      drawPile: run.player.deck.map(createCardFromId),
      discardPile: [],
      enemy
    }, 5);
  };

  const createVictoryRewards = (nodeType) => ({
    cards: createRewardCardOptions(),
    gold: nodeType === "boss" ? 50 : nodeType === "elite" ? 25 : 12,
    relic: ["elite", "boss"].includes(nodeType) ? RELICS[nodeType === "boss" ? 2 : 1] : null
  });

  const createEventState = (node) => ({
    id: `event-${node.id}`,
    text: "A quiet shrine offers either healing or a relic.",
    options: [
      { id: "heal", label: "Recover 10 health", effect: "heal" },
      { id: "relic", label: `Take ${RELICS[(node.row + node.col) % RELICS.length].name}`, effect: "relic", relic: RELICS[(node.row + node.col) % RELICS.length] }
    ]
  });

  const enterNode = (run, nodeId) => {
    const node = run.map.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("Node not found");
    if (run.map.currentNodeId === null && node.row !== 0) throw new Error("Invalid starting node");
    if (run.map.currentNodeId !== null) {
      const currentNode = run.map.nodes.find((candidate) => candidate.id === run.map.currentNodeId);
      if (!currentNode || !currentNode.next.includes(nodeId)) throw new Error("Invalid move");
    }

    const nextRun = { ...run, map: { ...run.map, currentNodeId: nodeId }, pendingRewards: null, event: null };
    if (["combat", "elite", "boss"].includes(node.type)) {
      nextRun.combat = startCombat(run, node);
      return nextRun;
    }
    if (node.type === "event") {
      nextRun.combat = null;
      nextRun.event = createEventState(node);
      return nextRun;
    }
    return nextRun;
  };

  const applyVictory = (run, combat) => ({
    ...run,
    player: { ...run.player, health: combat.player.health, gold: run.player.gold + createVictoryRewards(combat.nodeType).gold },
    combat,
    pendingRewards: createVictoryRewards(combat.nodeType)
  });

  const playCardAtIndex = (combat, handIndex) => {
    const card = combat.hand[handIndex];
    if (!card) throw new Error("Card not found in hand");
    if (combat.turn !== "player") throw new Error("It is not the player's turn");
    if (combat.player.energy < card.cost) throw new Error("Not enough energy");

    const next = clone(combat);
    next.player.energy -= card.cost;
    next.hand.splice(handIndex, 1);
    next.discardPile.push(card);

    if (card.damage) next.enemy.health -= card.damage;
    if (card.block) next.player.block += card.block;

    if (next.enemy.health <= 0) {
      next.enemy.health = 0;
      next.state = "victory";
      next.turn = null;
    }

    return next;
  };

  const resolveEndTurn = (combat, run) => {
    if (combat.state !== "active") return combat;
    const blocked = Math.min(combat.player.block, combat.enemy.damage);
    const remainingDamage = combat.enemy.damage - blocked;
    const nextHealth = Math.max(0, combat.player.health - remainingDamage);

    let next = clone(combat);
    next.player.health = nextHealth;
    next.player.block = 0;
    next.player.energy = DEFAULT_PLAYER_ENERGY + getEnergyBonus(run);
    next.turn = nextHealth > 0 ? "player" : null;

    if (nextHealth <= 0) {
      next.state = "defeat";
      return next;
    }

    return drawCards(next, 5);
  };

  const applyRelic = (run, relic) => {
    const nextRun = { ...run, relics: [...(run.relics || []), relic], player: { ...run.player } };
    if (relic.id === "iron_core") nextRun.player.health += 5;
    if (relic.id === "feather_charm") nextRun.player.gold += 15;
    return nextRun;
  };

  const claimCardReward = (run, card) => ({
    ...run,
    player: { ...run.player, deck: [...run.player.deck, card.id] },
    combat: null,
    pendingRewards: null,
    state: run.map.currentNodeId === `r${run.map.rows - 1}c1` ? "won" : "in_progress"
  });

  const claimRelicReward = (run, relic) => ({
    ...applyRelic(run, relic),
    combat: null,
    pendingRewards: null,
    state: run.map.currentNodeId === `r${run.map.rows - 1}c1` ? "won" : "in_progress"
  });

  const skipRewards = (run) => ({
    ...run,
    combat: null,
    pendingRewards: null,
    state: run.map.currentNodeId === `r${run.map.rows - 1}c1` ? "won" : "in_progress"
  });

  const claimEventOption = (run, option) => {
    let nextRun = { ...run, event: null };
    if (option.effect === "heal") {
      nextRun = { ...nextRun, player: { ...nextRun.player, health: nextRun.player.health + 10 } };
    }
    if (option.effect === "relic") {
      nextRun = applyRelic(nextRun, option.relic);
    }
    return nextRun;
  };

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
    combatPlayerHealth: document.getElementById("combat-player-health"),
    combatPlayerBlock: document.getElementById("combat-player-block"),
    combatPlayerEnergy: document.getElementById("combat-player-energy"),
    combatEnemyHealth: document.getElementById("combat-enemy-health"),
    combatTurn: document.getElementById("combat-turn")
  };

  let currentRun = startNewRun();

  const setStatus = (message, isError = false) => {
    elements.status.textContent = message;
    elements.status.style.color = isError ? "#fca5a5" : "#93c5fd";
  };

  const renderMap = () => {
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
      button.addEventListener("click", () => {
        try {
          currentRun = enterNode(currentRun, node.id);
          render();
          setStatus(`Entered ${node.id} (${node.type}).`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      elements.mapActions.appendChild(button);
    });
  };

  const renderCombat = () => {
    const combat = currentRun.combat;
    elements.handActions.innerHTML = "";
    if (!combat) {
      elements.combatPlayerHealth.textContent = "-";
      elements.combatPlayerBlock.textContent = "-";
      elements.combatPlayerEnergy.textContent = "-";
      elements.combatEnemyHealth.textContent = "-";
      elements.combatTurn.textContent = "-";
      return;
    }

    elements.combatPlayerHealth.textContent = String(combat.player.health);
    elements.combatPlayerBlock.textContent = String(combat.player.block);
    elements.combatPlayerEnergy.textContent = String(combat.player.energy);
    elements.combatEnemyHealth.textContent = `${combat.enemy.name} (${combat.enemy.health})`;
    elements.combatTurn.textContent = combat.turn || combat.state;

    combat.hand.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `${card.name}<br />Cost: ${card.cost}<br />Type: ${card.type}`;
      button.disabled = combat.turn !== "player" || combat.state !== "active";
      button.addEventListener("click", () => {
        try {
          const updatedCombat = playCardAtIndex(currentRun.combat, index);
          currentRun = updatedCombat.state === "victory" ? applyVictory(currentRun, updatedCombat) : { ...currentRun, combat: updatedCombat, player: { ...currentRun.player, health: updatedCombat.player.health } };
          render();
          setStatus(updatedCombat.state === "victory" ? `Won the ${updatedCombat.enemy.name} fight.` : `Played ${card.name}.`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      elements.handActions.appendChild(button);
    });
  };

  const renderRewards = () => {
    elements.rewardActions.innerHTML = "";
    if (currentRun.event) {
      elements.rewardSummary.textContent = currentRun.event.text;
      currentRun.event.options.forEach((option) => {
        const button = document.createElement("button");
        button.className = "node-button";
        button.textContent = option.label;
        button.addEventListener("click", () => {
          currentRun = claimEventOption(currentRun, option);
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

    const { cards, gold, relic } = currentRun.pendingRewards;
    elements.rewardSummary.textContent = `Victory rewards: +${gold} gold${relic ? ` and relic ${relic.name}` : ""}. Pick a card reward or skip.`;
    cards.forEach((card) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `${card.name}<br />Add to deck`;
      button.addEventListener("click", () => {
        currentRun = claimCardReward(currentRun, card);
        render();
        setStatus(`Added ${card.name} to deck.`);
      });
      elements.rewardActions.appendChild(button);
    });
    if (relic) {
      const relicButton = document.createElement("button");
      relicButton.className = "node-button";
      relicButton.innerHTML = `${relic.name}<br />Claim relic`;
      relicButton.addEventListener("click", () => {
        currentRun = claimRelicReward(currentRun, relic);
        render();
        setStatus(`Claimed relic ${relic.name}.`);
      });
      elements.rewardActions.appendChild(relicButton);
    }
    const skipButton = document.createElement("button");
    skipButton.className = "node-button";
    skipButton.textContent = "Skip rewards";
    skipButton.addEventListener("click", () => {
      currentRun = skipRewards(currentRun);
      render();
      setStatus("Skipped reward selection.");
    });
    elements.rewardActions.appendChild(skipButton);
  };

  const render = () => {
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

    renderMap();
    renderCombat();
    renderRewards();
    elements.rawState.textContent = JSON.stringify(currentRun, null, 2);
  };

  document.getElementById("new-run-button").addEventListener("click", () => {
    currentRun = startNewRun();
    render();
    setStatus("Started a fresh run with varied map content.");
  });
  document.getElementById("save-run-button").addEventListener("click", () => { saveRun(currentRun); setStatus("Run saved to localStorage."); });
  document.getElementById("load-run-button").addEventListener("click", () => {
    try {
      currentRun = loadRun();
      render();
      setStatus("Run loaded from localStorage.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });
  document.getElementById("clear-save-button").addEventListener("click", () => { localStorage.removeItem(STORAGE_KEY); setStatus("Saved run cleared."); });
  document.getElementById("end-turn-button").addEventListener("click", () => {
    if (!currentRun.combat) return setStatus("No active combat.", true);
    const nextCombat = resolveEndTurn(currentRun.combat, currentRun);
    currentRun = nextCombat.state === "defeat"
      ? { ...currentRun, combat: nextCombat, player: { ...currentRun.player, health: 0 }, state: "lost" }
      : { ...currentRun, combat: nextCombat, player: { ...currentRun.player, health: nextCombat.player.health } };
    render();
    setStatus(nextCombat.state === "defeat" ? "You were defeated." : "Ended turn and resolved enemy attack.");
  });

  render();
})();
