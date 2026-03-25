/* eslint-env browser */
(() => {
  const STORAGE_KEY = "drawforge.run";
  const DEFAULT_PLAYER_HEALTH = 80;
  const DEFAULT_PLAYER_GOLD = 99;
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

  const generateMap = ({ rows = 5, columns = 3 } = {}) => {
    const nodes = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        nodes.push({
          id: `r${row}c${col}`,
          row,
          col,
          type: "combat",
          next: []
        });
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

    return {
      rows,
      columns,
      nodes,
      currentNodeId: null
    };
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
      combat: {
        state: "active",
        turn: "player",
        player: {
          health: run.player.health,
          block: 0,
          energy: 0
        },
        hand: [],
        discardPile: [],
        enemy: {
          id: "slime",
          health: 30
        }
      }
    };
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
    mapActions: document.getElementById("map-actions")
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
      if (currentRun.map.currentNodeId === node.id) {
        button.classList.add("current");
      }
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

  render();
})();
