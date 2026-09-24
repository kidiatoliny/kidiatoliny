import assert from 'node:assert/strict';
import test from 'node:test';

import { ownerAlias, ownerVariables } from './repository-owners.mjs';

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

test('normalizes contribution totals and aggregates selected languages across all owners', () => {
  const stats = normalizeGitHubProfileStats(createFixture(), '2026-07-21');

  assert.equal(stats.year, 2026);
  assert.equal(stats.contributions, 42);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.longestStreak, 2);
  assert.deepEqual(stats.languages, [
    { name: 'PHP + Laravel', share: 43.8 },
    { name: 'TypeScript', share: 24.2 },
    { name: 'Swift + SwiftUI', share: 11.2 },
    { name: 'Go', share: 9 },
    { name: 'Rust', share: 6.2 },
    { name: 'JavaScript', share: 5.6 },
    { name: 'Python', share: 0 },
  ]);
  assert.equal(stats.languages.reduce((sum, language) => sum + language.share, 0), 100);
});

test('fetches profile stats through GitHub GraphQL', async () => {
  const fetchImpl = async (_url, request) => {
    assert.equal(request.headers.authorization, 'Bearer github-token');
    assert.match(request.body, /contributionsCollection/u);
    assert.match(request.body, /repositoryOwner/u);
    assert.match(request.body, /privacy: PUBLIC/u);
    assert.match(request.body, /isFork: false/u);

    const { variables } = JSON.parse(request.body);

    assert.deepEqual(variables, {
      ...ownerVariables(),
      login: 'kidiatoliny',
      from: '2026-01-01T00:00:00Z',
      to: '2026-07-21T23:59:59Z',
    });

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
      [ownerAlias('kidiatoliny')]: {
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
      [ownerAlias('akira-io')]: {
        repositories: {
          nodes: [
            {
              languages: {
                edges: [
                  { size: 600, node: { name: 'PHP' } },
                  { size: 500, node: { name: 'Go' } },
                  { size: 300, node: { name: 'JavaScript' } },
                ],
              },
            },
          ],
        },
      },
      [ownerAlias('akira-foundation')]: {
        repositories: {
          nodes: [
            {
              languages: {
                edges: [
                  { size: 800, node: { name: 'Swift' } },
                  { size: 300, node: { name: 'TypeScript' } },
                  { size: 400, node: { name: 'Rust' } },
                ],
              },
            },
          ],
        },
      },
      [ownerAlias('Nos-Ferry')]: {
        repositories: {
          nodes: [
            {
              languages: {
                edges: [
                  { size: 1500, node: { name: 'PHP' } },
                  { size: 700, node: { name: 'TypeScript' } },
                  { size: 200, node: { name: 'JavaScript' } },
                  { size: 200, node: { name: 'Go' } },
                ],
              },
            },
          ],
        },
      },
      [ownerAlias('Bu-Payment')]: {
        repositories: {
          nodes: [
            {
              languages: {
                edges: [
                  { size: 900, node: { name: 'PHP' } },
                  { size: 250, node: { name: 'TypeScript' } },
                ],
              },
            },
          ],
        },
      },
    },
  };
}
