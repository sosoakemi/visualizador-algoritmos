import { describe, expect, it } from "vitest";
import { neighbors, pathAlgorithms, type Grid, type PathResult } from "../src/algorithms/pathfinding";

function makeGrid(rows: number, cols: number, start: [number, number], end: [number, number]): Grid {
  return {
    rows,
    cols,
    walls: new Uint8Array(rows * cols),
    weights: new Uint8Array(rows * cols).fill(1),
    start: start[0] * cols + start[1],
    end: end[0] * cols + end[1],
  };
}

function run(key: string, grid: Grid): PathResult {
  const generator = pathAlgorithms[key].run(grid);
  let result = generator.next();
  while (!result.done) result = generator.next();
  return result.value;
}

function expectValidPath(grid: Grid, path: number[]) {
  expect(path[0]).toBe(grid.start);
  expect(path.at(-1)).toBe(grid.end);
  for (let i = 1; i < path.length; i++) {
    expect(neighbors(grid, path[i - 1])).toContain(path[i]);
  }
}

describe("busca de caminhos", () => {
  it("todos acham um caminho válido; BFS, Dijkstra e A* acham o mais curto", () => {
    const grid = makeGrid(10, 10, [0, 0], [9, 9]);
    for (const key of Object.keys(pathAlgorithms)) {
      const { path, cost } = run(key, grid);
      expectValidPath(grid, path);
      if (key !== "dfs") expect(cost).toBe(18);
    }
  });

  it("contorna paredes", () => {
    const grid = makeGrid(5, 5, [0, 0], [0, 4]);
    for (let row = 0; row < 4; row++) grid.walls[row * 5 + 2] = 1; // parede vertical com passagem embaixo
    const { path, cost } = run("astar", grid);
    expectValidPath(grid, path);
    expect(cost).toBe(12);
    expect(path.some((cell) => grid.walls[cell])).toBe(false);
  });

  it("Dijkstra e A* desviam do terreno pesado; BFS não", () => {
    // Do meio da coluna 0 ao meio da coluna 6. A coluna 3 é pesada, exceto na última linha.
    const grid = makeGrid(5, 7, [2, 0], [2, 6]);
    for (let row = 0; row < 4; row++) grid.weights[row * 7 + 3] = 9;

    const bfs = run("bfs", grid);
    const dijkstra = run("dijkstra", grid);
    const astar = run("astar", grid);

    expect(bfs.cost).toBe(14); // linha reta: 5 passos normais + 1 pesado
    expect(dijkstra.cost).toBe(10); // desvio pela última linha
    expect(astar.cost).toBe(dijkstra.cost);
  });

  it("A* visita menos células que Dijkstra", () => {
    const grid = makeGrid(30, 30, [15, 2], [15, 27]);
    expect(run("astar", grid).visited).toBeLessThan(run("dijkstra", grid).visited);
  });

  it("devolve caminho vazio quando o destino é inalcançável", () => {
    const grid = makeGrid(5, 5, [0, 0], [4, 4]);
    for (let col = 0; col < 5; col++) grid.walls[2 * 5 + col] = 1;
    for (const key of Object.keys(pathAlgorithms)) {
      expect(run(key, grid).path).toEqual([]);
    }
  });
});
