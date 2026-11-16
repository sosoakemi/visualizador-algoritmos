export type PlayerState = "idle" | "running" | "paused" | "done";

type Options<S, R> = {
  apply: (step: S) => void;
  finish: (result: R) => void;
  render: () => void;
  stepsPerSecond: () => number;
  onStateChange: (state: PlayerState) => void;
};

/** Executa um gerador de passos no ritmo escolhido, desenhando no máximo uma vez por quadro. */
export class Player<S, R> {
  state: PlayerState = "idle";
  private generator: Generator<S, R, undefined> | null = null;
  private frameId = 0;
  private lastTime = 0;
  private budget = 0;

  constructor(private options: Options<S, R>) {}

  load(generator: Generator<S, R, undefined>) {
    this.reset();
    this.generator = generator;
    this.setState("paused");
  }

  reset() {
    cancelAnimationFrame(this.frameId);
    this.generator = null;
    this.budget = 0;
    this.setState("idle");
  }

  play() {
    if (!this.generator || this.state === "running") return;
    this.lastTime = performance.now();
    this.setState("running");
    this.frameId = requestAnimationFrame(this.frame);
  }

  pause() {
    if (this.state !== "running") return;
    cancelAnimationFrame(this.frameId);
    this.setState("paused");
  }

  /** Avança um passo. Devolve false quando o algoritmo terminou. */
  step(): boolean {
    if (!this.generator) return false;
    const next = this.generator.next();
    if (next.done) {
      cancelAnimationFrame(this.frameId);
      this.generator = null;
      this.setState("done");
      this.options.finish(next.value);
      return false;
    }
    this.options.apply(next.value);
    return true;
  }

  private frame = (now: number) => {
    this.budget += ((now - this.lastTime) / 1000) * this.options.stepsPerSecond();
    this.lastTime = now;
    let steps = Math.min(Math.floor(this.budget), 5000);
    this.budget -= steps;
    while (steps-- > 0 && this.step());
    this.options.render();
    if (this.state === "running") this.frameId = requestAnimationFrame(this.frame);
  };

  private setState(state: PlayerState) {
    this.state = state;
    this.options.onStateChange(state);
  }
}

/** Velocidade 1 a 10 vira 4 a 2048 passos por segundo (escala exponencial). */
export const speedToSteps = (value: number) => 2 ** (value + 1);

export const playLabel = (state: PlayerState) =>
  state === "running" ? "Pausar" : state === "paused" ? "Continuar" : state === "done" ? "Repetir" : "Iniciar";
