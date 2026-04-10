const { createBalanceConfig } = require("./balance");

const MAP_TEMPLATES = {
  dense: {
    id: "dense",
    name: "Dense",
    rows: 6,
    columns: 3,
    eventsPerMap: 2,
    shopsPerMap: 2,
    restsPerMap: 1,
    extraEliteRows: []
  },
  sparse: {
    id: "sparse",
    name: "Sparse",
    rows: 4,
    columns: 4,
    eventsPerMap: 3,
    shopsPerMap: 1,
    restsPerMap: 1,
    extraEliteRows: []
  },
  gauntlet: {
    id: "gauntlet",
    name: "Gauntlet",
    rows: 7,
    columns: 2,
    eventsPerMap: 0,
    shopsPerMap: 1,
    restsPerMap: 1,
    extraEliteRows: [2]
  }
};

const MAP_TEMPLATE_ORDER = [MAP_TEMPLATES.dense, MAP_TEMPLATES.sparse, MAP_TEMPLATES.gauntlet];

const createStandardTemplate = (rows, columns) => ({
  id: "standard",
  name: "Standard",
  rows,
  columns,
  eventsPerMap: rows > 3 ? 1 : 0,
  shopsPerMap: rows > 3 ? 1 : 0,
  restsPerMap: rows > 3 ? 1 : 0,
  extraEliteRows: []
});

const sample = (items, count, rng = Math.random) => {
  const pool = [...items];
  const chosen = [];

  while (pool.length > 0 && chosen.length < count) {
    const index = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
};

const hashSeed = (seed) => {
  const stringSeed = String(seed ?? "drawforge-default-seed");
  let hash = 2166136261;

  for (let index = 0; index < stringSeed.length; index += 1) {
    hash ^= stringSeed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const pickMapTemplate = (seed, act = 1) => {
  const index = (hashSeed(`${seed ?? "drawforge-default-seed"}:${act}`) % MAP_TEMPLATE_ORDER.length);
  return MAP_TEMPLATE_ORDER[index];
};

const getNodeType = (row, col, rows, rowTypeSelections = {}) => {
  if (row === rows - 1) return "boss";
  if (row === rows - 2) return "elite";
  if (rowTypeSelections.rests?.has(col)) return "rest";
  if (rowTypeSelections.shops?.has(col)) return "shop";
  if (rowTypeSelections.events?.has(col)) return "event";
  if (rowTypeSelections.elites?.has(col)) return "elite";
  return "combat";
};

const placeNodeTypes = (targetCount, rows, selections, columns, rng, key, blockedKeys = []) => {
  const candidateRows = Array.from({ length: rows }, (_, row) => row)
    .filter((row) => row > 0 && row < rows - 2);
  let placed = 0;

  while (candidateRows.length > 0 && placed < targetCount) {
    let placedThisPass = false;
    const rowOrder = sample(candidateRows, candidateRows.length, rng);

    for (const row of rowOrder) {
      if (placed >= targetCount) break;
      const rowSel = selections.get(row);
      const blockedSets = blockedKeys.map((blockedKey) => rowSel[blockedKey]);
      const available = Array.from({ length: columns }, (_, col) => col)
        .filter((col) => !rowSel[key].has(col) && !blockedSets.some((set) => set.has(col)));

      if (available.length === 0) {
        continue;
      }

      rowSel[key].add(available[Math.floor(rng() * available.length)]);
      placed += 1;
      placedThisPass = true;
    }

    if (!placedThisPass) {
      break;
    }
  }
};

const buildRowTypeSelections = (rows, columns, rng = Math.random, template = MAP_TEMPLATES.dense) => {
  const selections = new Map();
  const extraEliteRows = new Set(template.extraEliteRows || []);

  for (let row = 0; row < rows; row += 1) {
    const availableCols = Array.from({ length: columns }, (_, index) => index);
    const shouldSkipSpecialRow = row === 0 || row === rows - 1 || row === rows - 2;
    const events = shouldSkipSpecialRow || template.eventsPerMap === 0 ? new Set() : new Set();
    const elites = shouldSkipSpecialRow ? new Set() : new Set();

    selections.set(row, {
      events,
      elites,
      rests: new Set(),
      shops: new Set()
    });

    if (!shouldSkipSpecialRow && (row % 2 === 0 || extraEliteRows.has(row))) {
      const eliteCol = sample(availableCols, 1, rng)[0];
      if (eliteCol !== undefined) {
        elites.add(eliteCol);
      }
    }
  }

  placeNodeTypes(template.eventsPerMap || 0, rows, selections, columns, rng, "events", ["elites"]);
  placeNodeTypes(template.restsPerMap || 0, rows, selections, columns, rng, "rests", ["events", "elites", "shops"]);
  placeNodeTypes(template.shopsPerMap || 0, rows, selections, columns, rng, "shops", ["events", "elites", "rests"]);

  return selections;
};

const generateMap = (options = {}, balanceOverrides = {}) => {
  const balance = createBalanceConfig(balanceOverrides);
  const {
    rng = Math.random,
    seed,
    act = 1,
    template: templateOverride,
    rows: explicitRows,
    columns: explicitColumns
  } = options;
  const baseRows = explicitRows ?? balance.map.rows;
  const baseColumns = explicitColumns ?? balance.map.columns;
  const template = templateOverride || (seed !== undefined
    ? pickMapTemplate(seed, act)
    : createStandardTemplate(baseRows, baseColumns));
  const rows = explicitRows ?? template.rows ?? balance.map.rows;
  const columns = explicitColumns ?? template.columns ?? balance.map.columns;
  const rowTypeSelections = buildRowTypeSelections(rows, columns, rng, template);
  const nodes = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      nodes.push({
        id: `r${row}c${col}`,
        row,
        col,
        type: getNodeType(row, col, rows, rowTypeSelections.get(row) || {}),
        next: []
      });
    }
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const node = nodeById.get(`r${row}c${col}`);
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
    template: template.id,
    templateName: template.name,
    nodes
  };
};

module.exports = {
  MAP_TEMPLATES,
  generateMap,
  getNodeType,
  pickMapTemplate
};
