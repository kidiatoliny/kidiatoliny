import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateStreaks,
  fetchGitHubProfileStats,
  normalizeGitHubProfileStats,
} from './github-profile-stats.mjs';

test('calculates current and longest contribution streaks', () => {
  const days = [
    { date: '2026-07-16', contributionCount: 1 },
    { date: '2026-07-17', contributionCount: 2 },
    { date: '2026-07-18', contributionCount: 0 },
    { date: '2026-07-19', contributionCount: 3 },
    { date: '2026-07-20', contributionCount: 4 },
    { date: '2026-07-21', contributionCount: 0 },
  ];

  assert.deepEqual(calculateStreaks(days, '2026-07-21'), { current: 2, longest: 2 });
});

test('does not carry a current streak across a missed previous day', () => {
  const days = [
    { date: '2026-07-19', contributionCount: 2 },
    { date: '2026-07-20', contributionCount: 0 },
    { date: '2026-07-21', contributionCount: 0 },
  ];

  assert.deepEqual(calculateStreaks(days, '2026-07-21'), { current: 0, longest: 1 });
});

test('normalizes contribution totals and aggregates languages by size', () => {
  const stats = normalizeGitHubProfileStats(createFixture(), '2026-07-21');

  assert.equal(stats.year, 2026);
  assert.equal(stats.contributions, 42);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.longestStreak, 2);
  assert.deepEqual(stats.languages, [
    { name: 'PHP', share: 40 },
    { name: 'TypeScript', share: 40 },
    { name: 'Swift', share: 9 },
    { name: 'Rust', share: 7 },
    { name: 'Go', share: 4 },
  ]);
  assert.equal(stats.languages.reduce((sum, language) => sum + language.share, 0), 100);
});

test('fetches profile stats through GitHub GraphQL', async () => {
  const fetchImpl = async (_url, request) => {
    assert.equal(request.headers.authorization, 'Bearer github-token');
    assert.match(request.body, /contributionsCollection/u);

    return {
      ok: true,
      json: async () => createFixture(),
    };
  };

  const stats = await fetchGitHubProfileStats({
    token: 'github-token',
    username: 'kidiatoliny',
    year: 2026,
    today: '2026-07-21',
    fetchImpl,
  });

  assert.equal(stats.contributions, 42);
});

test('reports GitHub GraphQL errors', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ errors: [{ message: 'Query denied' }] }),
  });

  await assert.rejects(
    () => fetchGitHubProfileStats({
      token: 'github-token',
      username: 'kidiatoliny',
      year: 2026,
      fetchImpl,
    }),
    /Query denied/u,
  );
});

function createFixture() {
  return {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: 42,
            weeks: [
              {
                contributionDays: [
                  { date: '2026-07-18', contributionCount: 0 },
                  { date: '2026-07-19', contributionCount: 3 },
                  { date: '2026-07-20', contributionCount: 4 },
                  { date: '2026-07-21', contributionCount: 0 },
                ],
              },
            ],
          },
        },
        repositories: {
          nodes: [
            {
              languages: {
                edges: [
                  { size: 900, node: { name: 'PHP' } },
                  { size: 500, node: { name: 'TypeScript' } },
                  { size: 200, node: { name: 'Swift' } },
                ],
              },
            },
            {
              languages: {
                edges: [
                  { size: 400, node: { name: 'TypeScript' } },
                  { size: 150, node: { name: 'Rust' } },
                  { size: 100, node: { name: 'Go' } },
                  { size: 50, node: { name: 'Shell' } },
                ],
              },
            },
          ],
        },
      },
    },
  };
}
