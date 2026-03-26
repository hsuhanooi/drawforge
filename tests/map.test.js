const { generateMap } = require("../src/map");

const createSequenceRng = (...values) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
};

describe("map generation", () => {
  it("creates multiple rows of nodes with type metadata", () => {
    const map = generateMap({ rows: 5, columns: 3, rng: createSequenceRng(0.1, 0.8, 0.3, 0.6) });

    expect(map.nodes).toHaveLength(15);
    const rows = new Set(map.nodes.map((node) => node.row));
    expect(rows.size).toBe(5);
    map.nodes.forEach((node) => {
      expect(typeof node.type).toBe("string");
      expect(Array.isArray(node.next)).toBe(true);
    });
  });

  it("connects nodes in a traversable structure", () => {
    const map = generateMap({ rows: 3, columns: 3, rng: createSequenceRng(0.4, 0.2) });
    const startNode = map.nodes.find((node) => node.id === "r0c1");

    expect(startNode.next).toContain("r1c1");
    expect(startNode.next).toContain("r1c0");
    expect(startNode.next).toContain("r1c2");

    const lastRowNode = map.nodes.find((node) => node.id === "r2c1");
    expect(lastRowNode.next).toEqual([]);
  });

  it("randomizes event and elite placement while preserving guaranteed content", () => {
    const leftHeavy = generateMap({ rows: 5, columns: 3, rng: createSequenceRng(0.0, 0.0, 0.0, 0.0) });
    const rightHeavy = generateMap({ rows: 5, columns: 3, rng: createSequenceRng(0.99, 0.99, 0.99, 0.99) });

    const leftTypes = leftHeavy.nodes.filter((node) => node.row === 1).map((node) => node.type);
    const rightTypes = rightHeavy.nodes.filter((node) => node.row === 1).map((node) => node.type);

    expect(leftTypes).not.toEqual(rightTypes);
    expect(leftHeavy.nodes.some((node) => node.type === "event")).toBe(true);
    expect(leftHeavy.nodes.some((node) => node.type === "elite")).toBe(true);
    expect(leftHeavy.nodes.some((node) => node.type === "boss")).toBe(true);
  });
});
