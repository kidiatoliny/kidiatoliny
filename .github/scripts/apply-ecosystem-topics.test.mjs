import assert from 'node:assert/strict';
import test from 'node:test';

import { groupTopicsByRepository, mergeTopics, readTopicMapping } from './apply-ecosystem-topics.mjs';
import { readEcosystemConfig } from './ecosystem-card.mjs';

test('gives a repository every topic it appears under', () => {
  const byRepository = groupTopicsByRepository({
    'akira-product': ['akira-foundation/unified-dev-swift', 'kidiatoliny/hunter'],
    'akira-apple-native': ['akira-foundation/unified-dev-swift'],
  });

  assert.deepEqual(byRepository.get('akira-foundation/unified-dev-swift'), ['akira-product', 'akira-apple-native']);
  assert.deepEqual(byRepository.get('kidiatoliny/hunter'), ['akira-product']);
});

test('keeps topics a repository already carries', () => {
  const merged = mergeTopics(['react', 'rust', 'tauri'], ['akira-product']);

  assert.deepEqual(merged, ['akira-product', 'react', 'rust', 'tauri']);
});

test('never duplicates a topic that is already set', () => {
  assert.deepEqual(mergeTopics(['akira-product'], ['akira-product']), ['akira-product']);
});

test('maps only topics the ecosystem card renders', () => {
  const mapping = readTopicMapping();
  const rendered = readEcosystemConfig().categories.map((category) => category.topic);

  assert.deepEqual(Object.keys(mapping).sort(), [...rendered].sort());
});

test('matches the counts the card is expected to show', () => {
  const mapping = readTopicMapping();

  assert.equal(mapping['akira-product'].length, 9);
  assert.equal(mapping['akira-apple-native'].length, 5);
  assert.equal(mapping['akira-payments'].length, 10);
  assert.equal(mapping['akira-foundations'].length, 31);
});

test('names every repository as owner/name', () => {
  for (const repositories of Object.values(readTopicMapping())) {
    for (const repository of repositories) {
      assert.match(repository, /^[\w.-]+\/[\w.-]+$/u);
    }
  }
});

test('lists no repository twice inside one topic', () => {
  for (const [topic, repositories] of Object.entries(readTopicMapping())) {
    assert.equal(new Set(repositories).size, repositories.length, `${topic} repeats a repository`);
  }
});
