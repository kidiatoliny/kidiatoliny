import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workAssets = [
  readFileSync('assets/signal-work-light.svg', 'utf8'),
  readFileSync('assets/signal-work-dark.svg', 'utf8'),
];
const identityLight = readFileSync('assets/signal-identity-light.svg', 'utf8');
const identityDark = readFileSync('assets/signal-identity-dark.svg', 'utf8');
const [workLight, workDark] = workAssets;

test('keeps the NosFerry description inside the dominant card in both themes', () => {
  for (const svg of workAssets) {
    assert.match(svg, /<text x="48" y="178"[^>]*>Production infrastructure for ticketing, passenger operations,<\/text>/u);
    assert.match(svg, /<text x="48" y="208"[^>]*>refunds, company sales, support, audit, HR,<\/text>/u);
    assert.match(svg, /<text x="48" y="238"[^>]*>and back-office workflows\.<\/text>/u);
    assert.doesNotMatch(svg, /HR, and back-office workflows/u);
  }
});

test('remaps only the identity, NosFerry, and Apple native card colors', () => {
  assert.match(identityLight, /<rect x="18" y="18" width="790" height="324" rx="17" fill="#6C4CF1"/u);
  assert.match(identityDark, /<rect x="18" y="18" width="790" height="324" rx="17" fill="#9B7BFF"/u);
  assert.match(workLight, /<rect x="18" y="72" width="710" height="430" rx="17" fill="#6C4CF1"/u);
  assert.match(workLight, /<rect x="746" y="72" width="436" height="205" rx="17" fill="#FF6B4A"/u);
  assert.match(workDark, /<rect x="18" y="72" width="710" height="430" rx="17" fill="#9B7BFF"/u);
  assert.match(workDark, /<rect x="746" y="72" width="436" height="205" rx="17" fill="#FF8066"/u);

  assert.match(workLight, /fill="#2867e8"/u);
  assert.match(workDark, /fill="#78a9ff"/u);
  assert.doesNotMatch(workLight, /#6f52d9/u);
  assert.doesNotMatch(workDark, /#8065e7/u);
});
