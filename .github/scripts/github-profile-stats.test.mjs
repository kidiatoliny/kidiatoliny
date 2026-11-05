import assert from 'node:assert/strict';
import test from 'node:test';

import { REPOSITORY_OWNERS } from './repository-owners.mjs';

import {
  CONTRIBUTION_CALENDAR,
  OWNER_REPOSITORY_PAGES,
  createFetchImpl,
  everyFixtureRepository,
} from './github-profile-stats.fixture.mjs';

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

test('normalizes contribution totals and aggregates selected languages', () => {
  const stats = normalizeGitHubProfileStats(
    { contributionCalendar: CONTRIBUTION_CALENDAR, repositories: everyFixtureRepository() },
    '2026-07-21',
  );

  assert.equal(stats.year, 2026);
  assert.equal(stats.contributions, 42);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.longestStreak, 2);
  assert.deepEqual(stats.languages, [
    { name: 'PHP + Laravel', share: 41.6 },
    { name: 'TypeScript', share: 19.9 },
    { name: 'Swift + SwiftUI', share: 9.3 },
    { name: 'Go', share: 7.4 },
    { name: 'C++', share: 6.5 },
    { name: 'C', share: 5.6 },
    { name: 'Rust', share: 5.1 },
    { name: 'JavaScript', share: 4.6 },
    { name: 'Python', share: 0 },
  ]);
  const total = stats.languages.reduce((sum, language) => sum + language.share, 0);

  assert.equal(Math.round(total * 10) / 10, 100);
});

test('reports a zero share for every language when no repository carries one', () => {
  const stats = normalizeGitHubProfileStats(
    { contributionCalendar: CONTRIBUTION_CALENDAR, repositories: [] },
    '2026-07-21',
  );

  assert.deepEqual(stats.languages.map((language) => language.share), [0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('fetches profile stats through GitHub GraphQL', async () => {
  const requests = [];
  const stats = await fetchGitHubProfileStats({
    token: 'github-token',
    username: 'kidiatoliny',
    year: 2026,
    today: '2026-07-21',
    fetchImpl: createFetchImpl(requests),
  });

  assert.equal(stats.contributions, 42);

  const [contributions, ...repositories] = requests;

  assert.equal(contributions.headers.authorization, 'Bearer github-token');
  assert.match(contributions.body, /contributionsCollection/u);
  assert.deepEqual(JSON.parse(contributions.body).variables, {
    login: 'kidiatoliny',
    from: '2026-01-01T00:00:00Z',
    to: '2026-07-21T23:59:59Z',
  });

  assert.ok(repositories.length > 0);

  for (const repositoryRequest of repositories) {
    assert.match(repositoryRequest.body, /repositoryOwner/u);
    assert.match(repositoryRequest.body, /isFork: false/u);
    assert.match(repositoryRequest.body, /hasNextPage/u);
    assert.doesNotMatch(repositoryRequest.body, /privacy: PUBLIC/u);
  }
});

test('asks every allowlisted owner for its repositories', async () => {
  const requests = [];

  await fetchGitHubProfileStats({
    token: 'github-token',
    username: 'kidiatoliny',
    year: 2026,
    today: '2026-07-21',
    fetchImpl: createFetchImpl(requests),
  });

  const asked = requests
    .map((request) => JSON.parse(request.body).variables.login)
    .filter((login) => REPOSITORY_OWNERS.includes(login));

  assert.deepEqual([...new Set(asked)].sort(), [...REPOSITORY_OWNERS].sort());
});

test('follows every repository page before aggregating', { timeout: 5000 }, async () => {
  const requests = [];
  const stats = await fetchGitHubProfileStats({
    token: 'github-token',
    username: 'kidiatoliny',
    year: 2026,
    today: '2026-07-21',
    fetchImpl: createFetchImpl(requests),
  });
  const continuations = requests
    .map((request) => JSON.parse(request.body).variables)
    .filter((variables) => variables.after);

  assert.deepEqual(continuations, [{ login: 'kidiatoliny', after: 'kidiatoliny-page-2' }]);
  assert.deepEqual(
    stats.languages.find((language) => language.name === 'PHP + Laravel'),
    { name: 'PHP + Laravel', share: 41.6 },
  );
});

test('refuses a page that claims a successor it cannot name', { timeout: 5000 }, async () => {
  await assert.rejects(
    () => fetchGitHubProfileStats({
      token: 'github-token',
      username: 'kidiatoliny',
      year: 2026,
      today: '2026-07-21',
      fetchImpl: createFetchImpl([], { danglingCursor: 'kriol-lang' }),
    }),
    /unusable page cursor for kriol-lang/u,
  );
});

test('refuses a cursor that never advances', { timeout: 5000 }, async () => {
  await assert.rejects(
    () => fetchGitHubProfileStats({
      token: 'github-token',
      username: 'kidiatoliny',
      year: 2026,
      today: '2026-07-21',
      fetchImpl: createFetchImpl([], { stuckCursor: 'kriol-lang' }),
    }),
    /unusable page cursor for kriol-lang/u,
  );
});

test('names every owner that failed, not just the first', { timeout: 5000 }, async () => {
  await assert.rejects(
    () => fetchGitHubProfileStats({
      token: 'github-token',
      username: 'kidiatoliny',
      year: 2026,
      today: '2026-07-21',
      fetchImpl: createFetchImpl([], { unresolved: ['kriol-lang', 'Bu-Payment'] }),
    }),
    (error) => /kriol-lang/u.test(error.message) && /Bu-Payment/u.test(error.message),
  );
});

test('covers every allowlisted owner in the fixture', () => {
  assert.deepEqual(Object.keys(OWNER_REPOSITORY_PAGES).sort(), [...REPOSITORY_OWNERS].sort());
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

test('reports a failed GitHub request by status', async () => {
  const fetchImpl = async () => ({ ok: false, status: 502 });

  await assert.rejects(
    () => fetchGitHubProfileStats({
      token: 'github-token',
      username: 'kidiatoliny',
      year: 2026,
      fetchImpl,
    }),
    /profile statistics request failed with status 502/u,
  );
});

test('refuses a payload where an owner resolved to nothing', async () => {
  await assert.rejects(
    () => fetchGitHubProfileStats({
      token: 'github-token',
      username: 'kidiatoliny',
      year: 2026,
      today: '2026-07-21',
      fetchImpl: createFetchImpl([], { unresolved: ['kriol-lang'] }),
    }),
    /no repository owner for kriol-lang/u,
  );
});
