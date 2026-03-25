const { createBalanceConfig } = require("./balance");

const getNodeType = (row, col, rows) => {
  if (row === rows - 1) {
    return "boss";
  }

  if (row === rows - 2) {
    return "elite";
  }

  if (row > 0 && row % 2 === 1 && col === 1) {
    return "event";
  }

  return "combat";
};

const generateMap = (options = {}, balanceOverrides = {}) => {
  const balance = createBalanceConfig(balanceOverrides);
  const { rows = balance.map.rows, columns = balance.map.columns } = options;
  const nodes = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      nodes.push({
        id: `r${row}c${col}`,
        row,
        col,
        type: getNodeType(row, col, rows),
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
