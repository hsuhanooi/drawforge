const generateMap = ({ rows = 5, columns = 3 } = {}) => {
  const nodes = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      nodes.push({
        id: `r${row}c${col}`,
        row,
        col,
        type: "combat",
        next: row === rows - 1 ? [] : []
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
  generateMap
};
