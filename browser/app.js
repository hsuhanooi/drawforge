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

  const startNewRun = () => ({
    state: "in_progress",
    player: {
      health: DEFAULT_PLAYER_HEALTH,
      gold: DEFAULT_PLAYER_GOLD,
      deck: [...DEFAULT_STARTER_DECK]
    },
    combat: null,
    map: {
      currentNodeId: null
    }
  });

  const validateRun = (run) => {
    if (!run || typeof run !== "object") {
      throw new Error("Saved run must be an object");
    }

    if (!run.player || !Array.isArray(run.player.deck)) {
      throw new Error("Saved run player deck is invalid");
    }

    if (!run.map || !(run.map.currentNodeId === null || typeof run.map.currentNodeId === "string")) {
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

  const elements = {
    status: document.getElementById("status"),
    runState: document.getElementById("run-state"),
    playerHealth: document.getElementById("player-health"),
    playerGold: document.getElementById("player-gold"),
    deckCount: document.getElementById("deck-count"),
    currentNode: document.getElementById("current-node"),
    combatState: document.getElementById("combat-state"),
    deckList: document.getElementById("deck-list"),
    rawState: document.getElementById("raw-state")
  };

  let currentRun = startNewRun();

  const setStatus = (message, isError = false) => {
    elements.status.textContent = message;
    elements.status.style.color = isError ? "#fca5a5" : "#93c5fd";
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

    elements.rawState.textContent = JSON.stringify(currentRun, null, 2);
  };

  document.getElementById("new-run-button").addEventListener("click", () => {
    currentRun = startNewRun();
    render();
    setStatus("Started a fresh run.");
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
