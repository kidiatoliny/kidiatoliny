import assert from 'node:assert/strict';
import test from 'node:test';

import { REPOSITORY_OWNERS } from './repository-owners.mjs';

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

test('follows every repository page before aggregating', async () => {
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
      fetchImpl: createFetchImpl([], { unresolved: 'kriol-lang' }),
    }),
    /no repository owner for kriol-lang/u,
  );
});

const CONTRIBUTION_CALENDAR = {
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
};

const OWNER_REPOSITORY_PAGES = {
  kidiatoliny: [
    {
      cursor: 'kidiatoliny-page-2',
      nodes: [
        repository(['PHP', 900], ['TypeScript', 500], ['Swift', 200]),
        repository(['TypeScript', 400], ['Rust', 150], ['Go', 100], ['Shell', 50]),
      ],
    },
    { cursor: null, nodes: [repository(['PHP', 600], ['C', 200])] },
  ],
  'akira-io': [{ cursor: null, nodes: [repository(['PHP', 600], ['Go', 500], ['JavaScript', 300])] }],
  'akira-foundation': [
    { cursor: null, nodes: [repository(['Swift', 800], ['TypeScript', 300], ['Rust', 400])] },
  ],
  'Nos-Ferry': [
    {
      cursor: null,
      nodes: [repository(['PHP', 1500], ['TypeScript', 700], ['JavaScript', 200], ['Go', 200])],
    },
  ],
  'Bu-Payment': [{ cursor: null, nodes: [repository(['PHP', 900], ['TypeScript', 250])] }],
  'kriol-lang': [{ cursor: null, nodes: [repository(['C++', 700], ['C', 400], ['Shell', 100])] }],
};

function repository(...languages) {
  return { languages: { edges: languages.map(([name, size]) => ({ size, node: { name } })) } };
}

function everyFixtureRepository() {
  return Object.values(OWNER_REPOSITORY_PAGES).flatMap((pages) => pages.flatMap((page) => page.nodes));
}

function createFetchImpl(requests = [], { unresolved } = {}) {
  return async (_url, request) => {
    requests.push(request);

    const { variables } = JSON.parse(request.body);

    if (!Object.hasOwn(variables, 'after')) {
      return respond({ user: { contributionsCollection: { contributionCalendar: CONTRIBUTION_CALENDAR } } });
    }

    if (variables.login === unresolved) {
      return respond({ repositoryOwner: null });
    }

    const pages = OWNER_REPOSITORY_PAGES[variables.login];
    const page = variables.after === null
      ? pages[0]
      : pages.find((_candidate, index) => index > 0 && pages[index - 1].cursor === variables.after);

    return respond({
      repositoryOwner: {
        repositories: {
          nodes: page.nodes,
          pageInfo: { hasNextPage: page.cursor !== null, endCursor: page.cursor },
        },
      },
    });
  };
}

function respond(data) {
  return { ok: true, json: async () => ({ data }) };
}
