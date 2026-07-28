const FRAME_LIMIT_LOOP = `    while (remainingCells() && store.gameHistory.length < MAX_FRAMES) {
        yield updateGame(store);
    }`;
const BROKEN_FRAME_LIMIT_COMPLETION = `${FRAME_LIMIT_LOOP}
    yield updateGame(store);`;
const FIXED_FRAME_LIMIT_COMPLETION = `${FRAME_LIMIT_LOOP}
    if (remainingCells()) {
        const svg = _renderers_svg__WEBPACK_IMPORTED_MODULE_3__.SVG.generateAnimatedSVG(store);
        store.config.svgCallback(svg);
        if (store.config.gameStatsCallback) {
            store.config.gameStatsCallback({
                totalScore: store.pacman.totalPoints,
                steps: store.aliveSteps,
                ghostsEaten: store.pacman.ghostsEaten ?? 0
            });
        }
        store.config.gameOverCallback();
        return;
    }
    yield updateGame(store);`;

export function patchPacmanFrameLimit(source) {
  if (source.includes(`${FRAME_LIMIT_LOOP}\n    if (remainingCells()) {`)) {
    return source;
  }

  if (!source.includes(BROKEN_FRAME_LIMIT_COMPLETION)) {
    throw new Error('Pac-Man frame-limit patch target was not found.');
  }

  return source.replace(BROKEN_FRAME_LIMIT_COMPLETION, FIXED_FRAME_LIMIT_COMPLETION);
}
