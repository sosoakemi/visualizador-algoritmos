import { describe, expect, it } from "vitest";
import { MinHeap } from "../src/lib/minHeap";

describe("MinHeap", () => {
  it("devolve os itens em ordem de prioridade", () => {
    const heap = new MinHeap<number>();
    const values = Array.from({ length: 500 }, () => Math.floor(Math.random() * 1000));
    for (const v of values) heap.push(v, v);

    const out: number[] = [];
    while (heap.size > 0) out.push(heap.pop()!);
    expect(out).toEqual([...values].sort((a, b) => a - b));
  });

  it("desempata pela ordem de chegada", () => {
    const heap = new MinHeap<string>();
    heap.push("a", 1);
    heap.push("b", 1);
    heap.push("c", 0);
    expect([heap.pop(), heap.pop(), heap.pop(), heap.pop()]).toEqual(["c", "a", "b", undefined]);
  });
});
