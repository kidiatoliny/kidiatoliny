import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/pacman.yml', 'utf8');

test('refreshes profile assets hourly and preserves manual and push triggers', () => {
  assert.match(workflow, /cron: "17 \* \* \* \*"/u);
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /push:\n    branches:\n      - main/u);
  assert.doesNotMatch(workflow, /0 \*\/12 \* \* \*/u);
});

test('generates the ecosystem card alongside the other profile assets', () => {
  const generator = readFileSync('.github/scripts/generate-pacman-current-year.mjs', 'utf8');

  assert.match(generator, /dist\/signal-ecosystem\.svg/u);
  assert.match(generator, /dist\/signal-ecosystem-dark\.svg/u);
  assert.match(generator, /fetchEcosystemCounts/u);
});

test('serves the ecosystem card from the output branch instead of a committed asset', () => {
  const readme = readFileSync('README.md', 'utf8');

  assert.match(readme, /output\/signal-ecosystem\.svg/u);
  assert.match(readme, /output\/signal-ecosystem-dark\.svg/u);
  assert.doesNotMatch(readme, /assets\/signal-ecosystem/u);
});
