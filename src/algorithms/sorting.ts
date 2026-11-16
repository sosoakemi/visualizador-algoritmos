/**
 * Cada algoritmo é um gerador: ele ordena o vetor recebido e, a cada operação,
 * emite um passo que a interface usa para animar. Assim a lógica não depende da tela.
 */
export type SortStep =
  | { type: "compare"; i: number; j: number }
  | { type: "swap"; i: number; j: number }
  | { type: "set"; i: number; value: number }
  | { type: "sorted"; i: number };

export type SortGenerator = Generator<SortStep, void, undefined>;

function* markAllSorted(n: number): SortGenerator {
  for (let i = 0; i < n; i++) yield { type: "sorted", i };
}

export function* bubbleSort(a: number[]): SortGenerator {
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      yield { type: "compare", i, j: i + 1 };
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        yield { type: "swap", i, j: i + 1 };
        swapped = true;
      }
    }
    yield { type: "sorted", i: end };
    // Se uma passada inteira não trocou nada, o resto já está ordenado.
    if (!swapped) return yield* markAllSorted(end);
  }
  if (a.length > 0) yield { type: "sorted", i: 0 };
}

export function* insertionSort(a: number[]): SortGenerator {
  for (let i = 1; i < a.length; i++) {
    for (let j = i; j > 0; j--) {
      yield { type: "compare", i: j - 1, j };
      if (a[j - 1] <= a[j]) break;
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      yield { type: "swap", i: j - 1, j };
    }
  }
  yield* markAllSorted(a.length);
}

export function* selectionSort(a: number[]): SortGenerator {
  for (let i = 0; i < a.length; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      yield { type: "compare", i: min, j };
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      yield { type: "swap", i, j: min };
    }
    yield { type: "sorted", i };
  }
}

export function* mergeSort(a: number[]): SortGenerator {
  function* sort(lo: number, hi: number): SortGenerator {
    if (hi <= lo) return;
    const mid = (lo + hi) >> 1;
    yield* sort(lo, mid);
    yield* sort(mid + 1, hi);

    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      yield { type: "compare", i: lo + i, j: mid + 1 + j };
      // "<=" mantém a ordem de elementos iguais: por isso o merge sort é estável.
      a[k] = left[i] <= right[j] ? left[i++] : right[j++];
      yield { type: "set", i: k, value: a[k] };
      k++;
    }
    while (i < left.length) {
      a[k] = left[i++];
      yield { type: "set", i: k, value: a[k] };
      k++;
    }
    while (j < right.length) {
      a[k] = right[j++];
      yield { type: "set", i: k, value: a[k] };
      k++;
    }
  }

  yield* sort(0, a.length - 1);
  yield* markAllSorted(a.length);
}

export function* quickSort(a: number[]): SortGenerator {
  function* sort(lo: number, hi: number): SortGenerator {
    if (lo > hi) return;
    if (lo === hi) {
      yield { type: "sorted", i: lo };
      return;
    }
    // Partição de Lomuto: o último elemento é o pivô.
    let store = lo;
    for (let j = lo; j < hi; j++) {
      yield { type: "compare", i: j, j: hi };
      if (a[j] < a[hi]) {
        if (store !== j) {
          [a[store], a[j]] = [a[j], a[store]];
          yield { type: "swap", i: store, j };
        }
        store++;
      }
    }
    if (store !== hi) {
      [a[store], a[hi]] = [a[hi], a[store]];
      yield { type: "swap", i: store, j: hi };
    }
    yield { type: "sorted", i: store };
    yield* sort(lo, store - 1);
    yield* sort(store + 1, hi);
  }

  yield* sort(0, a.length - 1);
}

export type SortInfo = {
  name: string;
  run: (a: number[]) => SortGenerator;
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: boolean;
  description: string;
};

export const sortAlgorithms: Record<string, SortInfo> = {
  bubble: {
    name: "Bubble Sort",
    run: bubbleSort,
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: true,
    description: "Compara vizinhos e troca os que estão fora de ordem. A cada passada, o maior valor “borbulha” para o fim.",
  },
  insertion: {
    name: "Insertion Sort",
    run: insertionSort,
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: true,
    description: "Como organizar cartas na mão: pega o próximo elemento e o encaixa na posição certa da parte já ordenada.",
  },
  selection: {
    name: "Selection Sort",
    run: selectionSort,
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: false,
    description: "Procura o menor valor do que falta e o coloca na próxima posição. Faz poucas trocas, mas muitas comparações.",
  },
  merge: {
    name: "Merge Sort",
    run: mergeSort,
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(n)",
    stable: true,
    description: "Divide o vetor ao meio até sobrar um elemento e depois junta as metades já ordenadas. Dividir para conquistar.",
  },
  quick: {
    name: "Quick Sort",
    run: quickSort,
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
    stable: false,
    description: "Escolhe um pivô, deixa os menores à esquerda e os maiores à direita, e repete em cada lado. Rápido na prática.",
  },
};
