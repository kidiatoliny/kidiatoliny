import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { patchPacmanFrameLimit } from './pacman-generator-patch.mjs';

test('finalizes the Pac-Man SVG when the compiled renderer reaches its frame limit', async () => {
  const callbackOrder = [];
  const store = {
    aliveSteps: 42,
    gameHistory: { length: 3000 },
    ghosts: [],
    grid: [[{ commitsCount: 1 }]],
    pacman: { ghostsEaten: 3, totalPoints: 99 },
    config: {
      svgCallback: (svg) => callbackOrder.push(['svg', svg]),
      gameStatsCallback: (stats) => callbackOrder.push(['stats', stats]),
      gameOverCallback: () => callbackOrder.push(['gameOver']),
    },
  };
  const bundleSource = createFrameLimitFixture();
  const patchedSource = patchPacmanFrameLimit(bundleSource);
  const context = vm.createContext({ callbackOrder, store });

  vm.runInContext(patchedSource, context);
  await context.startGame(store);

  assert.deepEqual(JSON.parse(JSON.stringify(callbackOrder)), [
    ['svg', '<svg>frame-limit</svg>'],
    ['stats', { totalScore: 99, steps: 42, ghostsEaten: 3 }],
    ['gameOver'],
  ]);
});

function createFrameLimitFixture() {
  return `
const __awaiter = (_thisArg, _arguments, _Promise, generator) => {
  const iterator = generator();

  return new Promise((resolve, reject) => {
    const step = (method, value) => {
      let result;

      try {
        result = iterator[method](value);
      } catch (error) {
        reject(error);
        return;
      }

      if (result.done) {
        resolve(result.value);
        return;
      }

      Promise.resolve(result.value).then(
        (nextValue) => step('next', nextValue),
        (error) => step('throw', error),
      );
    };

    step('next');
  });
};
const _renderers_svg__WEBPACK_IMPORTED_MODULE_3__ = {
  SVG: {
    generateAnimatedSVG: () => '<svg>frame-limit</svg>',
  },
};
const updateGame = () => {
  throw new Error('The renderer must finalize before another frame is processed.');
};
const startGame = (store) => __awaiter(void 0, void 0, void 0, function* () {
    const remainingCells = () => store.grid.some((row) => row.some((cell) => cell.commitsCount > 0));
    const MAX_FRAMES = 3000;
    while (remainingCells() && store.gameHistory.length < MAX_FRAMES) {
        yield updateGame(store);
    }
    yield updateGame(store);
});
globalThis.startGame = startGame;
`;
}
