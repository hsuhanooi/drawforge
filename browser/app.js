/* eslint-env browser */
(() => {
  const STORAGE_KEY = "drawforge.run";
  const DEFAULT_PLAYER_HEALTH = 80;
  const DEFAULT_PLAYER_GOLD = 99;
  const DEFAULT_PLAYER_ENERGY = 3;
  const DEFAULT_STARTER_DECK = [
    "strike",
    "strike",
    "strike",
    "strike",
    "strike",
    "defend",
    "defend",
    "defend",
    "defend",
    "defend"
  ];

  const makeStrike = () => ({
    id: "strike",
    name: "Strike",
    cost: 1,
    type: "attack"
  });

  const makeDefend = () => ({
    id: "defend",
    name: "Defend",
    cost: 1,
    type: "skill"
  });

  const createCardFromId = (cardId) => {
    if (cardId === "strike") {
      return makeStrike();
    }
    if (cardId === "defend") {
      return makeDefend();
    }

    throw new Error(`Unknown card id: ${cardId}`);
  };

  const generateMap = ({ rows = 5, columns = 3 } = {}) => {
    const nodes = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        nodes.push({ id: `r${row}c${col}`, row, col, type: "combat", next: [] });
      }
    }

    const byId = new Map(nodes.map((node) => [node.id, node]));

    for (let row = 0; row < rows - 1; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const node = byId.get(`r${row}c${col}`);
        const nextCols = [col];
        if (col > 0) {
          nextCols.push(col - 1);
        }
        if (col < columns - 1) {
          nextCols.push(col + 1);
        }
        node.next = nextCols.map((nextCol) => `r${row + 1}c${nextCol}`);
      }
    }

    return { rows, columns, nodes, currentNodeId: null };
  };

  const startNewRun = () => ({
    state: "in_progress",
    player: {
      health: DEFAULT_PLAYER_HEALTH,
      gold: DEFAULT_PLAYER_GOLD,
      deck: [...DEFAULT_STARTER_DECK]
    },
    combat: null,
    map: generateMap()
  });

  const validateRun = (run) => {
    if (!run || typeof run !== "object") {
      throw new Error("Saved run must be an object");
    }
    if (!run.player || !Array.isArray(run.player.deck)) {
      throw new Error("Saved run player deck is invalid");
    }
    if (!run.map || !Array.isArray(run.map.nodes)) {
      throw new Error("Saved run map data is invalid");
    }
    if (!(run.map.currentNodeId === null || typeof run.map.currentNodeId === "string")) {
      throw new Error("Saved run map position is invalid");
    }
    return run;
  };

  const saveRun = (run) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  };

  const loadRun = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      throw new Error("No saved run found");
    }
    return validateRun(JSON.parse(raw));
  };

  const getStartingNodes = (map) => map.nodes.filter((node) => node.row === 0);

  const listAvailableNodes = (run) => {
    if (run.map.currentNodeId === null) {
      return getStartingNodes(run.map);
    }
    const currentNode = run.map.nodes.find((node) => node.id === run.map.currentNodeId);
    if (!currentNode) {
      return [];
    }
    return run.map.nodes.filter((node) => currentNode.next.includes(node.id));
  };

  const drawCards = (combat, count) => {
    const next = { ...combat };
    next.drawPile = [...(next.drawPile || [])];
    next.hand = [...(next.hand || [])];
    next.discardPile = [...(next.discardPile || [])];

    for (let i = 0; i < count; i += 1) {
      if (next.drawPile.length === 0 && next.discardPile.length > 0) {
        next.drawPile = [...next.discardPile];
        next.discardPile = [];
      }
      if (next.drawPile.length === 0) {
        break;
      }
      const [card, ...rest] = next.drawPile;
      next.drawPile = rest;
      next.hand.push(card);
    }

    return next;
  };

  const startCombat = (run) => {
    const drawPile = run.player.deck.map(createCardFromId);
    const combat = drawCards({
      state: "active",
      turn: "player",
      player: {
        health: run.player.health,
        block: 0,
        energy: DEFAULT_PLAYER_ENERGY
      },
      hand: [],
      drawPile,
      discardPile: [],
      enemy: { id: "slime", health: 30 }
    }, 5);

    return combat;
  };

  const enterNode = (run, nodeId) => {
    const node = run.map.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if (run.map.currentNodeId === null && node.row !== 0) {
      throw new Error("Invalid starting node");
    }
    if (run.map.currentNodeId !== null) {
      const currentNode = run.map.nodes.find((candidate) => candidate.id === run.map.currentNodeId);
      if (!currentNode || !currentNode.next.includes(nodeId)) {
        throw new Error("Invalid move");
      }
    }

    return {
      ...run,
      map: {
        ...run.map,
        currentNodeId: nodeId
      },
      combat: startCombat(run)
    };
  };

  const playCardAtIndex = (combat, handIndex) => {
    const card = combat.hand[handIndex];
    if (!card) {
      throw new Error("Card not found in hand");
    }
    if (combat.turn !== "player") {
      throw new Error("It is not the player's turn");
    }
    if (combat.player.energy < card.cost) {
      throw new Error("Not enough energy");
    }

    const next = {
      ...combat,
      hand: combat.hand.filter((_, index) => index !== handIndex),
      discardPile: [...combat.discardPile, card],
      player: {
        ...combat.player,
        energy: combat.player.energy - card.cost
      }
    };

    if (card.id === "strike") {
      next.enemy = {
        ...next.enemy,
        health: next.enemy.health - 6
      };
    }

    if (card.id === "defend") {
      next.player = {
        ...next.player,
        block: next.player.block + 5
      };
    }

    if (next.enemy.health <= 0) {
      next.enemy.health = 0;
      next.state = "victory";
      next.turn = null;
    }

    return next;
  };

  const resolveEndTurn = (combat) => {
    if (combat.state !== "active") {
      return combat;
    }

    const damage = 6;
    const blocked = Math.min(combat.player.block, damage);
    const remainingDamage = damage - blocked;
    const nextHealth = Math.max(0, combat.player.health - remainingDamage);

    let next = {
      ...combat,
      turn: "player",
      player: {
        ...combat.player,
        health: nextHealth,
        block: 0,
        energy: DEFAULT_PLAYER_ENERGY
      }
    };

    if (next.player.health <= 0) {
      next.state = "defeat";
      next.turn = null;
      return next;
    }

    next = drawCards(next, 5);
    return next;
  };

  const elements = {
    status: document.getElementById("status"),
    runState: document.getElementById("run-state"),
    playerHealth: document.getElementById("player-health"),
    playerGold: document.getElementById("player-gold"),
    deckCount: document.getElementById("deck-count"),
    currentNode: document.getElementById("current-node"),
    combatState: document.getElementById("combat-state"),
    deckList: document.getElementById("deck-list"),
    rawState: document.getElementById("raw-state"),
    mapActions: document.getElementById("map-actions"),
    handActions: document.getElementById("hand-actions"),
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
      empty.textContent = "No available map moves.";
      elements.mapActions.appendChild(empty);
      return;
    }

    availableNodes.forEach((node) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `Node ${node.id}<br />Row ${node.row}, Col ${node.col}<br />Type: ${node.type}`;
      button.addEventListener("click", () => {
        try {
          currentRun = enterNode(currentRun, node.id);
          render();
          setStatus(`Entered ${node.id}. Combat encounter created.`);
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
    elements.combatEnemyHealth.textContent = String(combat.enemy.health);
    elements.combatTurn.textContent = combat.turn || combat.state;

    combat.hand.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.innerHTML = `${card.name}<br />Cost: ${card.cost}<br />Type: ${card.type}`;
      button.disabled = combat.turn !== "player" || combat.state !== "active";
      button.addEventListener("click", () => {
        try {
          currentRun = {
            ...currentRun,
            combat: playCardAtIndex(currentRun.combat, index)
          };
          render();
          setStatus(`Played ${card.name}.`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      elements.handActions.appendChild(button);
    });
  };

  const render = () => {
    elements.runState.textContent = currentRun.state;
    elements.playerHealth.textContent = String(currentRun.player.health);
    elements.playerGold.textContent = String(currentRun.player.gold);
    elements.deckCount.textContent = String(currentRun.player.deck.length);
    elements.currentNode.textContent = currentRun.map.currentNodeId || "none";
    elements.combatState.textContent = currentRun.combat ? currentRun.combat.state : "not in combat";
    elements.deckList.innerHTML = "";

    currentRun.player.deck.forEach((cardId) => {
      const item = document.createElement("li");
      item.textContent = cardId;
      elements.deckList.appendChild(item);
    });

    renderMap();
    renderCombat();
    elements.rawState.textContent = JSON.stringify(currentRun, null, 2);
  };

  document.getElementById("new-run-button").addEventListener("click", () => {
    currentRun = startNewRun();
    render();
    setStatus("Started a fresh run and generated a map.");
  });

  document.getElementById("save-run-button").addEventListener("click", () => {
    saveRun(currentRun);
    setStatus("Run saved to localStorage.");
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

  document.getElementById("end-turn-button").addEventListener("click", () => {
    if (!currentRun.combat) {
      setStatus("No active combat.", true);
      return;
    }

    currentRun = {
      ...currentRun,
      combat: resolveEndTurn(currentRun.combat)
    };
    render();
    setStatus("Ended turn and resolved enemy attack.");
  });

  render();
})();
