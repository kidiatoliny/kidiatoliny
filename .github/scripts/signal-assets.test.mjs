import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workAssets = [
  readFileSync('assets/signal-work-light.svg', 'utf8'),
  readFileSync('assets/signal-work-dark.svg', 'utf8'),
];

test('keeps the NosFerry description inside the dominant card in both themes', () => {
  for (const svg of workAssets) {
    assert.match(svg, /<text x="48" y="178"[^>]*>Production infrastructure for ticketing, passenger operations,<\/text>/u);
    assert.match(svg, /<text x="48" y="208"[^>]*>refunds, company sales, support, audit, HR,<\/text>/u);
    assert.match(svg, /<text x="48" y="238"[^>]*>and back-office workflows\.<\/text>/u);
    assert.doesNotMatch(svg, /HR, and back-office workflows/u);
  }
});
