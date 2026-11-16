import "./style.css";
import { setupPathView } from "./ui/pathView";
import { setupSortView } from "./ui/sortView";

const views = { sort: setupSortView(), path: setupPathView() };
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

function select(tab: HTMLButtonElement) {
  for (const other of tabs) {
    const active = other === tab;
    other.setAttribute("aria-selected", String(active));
    other.tabIndex = active ? 0 : -1;
    document.getElementById(other.getAttribute("aria-controls")!)!.hidden = !active;
  }
  views.sort.pause();
  views.path.pause();
}

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => select(tab));
  // Setas do teclado trocam de aba, como recomenda o padrão de acessibilidade de abas.
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = tabs[(i + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    select(next);
    next.focus();
  });
});
