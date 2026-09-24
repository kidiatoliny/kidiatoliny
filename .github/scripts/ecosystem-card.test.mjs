import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countEcosystemTopics,
  fetchEcosystemCounts,
  formatCount,
  readEcosystemConfig,
  renderEcosystemCard,
} from './ecosystem-card.mjs';
import { ownerAlias } from './repository-owners.mjs';

const TOPICS = ['akira-product', 'akira-apple-native', 'akira-payments', 'akira-foundations'];

function repository(...topics) {
  return { repositoryTopics: { nodes: topics.map((name) => ({ topic: { name } })) } };
}

function createFixture() {
  return {
    data: {
      [ownerAlias('kidiatoliny')]: {
        repositories: { nodes: [repository('akira-product'), repository('akira-foundations', 'laravel'), repository()] },
      },
      [ownerAlias('akira-io')]: {
        repositories: { nodes: [repository('akira-payments'), repository('akira-payments'), repository('akira-foundations')] },
      },
      [ownerAlias('akira-foundation')]: {
        repositories: { nodes: [repository('akira-apple-native')] },
      },
      [ownerAlias('Nos-Ferry')]: { repositories: { nodes: [] } },
      [ownerAlias('Bu-Payment')]: {
        repositories: { nodes: [repository('akira-payments')] },
      },
    },
  };
}

test('counts repositories per ecosystem topic across every owner', () => {
  const counts = countEcosystemTopics(createFixture(), TOPICS);

  assert.equal(counts.get('akira-product'), 1);
  assert.equal(counts.get('akira-apple-native'), 1);
  assert.equal(counts.get('akira-payments'), 3);
  assert.equal(counts.get('akira-foundations'), 2);
});

test('ignores topics outside the ecosystem vocabulary', () => {
  const counts = countEcosystemTopics(createFixture(), TOPICS);

  assert.equal(counts.has('laravel'), false);
  assert.equal([...counts.keys()].length, TOPICS.length);
});

test('counts a repository once per topic it carries', () => {
  const payload = {
    data: {
      [ownerAlias('kidiatoliny')]: {
        repositories: { nodes: [repository('akira-product', 'akira-apple-native')] },
      },
    },
  };
  const counts = countEcosystemTopics(payload, TOPICS);

  assert.equal(counts.get('akira-product'), 1);
  assert.equal(counts.get('akira-apple-native'), 1);
});

test('pads counts below ten and leaves larger ones intact', () => {
  assert.equal(formatCount(0), '00');
  assert.equal(formatCount(7), '07');
  assert.equal(formatCount(25), '25');
});

test('renders every category with its live count in both themes', () => {
  const config = readEcosystemConfig();
  const counts = new Map([
    ['akira-product', 3],
    ['akira-apple-native', 4],
    ['akira-payments', 11],
    ['akira-foundations', 25],
  ]);

  for (const theme of ['github', 'github-dark']) {
    const svg = renderEcosystemCard(config, counts, theme);

    assert.match(svg, /<text x="42" y="279"[^>]*>03<\/text>/u);
    assert.match(svg, /<text x="336" y="279"[^>]*>04<\/text>/u);
    assert.match(svg, /<text x="630" y="279"[^>]*>11<\/text>/u);
    assert.match(svg, /<text x="924" y="279"[^>]*>25<\/text>/u);
    assert.match(svg, /Engineering ecosystem/u);
    assert.match(svg, /BREADTH WITHOUT A REPOSITORY WALL/u);
    assert.match(svg, /Active study, clearly separated from shipped work\./u);
    assert.doesNotMatch(svg, /undefined/u);
  }
});

test('keeps the acid and inverse cards distinguishable from the plain ones', () => {
  const config = readEcosystemConfig();
  const counts = new Map(TOPICS.map((topic) => [topic, 1]));
  const light = renderEcosystemCard(config, counts, 'github');
  const dark = renderEcosystemCard(config, counts, 'github-dark');

  assert.match(light, /<rect x="606" y="72" width="281" height="235" rx="16" fill="#c9ff4a"\/>/u);
  assert.match(light, /<rect x="900" y="72" width="282" height="235" rx="16" fill="#171b23"\/>/u);
  assert.match(dark, /<rect x="606" y="72" width="281" height="235" rx="16" fill="#c9ff4a"\/>/u);
  assert.match(dark, /<rect x="900" y="72" width="282" height="235" rx="16" fill="#18202d" stroke="#263145"\/>/u);
});

test('renders a zero count when a topic is on no repository', () => {
  const config = readEcosystemConfig();
  const svg = renderEcosystemCard(config, new Map(), 'github');

  assert.match(svg, /<text x="42" y="279"[^>]*>00<\/text>/u);
});

test('fetches ecosystem counts through GitHub GraphQL for every owner', async () => {
  const fetchImpl = async (_url, request) => {
    assert.equal(request.headers.authorization, 'Bearer github-token');
    assert.match(request.body, /repositoryTopics/u);
    assert.match(request.body, /privacy: PUBLIC/u);

    const { variables } = JSON.parse(request.body);

    assert.equal(variables[ownerAlias('kidiatoliny')], 'kidiatoliny');
    assert.equal(variables[ownerAlias('Bu-Payment')], 'Bu-Payment');

    return { ok: true, json: async () => createFixture() };
  };

  const counts = await fetchEcosystemCounts({ token: 'github-token', topics: TOPICS, fetchImpl });

  assert.equal(counts.get('akira-payments'), 3);
});

test('reports GitHub GraphQL errors', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Bad credentials' }] }) });

  await assert.rejects(
    () => fetchEcosystemCounts({ token: 'github-token', topics: TOPICS, fetchImpl }),
    /Bad credentials/u,
  );
});

test('keeps the configured topics aligned with the card categories', () => {
  const config = readEcosystemConfig();

  assert.deepEqual(config.categories.map((category) => category.topic), TOPICS);
  assert.equal(config.categories.length, 4);

  for (const category of config.categories) {
    assert.equal(category.lines.length, 3);
  }
});
