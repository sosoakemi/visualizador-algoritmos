/**
 * Fila de prioridade (heap binário mínimo).
 * push e pop custam O(log n). Em caso de empate, sai primeiro quem entrou primeiro,
 * o que deixa os algoritmos determinísticos.
 */
export class MinHeap<T> {
  private items: { value: T; priority: number; order: number }[] = [];
  private counter = 0;

  get size() {
    return this.items.length;
  }

  push(value: T, priority: number) {
    this.items.push({ value, priority, order: this.counter++ });
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return top?.value;
  }

  private less(a: number, b: number) {
    const x = this.items[a];
    const y = this.items[b];
    return x.priority < y.priority || (x.priority === y.priority && x.order < y.order);
  }

  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!this.less(index, parent)) return;
      this.swap(index, parent);
      index = parent;
    }
  }

  private bubbleDown(index: number) {
    const n = this.items.length;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (left < n && this.less(left, smallest)) smallest = left;
      if (right < n && this.less(right, smallest)) smallest = right;
      if (smallest === index) return;
      this.swap(index, smallest);
      index = smallest;
    }
  }
}
