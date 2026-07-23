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
