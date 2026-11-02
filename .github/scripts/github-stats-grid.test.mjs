import assert from 'node:assert/strict';
import test from 'node:test';

import { CARDS, renderGitHubStatsGrid } from './github-stats-grid.mjs';

const stats = {
  year: 2026,
  contributions: 2451,
  currentStreak: 18,
  longestStreak: 47,
  languages: [
    { name: 'PHP + Laravel', share: 36 },
    { name: 'TypeScript', share: 24 },
    { name: 'Swift + SwiftUI', share: 16 },
    { name: 'Go', share: 10 },
    { name: 'Rust', share: 8 },
    { name: 'JavaScript', share: 6 },
  ],
};

test('renders contributions, streaks, languages, and current stack', () => {
  const svg = renderGitHubStatsGrid(stats, 'github-dark');

  assert.match(svg, /2,451/u);
  assert.match(svg, /18 days/u);
  assert.match(svg, /47 days/u);
  assert.match(svg, /Core technology footprint/u);
  assert.match(svg, /WHERE THE WORK LIVES/u);
  assert.match(svg, /Swift \+ SwiftUI/u);
  assert.match(svg, /PHP \+ Laravel/u);
  assert.match(svg, /TypeScript/u);
  assert.match(svg, /JavaScript/u);
  assert.match(svg, /Swift · SwiftUI · SwiftData/u);
  assert.match(svg, /App Intents · Live Activities/u);
  assert.match(svg, /Node · Bun · Vite/u);
  assert.match(svg, /C · C\+\+ · LLVM · CMake/u);
  assert.match(svg, /Bison · Flex · Tree-sitter/u);
  assert.doesNotMatch(svg, /Language distribution|TOP PUBLIC REPOSITORIES|pull requests|commits|terminal|zsh|github-stats --year/u);
});

test('renders explicit light and dark palettes', () => {
  assert.match(renderGitHubStatsGrid(stats, 'github'), /#f7f8fa/u);
  assert.match(renderGitHubStatsGrid(stats, 'github-dark'), /#080b12/u);
});

test('escapes dynamic language names', () => {
  const svg = renderGitHubStatsGrid({ ...stats, languages: [{ name: 'A&B', share: 100 }] }, 'github');

  assert.match(svg, /A&amp;B/u);
});

test('keeps every language row and stack entry inside its card', () => {
  const svg = renderGitHubStatsGrid(
    { ...stats, languages: Array.from({ length: 9 }, (_, index) => ({ name: `Language ${index}`, share: 1 })) },
    'github',
  );

  assert.ok(lowestBaseline(svg, (x) => x < CARDS.stack.x) <= CARDS.languages.y + CARDS.languages.height);
  assert.ok(lowestBaseline(svg, (x) => x >= CARDS.stack.x) <= CARDS.stack.y + CARDS.stack.height);
});

function lowestBaseline(svg, matchesColumn) {
  let lowest = 0;

  for (const [, x, y, body] of svg.matchAll(/<text x="(\d+)" y="(\d+)"[^>]*>(.*?)<\/text>/gsu)) {
    if (!matchesColumn(Number(x))) {
      continue;
    }

    const lineOffsets = [...body.matchAll(/dy="(\d+)"/gu)].reduce((total, [, dy]) => total + Number(dy), 0);

    lowest = Math.max(lowest, Number(y) + lineOffsets);
  }

  return lowest;
}
