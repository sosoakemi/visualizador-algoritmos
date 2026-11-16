import { sortAlgorithms, type SortStep } from "../algorithms/sorting";
import { colors, fitCanvas, renderInfo } from "./canvas";
import { Player, playLabel, speedToSteps } from "./player";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function setupSortView() {
  const canvas = $<HTMLCanvasElement>("sort-canvas");
  const algoSelect = $<HTMLSelectElement>("sort-algo");
  const sizeInput = $<HTMLInputElement>("sort-size");
  const sizeOut = $<HTMLOutputElement>("sort-size-out");
  const speedInput = $<HTMLInputElement>("sort-speed");
  const playButton = $<HTMLButtonElement>("sort-play");
  const statusEl = $("sort-status");

  for (const [key, info] of Object.entries(sortAlgorithms)) {
    algoSelect.add(new Option(info.name, key));
  }
  algoSelect.value = "quick";

  let initial: number[] = [];
  let values: number[] = [];
  const sorted = new Set<number>();
  let mark: { i: number; j: number; type: "compare" | "swap" } | null = null;
  let compares = 0;
  let writes = 0;
  let ctx = fitCanvas(canvas, canvas.clientWidth, 320);

  const player = new Player<SortStep, void>({
    apply,
    finish() {
      mark = null;
      statusEl.textContent = "Ordenado";
    },
    render,
    stepsPerSecond: () => speedToSteps(Number(speedInput.value)),
    onStateChange(state) {
      playButton.textContent = playLabel(state);
      if (state === "running") statusEl.textContent = "Ordenando…";
      if (state === "paused" && compares > 0) statusEl.textContent = "Pausado";
    },
  });

  function apply(step: SortStep) {
    switch (step.type) {
      case "compare":
        compares++;
        mark = { i: step.i, j: step.j, type: "compare" };
        break;
      case "swap":
        [values[step.i], values[step.j]] = [values[step.j], values[step.i]];
        writes++;
        mark = { i: step.i, j: step.j, type: "swap" };
        break;
      case "set":
        values[step.i] = step.value;
        writes++;
        mark = { i: step.i, j: step.i, type: "swap" };
        break;
      case "sorted":
        sorted.add(step.i);
    }
  }

  function render() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    const n = values.length;
    const gap = n > 70 ? 1 : 2;
    const barWidth = (width - gap * (n - 1)) / n;

    values.forEach((value, index) => {
      const barHeight = (value / 100) * (height - 8);
      let color = sorted.has(index) ? colors.sorted : colors.bar;
      if (mark && (mark.i === index || mark.j === index)) {
        color = mark.type === "compare" ? colors.mint : colors.pink;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(index * (barWidth + gap), height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
    });

    $("sort-compares").textContent = compares.toLocaleString("pt-BR");
    $("sort-writes").textContent = writes.toLocaleString("pt-BR");
  }

  function resetRun() {
    player.reset();
    values = [...initial];
    sorted.clear();
    mark = null;
    compares = 0;
    writes = 0;
    statusEl.textContent = "Pronto";
    render();
  }

  function newArray() {
    const size = Number(sizeInput.value);
    initial = Array.from({ length: size }, () => 5 + Math.floor(Math.random() * 96));
    resetRun();
  }

  function prepare() {
    resetRun();
    player.load(sortAlgorithms[algoSelect.value].run([...initial]));
  }

  function showInfo() {
    const info = sortAlgorithms[algoSelect.value];
    renderInfo($("sort-info"), info.name, info.description, [
      ["Melhor caso", info.best],
      ["Caso médio", info.average],
      ["Pior caso", info.worst],
      ["Memória extra", info.space],
      ["Estável", info.stable ? "Sim" : "Não"],
    ]);
  }

  playButton.addEventListener("click", () => {
    if (player.state === "running") return player.pause();
    if (player.state === "idle" || player.state === "done") prepare();
    player.play();
  });

  $("sort-step").addEventListener("click", () => {
    if (player.state === "running") player.pause();
    if (player.state === "idle" || player.state === "done") prepare();
    player.step();
    render();
  });

  $("sort-shuffle").addEventListener("click", newArray);
  algoSelect.addEventListener("change", () => {
    showInfo();
    resetRun();
  });
  sizeInput.addEventListener("input", () => {
    sizeOut.textContent = sizeInput.value;
    newArray();
  });

  new ResizeObserver(() => {
    const height = canvas.clientWidth < 600 ? 240 : 320;
    ctx = fitCanvas(canvas, canvas.clientWidth, height);
    render();
  }).observe(canvas);

  showInfo();
  newArray();
  return { pause: () => player.pause() };
}
