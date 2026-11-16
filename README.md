# Visualizador de Algoritmos

![CI](https://github.com/sosoakemi/visualizador-algoritmos/actions/workflows/ci.yml/badge.svg)

Site interativo que mostra, passo a passo, como algoritmos clássicos funcionam.

- **Ordenação:** Bubble, Insertion, Selection, Merge e Quick Sort, com contagem de comparações e trocas e a complexidade de cada um.
- **Caminhos:** BFS, DFS, Dijkstra e A* em uma grade onde você desenha paredes e terreno pesado, ou gera um labirinto.

## Tecnologias

TypeScript, Vite, Canvas API e Vitest. Não usa framework de interface: todo o desenho é feito direto no canvas.

## Como funciona

Cada algoritmo é uma **função geradora** (`function*`). Ela executa o algoritmo de verdade e, a cada operação, emite um passo:

```ts
yield { type: "compare", i, j };
yield { type: "swap", i, j };
```

A interface só consome esses passos no ritmo escolhido. Com isso, os algoritmos ficam **separados da tela** e podem ser testados sem navegador.

```
src/
├── algorithms/
│   ├── sorting.ts       algoritmos de ordenação
│   └── pathfinding.ts   BFS, DFS, Dijkstra e A*
├── lib/
│   └── minHeap.ts       fila de prioridade (heap binário) usada por Dijkstra e A*
└── ui/
    ├── player.ts        executa os passos no ritmo escolhido
    ├── sortView.ts      tela de ordenação
    └── pathView.ts      tela de caminhos e editor da grade
```

## Testes

```bash
npm test
```

São 38 testes, que verificam:

- **Ordenação:** cada algoritmo ordena vetores aleatórios de vários tamanhos, com repetidos, já ordenados e invertidos. Os testes também **reaplicam os passos emitidos** para garantir que a animação mostra exatamente o que o algoritmo fez.
- **Caminhos:**
  - Os caminhos encontrados são válidos.
  - BFS, Dijkstra e A* acham o menor caminho.
  - Dijkstra e A* desviam do terreno pesado e o BFS não.
  - O A* visita menos células que o Dijkstra.
- **Fila de prioridade:** sai em ordem e desempata pela ordem de chegada.

## Como rodar

```bash
npm install
npm run dev
```

## O que dá para observar

- O **Merge Sort** faz sempre um número parecido de comparações. O **Quick Sort** costuma ser mais rápido, mas pode piorar.
- O **Bubble Sort** termina cedo quando o vetor já está quase ordenado.
- O **BFS** atravessa o terreno pesado porque só conta passos. **Dijkstra** e **A*** desviam dele.
- O **A*** explora bem menos células que o Dijkstra para chegar ao mesmo resultado.
