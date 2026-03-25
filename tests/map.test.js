const { generateMap } = require("../src/map");

describe("map generation", () => {
  it("creates multiple rows of nodes with type metadata", () => {
    const map = generateMap({ rows: 4, columns: 3 });

    expect(map.nodes).toHaveLength(12);
    const rows = new Set(map.nodes.map((node) => node.row));
    expect(rows.size).toBe(4);
    map.nodes.forEach((node) => {
      expect(typeof node.type).toBe("string");
      expect(Array.isArray(node.next)).toBe(true);
    });
  });

  it("connects nodes in a traversable structure", () => {
    const map = generateMap({ rows: 3, columns: 3 });
    const startNode = map.nodes.find((node) => node.id === "r0c1");

    expect(startNode.next).toContain("r1c1");
    expect(startNode.next).toContain("r1c0");
    expect(startNode.next).toContain("r1c2");

    const lastRowNode = map.nodes.find((node) => node.id === "r2c1");
    expect(lastRowNode.next).toEqual([]);
  });
});
