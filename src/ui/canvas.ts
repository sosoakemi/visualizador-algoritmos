/** Ajusta o canvas à densidade de pixels da tela e devolve o contexto já escalado. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

export const colors = {
  bar: "#4a5368",
  mint: "#5eead4",
  pink: "#ff7ab6",
  sorted: "rgba(255, 122, 182, 0.45)",
  cell: "#161b25",
  wall: "#8b94a8",
  weight: "#262d3b",
  weightDot: "#6b7489",
  visited: "rgba(94, 234, 212, 0.18)",
  frontier: "rgba(94, 234, 212, 0.45)",
};

export function renderInfo(
  element: HTMLElement,
  name: string,
  description: string,
  rows: [string, string][],
) {
  element.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = name;
  const text = document.createElement("p");
  text.textContent = description;
  const list = document.createElement("dl");
  list.className = "complexity";
  for (const [label, value] of rows) {
    const item = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    item.append(dt, dd);
    list.append(item);
  }
  element.append(title, text, list);
}
