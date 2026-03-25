const isObject = (value) => value !== null && typeof value === "object";

const clone = (value) => JSON.parse(JSON.stringify(value));

const serializeRun = (run) => JSON.stringify(run);

const saveRun = (run, storage) => {
  if (!storage || typeof storage.setItem !== "function") {
    throw new Error("A storage adapter with setItem is required");
  }

  const serialized = serializeRun(run);
  storage.setItem("drawforge.run", serialized);
  return serialized;
};

const validatePlayer = (player) => {
  if (!isObject(player)) {
    throw new Error("Saved run is missing player state");
  }

  if (typeof player.health !== "number") {
    throw new Error("Saved run player health is invalid");
  }

  if (typeof player.gold !== "number") {
    throw new Error("Saved run player gold is invalid");
  }

  if (!Array.isArray(player.deck)) {
    throw new Error("Saved run player deck is invalid");
  }
};

const validateMap = (map) => {
  if (!isObject(map)) {
    throw new Error("Saved run is missing map state");
  }

  const { currentNodeId } = map;
  if (!(currentNodeId === null || typeof currentNodeId === "string")) {
    throw new Error("Saved run map position is invalid");
  }
};

const validateCombat = (combat) => {
  if (combat === null) {
    return;
  }

  if (!isObject(combat)) {
    throw new Error("Saved run combat state is invalid");
  }

  if (!isObject(combat.player) || typeof combat.player.health !== "number") {
    throw new Error("Saved run combat player state is invalid");
  }

  if (!isObject(combat.enemy) || typeof combat.enemy.health !== "number") {
    throw new Error("Saved run combat enemy state is invalid");
  }
};

const validateRun = (run) => {
  if (!isObject(run)) {
    throw new Error("Saved run must be an object");
  }

  if (typeof run.state !== "string") {
    throw new Error("Saved run state is invalid");
  }

  validatePlayer(run.player);
  validateMap(run.map);
  validateCombat(run.combat);
};

const loadRun = (savedData) => {
  let parsed = savedData;

  if (typeof savedData === "string") {
    try {
      parsed = JSON.parse(savedData);
    } catch (error) {
      throw new Error("Saved run data is not valid JSON");
    }
  }

  validateRun(parsed);
  return clone(parsed);
};

const loadRunFromStorage = (storage) => {
  if (!storage || typeof storage.getItem !== "function") {
    throw new Error("A storage adapter with getItem is required");
  }

  const savedData = storage.getItem("drawforge.run");
  if (savedData === null || savedData === undefined) {
    throw new Error("No saved run found");
  }

  return loadRun(savedData);
};

const createMemoryStorage = () => {
  const items = new Map();

  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      items.set(key, value);
    },
    clear: () => {
      items.clear();
    }
  };
};

module.exports = {
  serializeRun,
  saveRun,
  loadRun,
  loadRunFromStorage,
  createMemoryStorage
};
