import { pathAlgorithms, type Grid, type PathResult, type PathStep } from "../algorithms/pathfinding";
import { colors, fitCanvas, renderInfo } from "./canvas";
import { Player, playLabel, speedToSteps } from "./player";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
type Tool = "wall" | "weight" | "erase";
const HEAVY = 5;

export function setupPathView() {
  const canvas = $<HTMLCanvasElement>("path-canvas");
  const algoSelect = $<HTMLSelectElement>("path-algo");
  const speedInput = $<HTMLInputElement>("path-speed");
  const playButton = $<HTMLButtonElement>("path-play");
  const statusEl = $("path-status");

  for (const [key, info] of Object.entries(pathAlgorithms)) {
    algoSelect.add(new Option(info.name, key));
  }

  let rows = 0;
  let cols = 0;
  let cell = 0;
  let walls = new Uint8Array(0);
  let weights = new Uint8Array(0);
  let start = 0;
  let end = 0;
  let seen = new Uint8Array(0); // 1 = na fronteira, 2 = visitada
  let path: number[] = [];
  let shownPath = 0;
  let visitedCount = 0;
  let tool: Tool = "wall";
  let ctx = canvas.getContext("2d")!;

  const player = new Player<PathStep, PathResult>({
    apply(step) {
      if (step.type === "visit") {
        seen[step.cell] = 2;
        visitedCount++;
      } else if (!seen[step.cell]) {
        seen[step.cell] = 1;
      }
    },
    finish(result) {
      path = result.path;
      $("path-length").textContent = String(Math.max(path.length - 1, 0));
      $("path-cost").textContent = String(result.cost);
      statusEl.textContent = path.length ? "Caminho encontrado" : "Não há caminho até o fim";
      revealPath();
    },
    render,
    stepsPerSecond: () => speedToSteps(Number(speedInput.value)),
    onStateChange(state) {
      playButton.textContent = playLabel(state);
      if (state === "running") statusEl.textContent = "Procurando…";
      if (state === "paused" && visitedCount > 0) statusEl.textContent = "Pausado";
    },
  });

  // Desenha o caminho aos poucos depois que a busca termina.
  function revealPath() {
    shownPath = 0;
    const speed = Math.max(1, Math.ceil(path.length / 45));
    const tick = () => {
      shownPath = Math.min(path.length, shownPath + speed);
      render();
      if (shownPath < path.length && player.state === "done") requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const index = (row: number, col: number) => row * cols + col;

  // Número ímpar de colunas, necessário para o gerador de labirinto.
  const colsFor = (width: number) => {
    const count = Math.max(15, Math.min(61, Math.floor(width / 24)));
    return count % 2 === 0 ? count - 1 : count;
  };

  function buildGrid(width: number) {
    cols = colsFor(width);
    rows = width < 600 ? 25 : 21;
    cell = width / cols;
    walls = new Uint8Array(rows * cols);
    weights = new Uint8Array(rows * cols).fill(1);
    const mid = Math.floor(rows / 2);
    start = index(mid, 2);
    end = index(mid, cols - 3);
    // Uma parede inicial com passagens em cima e embaixo, para a comparação ficar interessante.
    const wallCol = Math.floor(cols / 2);
    for (let row = 3; row < rows - 3; row++) walls[index(row, wallCol)] = 1;
    clearRun();
    ctx = fitCanvas(canvas, width, rows * cell);
    render();
  }

  function clearRun() {
    player.reset();
    seen = new Uint8Array(rows * cols);
    path = [];
    shownPath = 0;
    visitedCount = 0;
    $("path-length").textContent = "0";
    $("path-cost").textContent = "0";
    statusEl.textContent = "Pronto";
  }

  function generateMaze() {
    walls.fill(1);
    weights.fill(1);
    const stack = [index(1, 1)];
    walls[stack[0]] = 0;
    while (stack.length) {
      const current = stack[stack.length - 1];
      const row = Math.floor(current / cols);
      const col = current % cols;
      const options = [
        [row - 2, col],
        [row + 2, col],
        [row, col - 2],
        [row, col + 2],
      ].filter(([r, c]) => r > 0 && c > 0 && r < rows - 1 && c < cols - 1 && walls[index(r, c)]);
      if (!options.length) {
        stack.pop();
        continue;
      }
      const [r, c] = options[Math.floor(Math.random() * options.length)];
      walls[index((row + r) / 2, (col + c) / 2)] = 0;
      walls[index(r, c)] = 0;
      stack.push(index(r, c));
    }
    // Abre algumas paredes extras para existir mais de um caminho.
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const i = index(row, col);
        const horizontal = !walls[i - 1] && !walls[i + 1];
        const vertical = !walls[i - cols] && !walls[i + cols];
        if (walls[i] && (horizontal || vertical) && Math.random() < 0.1) walls[i] = 0;
      }
    }
    start = index(1, 1);
    end = index(rows - 2, cols - 2);
    clearRun();
    render();
  }

  function render() {
    const width = cols * cell;
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(0, 0, width, rows * cell);
    const onPath = new Set(path.slice(0, shownPath));

    for (let i = 0; i < rows * cols; i++) {
      const x = (i % cols) * cell;
      const y = Math.floor(i / cols) * cell;
      ctx.fillStyle = walls[i] ? colors.wall : weights[i] > 1 ? colors.weight : colors.cell;
      ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

      if (!walls[i] && weights[i] > 1) {
        ctx.fillStyle = colors.weightDot;
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      if (onPath.has(i)) {
        ctx.fillStyle = colors.pink;
        ctx.fillRect(x + cell * 0.2, y + cell * 0.2, cell * 0.6, cell * 0.6);
      } else if (seen[i]) {
        ctx.fillStyle = seen[i] === 2 ? colors.visited : colors.frontier;
        ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      }
    }

    const center = (i: number) => [(i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2];
    const [sx, sy] = center(start);
    ctx.fillStyle = colors.mint;
    ctx.beginPath();
    ctx.arc(sx, sy, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();

    const [ex, ey] = center(end);
    ctx.strokeStyle = colors.pink;
    ctx.lineWidth = Math.max(2, cell * 0.12);
    ctx.beginPath();
    ctx.arc(ex, ey, cell * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    $("path-visited").textContent = visitedCount.toLocaleString("pt-BR");
  }

  function prepare() {
    clearRun();
    const grid: Grid = { rows, cols, walls: walls.slice(), weights: weights.slice(), start, end };
    player.load(pathAlgorithms[algoSelect.value].run(grid));
  }

  // ---- desenho com o mouse ou o dedo ----
  let dragging: "start" | "end" | "paint" | null = null;
  let paintValue = 1;

  const cellAt = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((event.clientX - rect.left) / cell);
    const row = Math.floor((event.clientY - rect.top) / cell);
    if (row < 0 || col < 0 || row >= rows || col >= cols) return -1;
    return index(row, col);
  };

  function paint(i: number) {
    if (i === start || i === end) return;
    if (tool === "wall") {
      walls[i] = paintValue;
      if (paintValue) weights[i] = 1;
    } else if (tool === "weight") {
      walls[i] = 0;
      weights[i] = paintValue ? HEAVY : 1;
    } else {
      walls[i] = 0;
      weights[i] = 1;
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    const i = cellAt(event);
    if (i < 0) return;
    if (player.state !== "idle") clearRun();
    canvas.setPointerCapture(event.pointerId);
    if (i === start || i === end) {
      dragging = i === start ? "start" : "end";
    } else {
      dragging = "paint";
      // Se começar em cima de uma parede, o arraste apaga. Senão, desenha.
      paintValue = tool === "wall" ? (walls[i] ? 0 : 1) : tool === "weight" ? (weights[i] > 1 ? 0 : 1) : 0;
      paint(i);
    }
    render();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const i = cellAt(event);
    if (i < 0) return;
    if (dragging === "paint") paint(i);
    else if (!walls[i] && i !== start && i !== end) {
      if (dragging === "start") start = i;
      else end = i;
    }
    render();
  });

  const stopDrag = () => (dragging = null);
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);

  // ---- controles ----
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tool]")) {
    button.addEventListener("click", () => {
      tool = button.dataset.tool as Tool;
      for (const other of document.querySelectorAll("[data-tool]")) {
        other.setAttribute("aria-pressed", String(other === button));
      }
    });
  }

  playButton.addEventListener("click", () => {
    if (player.state === "running") return player.pause();
    if (player.state === "idle" || player.state === "done") prepare();
    player.play();
  });

  $("path-maze").addEventListener("click", generateMaze);
  $("path-clear").addEventListener("click", () => buildGrid(canvas.clientWidth));

  function showInfo() {
    const info = pathAlgorithms[algoSelect.value];
    renderInfo($("path-info"), info.name, info.description, [
      ["Menor caminho", info.shortest],
      ["Considera peso", info.weights ? "Sim" : "Não"],
    ]);
  }
  algoSelect.addEventListener("change", () => {
    showInfo();
    clearRun();
    render();
  });

  let lastWidth = 0;
  new ResizeObserver(() => {
    const width = canvas.clientWidth;
    if (!width || Math.abs(width - lastWidth) < 1) return;
    lastWidth = width;
    // Só refaz a grade se o número de colunas mudar; senão, apenas redimensiona.
    if (colsFor(width) !== cols || !walls.length) buildGrid(width);
    else {
      cell = width / cols;
      ctx = fitCanvas(canvas, width, rows * cell);
      render();
    }
  }).observe(canvas);

  showInfo();
  return { pause: () => player.pause() };
}
