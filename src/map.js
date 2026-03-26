const { createBalanceConfig } = require("./balance");

const sample = (items, count, rng = Math.random) => {
  const pool = [...items];
  const chosen = [];

  while (pool.length > 0 && chosen.length < count) {
    const index = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
};

const getNodeType = (row, col, rows, rowTypeSelections = {}) => {
  if (row === rows - 1) {
    return "boss";
  }

  if (row === rows - 2) {
    return "elite";
  }

  if (rowTypeSelections.events?.has(col)) {
    return "event";
  }

  if (rowTypeSelections.elites?.has(col)) {
    return "elite";
  }

  return "combat";
};

const buildRowTypeSelections = (rows, columns, rng = Math.random) => {
  const selections = new Map();

  for (let row = 0; row < rows; row += 1) {
    if (row === rows - 1 || row === rows - 2) {
      continue;
    }

    const availableCols = Array.from({ length: columns }, (_, index) => index);
    const events = row > 0 ? new Set(sample(availableCols, 1, rng)) : new Set();
    const nonEventCols = availableCols.filter((col) => !events.has(col));
    const elites = row > 0 && row % 2 === 0 && row < rows - 2
      ? new Set(sample(nonEventCols, 1, rng))
      : new Set();

    selections.set(row, { events, elites });
  }

  return selections;
};

const generateMap = (options = {}, balanceOverrides = {}) => {
  const balance = createBalanceConfig(balanceOverrides);
  const { rows = balance.map.rows, columns = balance.map.columns, rng = Math.random } = options;
  const rowTypeSelections = buildRowTypeSelections(rows, columns, rng);
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
    nodes
  };
};

module.exports = {
  generateMap,
  getNodeType
};
