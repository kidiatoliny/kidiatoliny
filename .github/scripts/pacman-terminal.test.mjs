import assert from 'node:assert/strict';
import test from 'node:test';

import { wrapPacmanInTerminal } from './pacman-terminal.mjs';

const pacmanFixture = '<svg width="1166" height="184" xmlns="http://www.w3.org/2000/svg"><desc>pacman fixture</desc><rect width="100%" height="100%" fill="#ffffff"/></svg>';

test('wraps the Pacman graph as terminal command output', () => {
  const terminalSvg = wrapPacmanInTerminal(pacmanFixture, 'github-dark');

  assert.match(terminalSvg, /width="1200" height="480" viewBox="0 0 1200 480"/u);
  assert.match(terminalSvg, /> \.\/pacman<\/tspan>/u);
  assert.match(terminalSvg, /<svg x="17" y="278" width="1166" height="184" viewBox="0 0 1166 184">/u);
  assert.match(terminalSvg, /pacman fixture/u);
  assert.match(terminalSvg, /#0d1117/u);
});

test('uses a light terminal palette for the light contribution graph', () => {
  const terminalSvg = wrapPacmanInTerminal(pacmanFixture, 'github');

  assert.match(terminalSvg, /#ffffff/u);
  assert.match(terminalSvg, /#eaeef2/u);
  assert.match(terminalSvg, /#1a7f37/u);
});

test('rejects an SVG without explicit dimensions', () => {
  assert.throws(
    () => wrapPacmanInTerminal('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'github'),
    /Pacman SVG width was not found/u,
  );
});
