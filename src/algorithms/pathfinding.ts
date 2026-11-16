import { MinHeap } from "../lib/minHeap";

/** Grade: cada célula é um índice (linha * colunas + coluna). */
export type Grid = {
  rows: number;
  cols: number;
  walls: Uint8Array; // 1 = parede
  weights: Uint8Array; // custo para entrar na célula (1 = normal)
  start: number;
  end: number;
};

export type PathStep = { type: "visit"; cell: number } | { type: "frontier"; cell: number };
export type PathResult = { path: number[]; cost: number; visited: number };
export type PathGenerator = Generator<PathStep, PathResult, undefined>;

export function neighbors(grid: Grid, cell: number): number[] {
  const { rows, cols, walls } = grid;
  const row = Math.floor(cell / cols);
  const col = cell % cols;
  const result: number[] = [];
  if (row > 0) result.push(cell - cols);
  if (col < cols - 1) result.push(cell + 1);
  if (row < rows - 1) result.push(cell + cols);
  if (col > 0) result.push(cell - 1);
  return result.filter((n) => !walls[n]);
}

const manhattan = (grid: Grid, a: number, b: number) =>
  Math.abs(Math.floor(a / grid.cols) - Math.floor(b / grid.cols)) +
  Math.abs((a % grid.cols) - (b % grid.cols));

function buildResult(grid: Grid, previous: Int32Array, visited: number): PathResult {
  if (grid.start !== grid.end && previous[grid.end] === -1) return { path: [], cost: 0, visited };
  const path: number[] = [];
  for (let cell = grid.end; cell !== -1; cell = previous[cell]) path.push(cell);
  path.reverse();
  const cost = path.slice(1).reduce((sum, cell) => sum + grid.weights[cell], 0);
  return { path, cost, visited };
}

/** Busca em largura: menor número de passos, mas ignora os pesos. */
export function* bfs(grid: Grid): PathGenerator {
  const previous = new Int32Array(grid.walls.length).fill(-1);
  const seen = new Uint8Array(grid.walls.length);
  const queue = [grid.start];
  seen[grid.start] = 1;
  let visited = 0;

  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    visited++;
    yield { type: "visit", cell };
    if (cell === grid.end) break;
    for (const next of neighbors(grid, cell)) {
      if (seen[next]) continue;
      seen[next] = 1;
      previous[next] = cell;
      queue.push(next);
      yield { type: "frontier", cell: next };
    }
  }
  return buildResult(grid, previous, visited);
}

/** Busca em profundidade: vai fundo em um caminho antes de voltar. Não garante o menor. */
export function* dfs(grid: Grid): PathGenerator {
  const previous = new Int32Array(grid.walls.length).fill(-1);
  const seen = new Uint8Array(grid.walls.length);
  const stack = [grid.start];
  let visited = 0;

  while (stack.length > 0) {
    const cell = stack.pop()!;
    if (seen[cell]) continue;
    seen[cell] = 1;
    visited++;
    yield { type: "visit", cell };
    if (cell === grid.end) break;
    // Empilha ao contrário para explorar na ordem cima, direita, baixo, esquerda.
    for (const next of neighbors(grid, cell).reverse()) {
      if (seen[next]) continue;
      previous[next] = cell;
      stack.push(next);
      yield { type: "frontier", cell: next };
    }
  }
  return buildResult(grid, previous, visited);
}

/**
 * Dijkstra e A* compartilham a mesma estrutura. A única diferença é a heurística:
 * Dijkstra usa 0, e A* soma a distância estimada até o destino.
 */
function* bestFirst(grid: Grid, heuristic: (cell: number) => number): PathGenerator {
  const size = grid.walls.length;
  const previous = new Int32Array(size).fill(-1);
  const distance = new Float64Array(size).fill(Infinity);
  const done = new Uint8Array(size);
  const heap = new MinHeap<number>();
  distance[grid.start] = 0;
  heap.push(grid.start, heuristic(grid.start));
  let visited = 0;

  while (heap.size > 0) {
    const cell = heap.pop()!;
    if (done[cell]) continue; // entrada antiga na fila, já processada
    done[cell] = 1;
    visited++;
    yield { type: "visit", cell };
    if (cell === grid.end) break;

    for (const next of neighbors(grid, cell)) {
      const candidate = distance[cell] + grid.weights[next];
      if (candidate < distance[next]) {
        distance[next] = candidate;
        previous[next] = cell;
        heap.push(next, candidate + heuristic(next));
        yield { type: "frontier", cell: next };
      }
    }
  }
  return buildResult(grid, previous, visited);
}

export const dijkstra = (grid: Grid) => bestFirst(grid, () => 0);

/** A distância de Manhattan nunca superestima (o menor peso é 1), então o A* acha o caminho ótimo. */
export const aStar = (grid: Grid) => bestFirst(grid, (cell) => manhattan(grid, cell, grid.end));

export type PathInfo = {
  name: string;
  run: (grid: Grid) => PathGenerator;
  shortest: string;
  weights: boolean;
  description: string;
};

export const pathAlgorithms: Record<string, PathInfo> = {
  astar: {
    name: "A*",
    run: aStar,
    shortest: "Sim",
    weights: true,
    description: "Dijkstra com uma estimativa da distância até o destino. Explora bem menos células e ainda acha o caminho mais barato.",
  },
  dijkstra: {
    name: "Dijkstra",
    run: dijkstra,
    shortest: "Sim",
    weights: true,
    description: "Sempre expande a célula mais barata de alcançar. Garante o menor custo, mas se espalha em todas as direções.",
  },
  bfs: {
    name: "Busca em largura (BFS)",
    run: bfs,
    shortest: "Em passos",
    weights: false,
    description: "Explora em ondas, camada por camada. Acha o caminho com menos passos, mas ignora o peso do terreno.",
  },
  dfs: {
    name: "Busca em profundidade (DFS)",
    run: dfs,
    shortest: "Não",
    weights: false,
    description: "Segue um caminho até o fim antes de voltar. Usa pouca memória, mas costuma achar caminhos longos.",
  },
};
