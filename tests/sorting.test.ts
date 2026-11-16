import { describe, expect, it } from "vitest";
import { sortAlgorithms, type SortStep } from "../src/algorithms/sorting";

const randomArray = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 20));

// Reaplica os passos em uma cópia: assim garantimos que a animação mostra exatamente o que o algoritmo fez.
function replay(input: number[], steps: SortStep[]) {
  const copy = [...input];
  const sorted = new Set<number>();
  for (const step of steps) {
    if (step.type === "swap") [copy[step.i], copy[step.j]] = [copy[step.j], copy[step.i]];
    if (step.type === "set") copy[step.i] = step.value;
    if (step.type === "sorted") sorted.add(step.i);
  }
  return { copy, sorted };
}

describe.each(Object.entries(sortAlgorithms))("%s", (_key, algorithm) => {
  it.each([0, 1, 2, 7, 64])("ordena vetores de tamanho %i", (n) => {
    for (let round = 0; round < 20; round++) {
      const input = randomArray(n);
      const working = [...input];
      const steps = [...algorithm.run(working)];
      const expected = [...input].sort((a, b) => a - b);

      expect(working).toEqual(expected);
      const { copy, sorted } = replay(input, steps);
      expect(copy).toEqual(expected);
      expect(sorted.size).toBe(n);
    }
  });

  it("lida com vetor já ordenado e invertido", () => {
    for (const input of [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]]) {
      const working = [...input];
      [...algorithm.run(working)];
      expect(working).toEqual([1, 2, 3, 4, 5]);
    }
  });
});

describe("características", () => {
  it("bubble sort termina cedo em vetor já ordenado (melhor caso O(n))", () => {
    const steps = [...sortAlgorithms.bubble.run([1, 2, 3, 4, 5, 6, 7, 8])];
    expect(steps.filter((s) => s.type === "compare")).toHaveLength(7);
  });
});
