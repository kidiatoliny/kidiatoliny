import assert from 'node:assert/strict';
import test from 'node:test';

import { renderGitHubStatsTerminal } from './github-stats-terminal.mjs';

const stats = {
  year: 2026,
  contributions: 2451,
  currentStreak: 18,
  longestStreak: 47,
  languages: ['PHP', 'TypeScript', 'Swift', 'Rust', 'Go'],
};

test('renders profile statistics and current stack', () => {
  const svg = renderGitHubStatsTerminal(stats, 'github-dark');

  assert.match(svg, /github-stats --year 2026/u);
  assert.match(svg, /2,451/u);
  assert.match(svg, /current streak/u);
  assert.match(svg, /longest streak/u);
  assert.match(svg, /PHP · TypeScript · Swift · Rust · Go/u);
  assert.match(svg, /Swift · SwiftUI · App Intents · Live Activities/u);
  assert.doesNotMatch(svg, /pull requests|commits/u);
});

test('renders synchronized light and dark palettes', () => {
  assert.match(renderGitHubStatsTerminal(stats, 'github'), /#ffffff/u);
  assert.match(renderGitHubStatsTerminal(stats, 'github-dark'), /#0d1117/u);
});

test('escapes dynamic language names', () => {
  const svg = renderGitHubStatsTerminal({ ...stats, languages: ['C++', 'A&B'] }, 'github');

  assert.match(svg, /A&amp;B/u);
});
